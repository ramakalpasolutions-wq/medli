// src/app/api/analytics/dashboard/route.js
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { cache } from '@/lib/cache'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'regional_manager')

    const cacheKey = `analytics:dashboard:${user.id}`
    const cached   = await cache.get(cacheKey)
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
      return successResponse(parsed, 'From cache')
    }

    const now        = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,  0,  0)
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    const [
      totalUsers,
      totalHospitals,
      totalLabs,
      totalDoctors,
      totalBookings,
      confirmedBookings,
      todayBookings,
      todayRevenueAgg,
      pendingSettlements,
      pendingRefunds,
      pendingHospitals,
      pendingLabs,
      rawRecentBookings,
      bookingsByStatus,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.hospital.count({ where: { isApproved: true, isActive: true } }),
      prisma.lab.count({ where: { isApproved: true, isActive: true } }),
      prisma.doctor.count({ where: { isActive: true, isVerified: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'confirmed' } }),
      prisma.booking.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.booking.aggregate({
        where: { createdAt: { gte: todayStart, lte: todayEnd }, paymentStatus: 'paid' },
        _sum:  { totalAmount: true },
      }),
      prisma.settlement.count({ where: { status: 'pending' } }),
      prisma.refund.count({ where: { status: 'pending' } }),
      prisma.hospital.count({ where: { isApproved: false, isActive: true } }),
      prisma.lab.count({ where: { isApproved: false, isActive: true } }),
      // ✅ Recent bookings — fetch raw first, then attach names
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take:    10,
        select: {
          id:            true,
          bookingId:     true,
          userId:        true,
          type:          true,
          status:        true,
          paymentStatus: true,
          totalAmount:   true,
          createdAt:     true,
        },
      }),
      prisma.booking.groupBy({
        by:     ['status'],
        _count: { _all: true },
      }),
    ])

    // ── Attach user names to recent bookings ──────────────────────────────────
    const recentUserIds = [...new Set(rawRecentBookings.map((b) => b.userId).filter(Boolean))]
    const recentUsers   = recentUserIds.length > 0
      ? await prisma.user.findMany({
          where:  { id: { in: recentUserIds } },
          select: { id: true, name: true },
        })
      : []
    const recentUserMap  = Object.fromEntries(recentUsers.map((u) => [u.id, u]))
    const recentBookings = rawRecentBookings.map((b) => ({
      ...b,
      userName: recentUserMap[b.userId]?.name || null,
    }))

    const data = {
      overview: {
        totalUsers,
        totalHospitals,
        totalLabs,
        totalDoctors,
        totalBookings,
        confirmedBookings,
      },
      today: {
        bookings: todayBookings,
        revenue:  todayRevenueAgg._sum.totalAmount || 0,
      },
      alerts: {
        pendingSettlements,
        pendingRefunds,
        pendingHospitals,
        pendingLabs,
      },
      recentBookings,
      bookingsByStatus: bookingsByStatus.map((b) => ({
        status: b.status,
        count:  b._count._all,
      })),
      timestamp: new Date().toISOString(),
    }

    await cache.set(cacheKey, JSON.stringify(data), 60)
    return successResponse(data)
  } catch (err) {
    console.error('[Analytics Dashboard]', err.message)
    if (err.message?.includes('token') || err.message?.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    if (err.message?.includes('Access denied'))
      return errorResponse(err.message, 'FORBIDDEN', 403)
    return errorResponse('Failed to fetch analytics', 'SERVER_ERROR', 500)
  }
}