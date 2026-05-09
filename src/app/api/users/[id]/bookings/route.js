import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import {
  getPaginationParams,
  buildPaginationMeta,
} from '@/lib/utils/helpers'
import {
  errorResponse,
  handleOptions,
  paginatedResponse,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params

      // ✅ user.userId
      if (user.userId !== id && !['super_admin', 'regional_manager'].includes(user.role)) {
        return errorResponse('Access denied', 403)
      }

      const { searchParams } = new URL(request.url)
      const filter = searchParams.get('filter') || ''
      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = { userId: id }

      if (filter === 'upcoming') {
        where.startTime = { gte: new Date() }
        where.status    = { in: ['confirmed', 'pending_payment'] }
      } else if (filter === 'past') {
        where.startTime = { lt: new Date() }
      } else if (filter === 'cancelled') {
        where.status = 'cancelled'
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({ where, skip, take, orderBy: { startTime: 'desc' } }),
        prisma.booking.count({ where }),
      ])

      return paginatedResponse(bookings, buildPaginationMeta(total, page, limit), 'bookings')
    } catch (error) {
      console.error('[GET /api/users/[id]/bookings]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}