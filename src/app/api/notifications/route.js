import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { getPaginationParams } from '@/lib/utils/helpers'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'), searchParams.get('limit')
    )

    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const where = {}
    if (channel) where.channel = channel
    if (status) where.status = status

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.notificationLog.count({ where }),
    ])

    return successResponse({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Notifications GET]', err.message)
    return errorResponse('Failed to fetch notifications', 'SERVER_ERROR', 500)
  }
}