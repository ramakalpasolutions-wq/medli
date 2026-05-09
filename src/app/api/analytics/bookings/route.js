import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import { getDateRange, getPaginationParams } from '@/lib/utils/helpers'
import {
  successResponse,
  errorResponse,
  handleOptions,
  paginatedResponse,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'regional_manager', 'hospital_admin', 'lab_admin')

      const { searchParams } = new URL(request.url)
      const preset   = searchParams.get('preset')  || 'last30'
      const dateFrom = searchParams.get('dateFrom') || ''
      const dateTo   = searchParams.get('dateTo')   || ''
      const type     = searchParams.get('type')     || ''
      const status   = searchParams.get('status')   || ''
      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const { from, to } = getDateRange(preset, dateFrom, dateTo)

      const where = {
        createdAt: { gte: from, lte: to },
        ...(type   && { type }),
        ...(status && { status }),
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id:          true,
            bookingId:   true,
            type:        true,
            status:      true,
            totalAmount: true,
            platformFee: true,
            gst:         true,
            createdAt:   true,
          },
        }),
        prisma.booking.count({ where }),
      ])

      return paginatedResponse(bookings, { page, limit, total })

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/analytics/bookings]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}