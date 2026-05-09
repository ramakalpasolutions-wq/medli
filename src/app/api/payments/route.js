import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
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

export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'regional_manager')

      const { searchParams } = new URL(request.url)
      const status   = searchParams.get('status')   || ''
      const dateFrom = searchParams.get('dateFrom')  || ''
      const dateTo   = searchParams.get('dateTo')    || ''

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}
      if (status) where.status = status
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = new Date(dateFrom)
        if (dateTo) {
          const end = new Date(dateTo)
          end.setHours(23, 59, 59, 999)
          where.createdAt.lte = end
        }
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.payment.count({ where }),
      ])

      return paginatedResponse(
        payments,
        buildPaginationMeta(total, page, limit),
        'payments',
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/payments]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}