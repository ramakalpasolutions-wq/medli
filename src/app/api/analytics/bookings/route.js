import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
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
      checkRole(user, 'super_admin', 'regional_manager', 'hospital_admin', 'lab_admin')

      const { searchParams } = new URL(request.url)
      const preset = searchParams.get('preset') || 'last30'
      const dateFrom = searchParams.get('dateFrom') || ''
      const dateTo = searchParams.get('dateTo') || ''
      const type = searchParams.get('type') || ''

      const { from, to } = getDateRange(preset, dateFrom, dateTo)

      const where = {
        createdAt: { gte: from, lte: to },
        ...(type && { type }),
      }

      if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findFirst({
          where: { adminUserId: user.id },
          select: { id: true },
        })
        if (hospital) where.hospitalId = hospital.id
      }

      if (user.role === 'lab_admin') {
        const lab = await prisma.lab.findFirst({
          where: { adminUserId: user.id },
          select: { id: true },
        })
        if (lab) where.labId = lab.id
      }

      const bookings = await prisma.booking.findMany({
        where,
        select: {
          id: true,
          type: true,
          status: true,
          labStatus: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      const summary = {
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0),
      }

      const byStatusMap = {}
      const byLabStatusMap = {}
      const byTypeMap = {}

      for (const booking of bookings) {
        if (booking.status) {
          byStatusMap[booking.status] = (byStatusMap[booking.status] || 0) + 1
        }
        if (booking.labStatus) {
          byLabStatusMap[booking.labStatus] = (byLabStatusMap[booking.labStatus] || 0) + 1
        }
        if (booking.type) {
          byTypeMap[booking.type] = (byTypeMap[booking.type] || 0) + 1
        }
      }

      const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }))
      const byLabStatus = Object.entries(byLabStatusMap).map(([status, count]) => ({ status, count }))
      const byType = Object.entries(byTypeMap).map(([type, count]) => ({ type, count }))

      const chartData = buildChartData(bookings, from, to).map((row) => ({
        date: row.date,
        bookings: Number(row.bookings || 0),
      }))

      return successResponse({
        summary,
        byStatus,
        byLabStatus,
        byType,
        chartData,
        period: { from, to, preset },
      })
    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/analytics/bookings]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}