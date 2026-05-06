// src/app/api/analytics/bookings/route.js
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

    const where = { createdAt: { gte: from, lte: to } }

    // ── Scope by role ─────────────────────────────────────────────────────────
    if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findFirst({
        where: { adminUserId: user.id }, select: { id: true },
      })
      if (hospital) where.hospitalId = hospital.id
      else          where.hospitalId = 'none'
    } else if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findFirst({
        where: { adminUserId: user.id }, select: { id: true },
      })
      if (lab) where.labId = lab.id
      else     where.labId = 'none'
    }

    const [total, byStatus, byType] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.groupBy({
        by:     ['status'],
        where,
        _count: { _all: true },
      }),
      prisma.booking.groupBy({
        by:     ['type'],
        where,
        _count: { _all: true },
      }),
    ])

    return successResponse({
      total,
      byStatus:  byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      byType:    byType.map((t)   => ({ type:   t.type,   count: t._count._all })),
      dateRange: { from, to },
    })
  } catch (err) {
    console.error('[Analytics Bookings]', err.message)
    if (err.message?.includes('token') || err.message?.includes('Unauthorized'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to fetch booking analytics', 'SERVER_ERROR', 500)
  }
}