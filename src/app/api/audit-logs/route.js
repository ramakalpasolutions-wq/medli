import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { getPaginationParams } from '@/lib/utils/helpers'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    )

    const action = searchParams.get('action')
    const actorId = searchParams.get('actorId')
    const targetType = searchParams.get('targetType')

    const where = {}
    if (action) where.action = action
    if (actorId) where.actorId = actorId
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

    return successResponse({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Audit Logs]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to fetch audit logs', 'SERVER_ERROR', 500)
  }
}