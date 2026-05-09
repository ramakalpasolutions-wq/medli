import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import {
  getPaginationParams,
  buildPaginationMeta,
} from '@/lib/utils/helpers'
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
      checkRole(user, 'super_admin')

      const { searchParams } = new URL(request.url)
      const status  = searchParams.get('status')  || ''
      const channel = searchParams.get('channel') || ''

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}
      if (status)  where.status  = status
      if (channel) where.channel = channel

      const [notifications, total] = await Promise.all([
        prisma.notificationLog.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notificationLog.count({ where }),
      ])

      return paginatedResponse(
        notifications,
        buildPaginationMeta(total, page, limit),
        'notifications',
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/notifications]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}