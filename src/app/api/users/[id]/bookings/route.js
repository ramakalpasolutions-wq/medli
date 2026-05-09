import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getPaginationParams } from '@/lib/utils/helpers'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)

    if (user.id !== id && user.role !== 'super_admin') {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    )

    const filter = searchParams.get('filter')
    const where = { userId: id }

    if (filter === 'upcoming') {
      where.startTime = { gte: new Date() }
      where.status = { in: ['confirmed', 'pending_payment'] }
    } else if (filter === 'past') {
      where.startTime = { lt: new Date() }
    } else if (filter === 'cancelled') {
      where.status = 'cancelled'
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy: { startTime: 'desc' },
      }),
      prisma.booking.count({ where }),
    ])

    return successResponse({
      bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[User Bookings]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to fetch bookings', 'SERVER_ERROR', 500)
  }
}