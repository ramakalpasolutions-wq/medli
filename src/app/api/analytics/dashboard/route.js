import { NextResponse } from 'next/server'
import { prisma }       from '@/lib/prisma'
import { verifyAuth }   from '@/lib/middleware/auth.middleware'
import { checkRole }    from '@/lib/middleware/rbac.middleware'
import { cache }        from '@/lib/cache'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'regional_manager')

      const cacheKey = `analytics:dashboard:${user.role}:${user.userId}`
      const cached   = await cache.get(cacheKey)
      if (cached) return successResponse(cached)

      const now   = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // ── Overview counts ─────────────────────────────────────────────
      const [
        totalUsers,
        totalHospitals,
        totalLabs,
        totalDoctors,
        totalBookings,
        confirmedBookings,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.hospital.count({ where: { isApproved: true } }),
        prisma.lab.count({ where: { isApproved: true } }),
        prisma.doctor.count({ where: { isVerified: true } }),
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'confirmed' } }),
      ])

      // ── Today stats ─────────────────────────────────────────────────
      const [todayBookings, todayRevenue] = await Promise.all([
        prisma.booking.count({
          where: { createdAt: { gte: today } },
        }),
        prisma.booking.findMany({
          where:  {
            createdAt:     { gte: today },
            paymentStatus: 'paid',
          },
          select: { totalAmount: true },
        }).then((b) => b.reduce((s, x) => s + (Number(x.totalAmount) || 0), 0)),
      ])

      // ── Alerts ──────────────────────────────────────────────────────
      const [
        pendingHospitals,
        pendingLabs,
        pendingSettlements,
        pendingRefunds,
      ] = await Promise.all([
        prisma.hospital.count({ where: { isApproved: false } }),
        prisma.lab.count({ where: { isApproved: false } }),
        prisma.settlement.count({ where: { status: 'pending' } }),
        prisma.refund.count({ where: { status: 'pending' } }),
      ])

      // ── Recent bookings ─────────────────────────────────────────────
      const recentBookingsRaw = await prisma.booking.findMany({
        take:    10,
        orderBy: { createdAt: 'desc' },
        select: {
          id:          true,
          bookingId:   true,
          userId:      true,
          type:        true,
          status:      true,
          totalAmount: true,
          createdAt:   true,
        },
      })

      // Attach user names
      const userIds = [...new Set(recentBookingsRaw.map((b) => b.userId))]
      const users   = await prisma.user.findMany({
        where:  { id: { in: userIds } },
        select: { id: true, name: true },
      })
      const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

      const recentBookings = recentBookingsRaw.map((b) => ({
        ...b,
        userName: userMap[b.userId] || 'Unknown',
      }))

      // ── Bookings by status ──────────────────────────────────────────
      const statusGroups = await prisma.booking.groupBy({
        by:      ['status'],
        _count:  { status: true },
      })
      const bookingsByStatus = statusGroups.map((g) => ({
        status: g.status,
        count:  g._count.status,
      }))

      const result = {
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
          revenue:  todayRevenue,
        },
        alerts: {
          pendingHospitals,
          pendingLabs,
          pendingSettlements,
          pendingRefunds,
        },
        recentBookings,
        bookingsByStatus,
      }

      // Cache for 60 seconds
      await cache.set(cacheKey, result, 60)

      return successResponse(result)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/analytics/dashboard]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}