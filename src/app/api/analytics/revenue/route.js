// src/app/api/analytics/revenue/route.js
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getDateRange } from '@/lib/utils/helpers'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  try {
    const user = await verifyAuth(request)

    const allowed = ['super_admin', 'regional_manager', 'hospital_admin', 'lab_admin']
    if (!allowed.includes(user.role)) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const { searchParams } = new URL(request.url)
    const preset   = searchParams.get('preset')   || 'last30'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo   = searchParams.get('dateTo')
    const { from, to } = getDateRange(preset, dateFrom, dateTo)

    // ── Base filter ───────────────────────────────────────────────────────────
    const where = {
      createdAt:     { gte: from, lte: to },
      paymentStatus: 'paid',
    }

    // ── Scope by role ─────────────────────────────────────────────────────────
    if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findFirst({
        where: { adminUserId: user.id }, select: { id: true },
      })
      if (hospital) where.hospitalId = hospital.id
      else          where.hospitalId = 'none' // no results
    } else if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findFirst({
        where: { adminUserId: user.id }, select: { id: true },
      })
      if (lab) where.labId = lab.id
      else     where.labId = 'none'
    }

    const bookings = await prisma.booking.findMany({
      where,
      select: {
        totalAmount:  true,
        platformFee:  true,
        gst:          true,
        type:         true,
        createdAt:    true,
        status:       true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Aggregate
    const summary = {
      totalRevenue:     0,
      totalPlatformFee: 0,
      totalGst:         0,
      totalBookings:    bookings.length,
    }

    const byType    = {}
    const chartMap  = {}

    bookings.forEach((b) => {
      summary.totalRevenue     += b.totalAmount  || 0
      summary.totalPlatformFee += b.platformFee  || 0
      summary.totalGst         += b.gst          || 0

      byType[b.type] = (byType[b.type] || 0) + (b.totalAmount || 0)

      const day = new Date(b.createdAt).toISOString().split('T')[0]
      if (!chartMap[day]) chartMap[day] = { date: day, revenue: 0, bookings: 0, platformFee: 0 }
      chartMap[day].revenue     += b.totalAmount || 0
      chartMap[day].bookings    += 1
      chartMap[day].platformFee += b.platformFee || 0
    })

    const round = (n) => Math.round(n * 100) / 100

    return successResponse({
      summary: {
        totalRevenue:     round(summary.totalRevenue),
        totalPlatformFee: round(summary.totalPlatformFee),
        totalGst:         round(summary.totalGst),
        totalBookings:    summary.totalBookings,
      },
      chartData: Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date)),
      breakdown: byType,
      dateRange: { from, to },
    })
  } catch (err) {
    console.error('[Analytics Revenue]', err.message)
    if (err.message?.includes('token') || err.message?.includes('Unauthorized'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to fetch revenue analytics', 'SERVER_ERROR', 500)
  }
}