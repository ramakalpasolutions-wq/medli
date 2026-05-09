import { NextResponse }  from 'next/server'
import { prisma }        from '@/lib/prisma'
import { verifyAuth }    from '@/lib/middleware/auth.middleware'
import { getDateRange, buildChartData, getPaginationParams } from '@/lib/utils/helpers'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      // Only admins and regional managers
      const allowed = ['super_admin', 'regional_manager', 'hospital_admin', 'lab_admin']
      if (!allowed.includes(user.role)) {
        return errorResponse('Access denied', 403)
      }

      const { searchParams } = new URL(request.url)
      const preset   = searchParams.get('preset')   || 'last30'
      const dateFrom = searchParams.get('dateFrom')  || ''
      const dateTo   = searchParams.get('dateTo')    || ''

      const { from, to } = getDateRange(preset, dateFrom, dateTo)

      // Build entity filter based on role
      const bookingFilter = {
        createdAt:     { gte: from, lte: to },
        paymentStatus: 'paid',
      }

      if (user.role === 'hospital_admin') {
        // Find the hospital this admin manages
        const hospital = await prisma.hospital.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true },
        })
        if (hospital) bookingFilter.hospitalId = hospital.id
      } else if (user.role === 'lab_admin') {
        const lab = await prisma.lab.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true },
        })
        if (lab) bookingFilter.labId = lab.id
      }

      // Fetch all paid bookings in range
      const bookings = await prisma.booking.findMany({
        where:  bookingFilter,
        select: {
          id:          true,
          type:        true,
          totalAmount: true,
          platformFee: true,
          gst:         true,
          createdAt:   true,
        },
      })

      // Summary
      const totalRevenue     = bookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0)
      const totalPlatformFee = bookings.reduce((s, b) => s + (Number(b.platformFee) || 0), 0)
      const totalGst         = bookings.reduce((s, b) => s + (Number(b.gst) || 0), 0)
      const totalBookings    = bookings.length

      // Breakdown by booking type
      const breakdown = {}
      for (const b of bookings) {
        breakdown[b.type] = (breakdown[b.type] || 0) + (Number(b.totalAmount) || 0)
      }

      // Chart data — one point per day
      const chartData = buildChartData(bookings, from, to)

      return successResponse({
        summary: {
          totalRevenue,
          totalPlatformFee,
          totalGst,
          totalBookings,
        },
        breakdown,
        chartData,
        period: { from, to, preset },
      })

    } catch (error) {
      console.error('[GET /api/analytics/revenue]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}