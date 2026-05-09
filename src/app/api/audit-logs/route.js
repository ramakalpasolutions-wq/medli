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
      checkRole(user, 'super_admin')

      const { searchParams } = new URL(request.url)
      const actorRole  = searchParams.get('actorRole')  || ''
      const action     = searchParams.get('action')     || ''
      const targetType = searchParams.get('targetType') || ''

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}
      if (actorRole)  where.actorRole  = actorRole
      if (action)     where.action     = action
      if (targetType) where.targetType = targetType

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
      ])

      return paginatedResponse(
        logs,
        buildPaginationMeta(total, page, limit),
        'logs',
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/audit-logs]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}