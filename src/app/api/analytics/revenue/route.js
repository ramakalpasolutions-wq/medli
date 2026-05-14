import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getDateRange, buildChartData } from '@/lib/utils/helpers'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      const allowed = ['super_admin', 'regional_manager', 'hospital_admin', 'lab_admin']
      if (!allowed.includes(user.role)) {
        return errorResponse('Access denied', 403)
      }

      const { searchParams } = new URL(request.url)
      const preset = searchParams.get('preset') || 'last30'
      const dateFrom = searchParams.get('dateFrom') || ''
      const dateTo = searchParams.get('dateTo') || ''

      const { from, to } = getDateRange(preset, dateFrom, dateTo)

      const bookingFilter = {
        createdAt: { gte: from, lte: to },
        paymentStatus: 'paid',
      }

      if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findFirst({
          where: { adminUserId: user.id },
          select: { id: true },
        })

        if (!hospital) {
          return successResponse({
            summary: {
              totalRevenue: 0,
              totalPlatformFee: 0,
              totalGst: 0,
              totalBookings: 0,
            },
            breakdown: {},
            chartData: [],
            period: { from, to, preset },
          })
        }

        bookingFilter.hospitalId = hospital.id
      }

      if (user.role === 'lab_admin') {
        const lab = await prisma.lab.findFirst({
          where: { adminUserId: user.id },
          select: { id: true },
        })

        if (!lab) {
          return successResponse({
            summary: {
              totalRevenue: 0,
              totalPlatformFee: 0,
              totalGst: 0,
              totalBookings: 0,
            },
            breakdown: {},
            chartData: [],
            period: { from, to, preset },
          })
        }

        bookingFilter.labId = lab.id
      }

      const bookings = await prisma.booking.findMany({
        where: bookingFilter,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          type: true,
          totalAmount: true,
          platformFee: true,
          gst: true,
          createdAt: true,
        },
      })

      const totalRevenue = bookings.reduce((sum, booking) => {
        return sum + (Number(booking.totalAmount) || 0)
      }, 0)

      const totalPlatformFee = bookings.reduce((sum, booking) => {
        return sum + (Number(booking.platformFee) || 0)
      }, 0)

      const totalGst = bookings.reduce((sum, booking) => {
        return sum + (Number(booking.gst) || 0)
      }, 0)

      const totalBookings = bookings.length

      const breakdown = {}
      for (const booking of bookings) {
        const key = booking.type || 'unknown'
        breakdown[key] = (breakdown[key] || 0) + (Number(booking.totalAmount) || 0)
      }

      let chartData = buildChartData(bookings, from, to) || []

      chartData = chartData.map((item) => ({
        date: item.date || item.label || '-',
        revenue: Number(item.revenue || 0),
        bookings: Number(item.bookings || 0),
      }))

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