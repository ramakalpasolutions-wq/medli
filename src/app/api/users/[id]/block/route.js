import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      return errorResponse('User not found', 'NOT_FOUND', 404)
    }

    if (targetUser.id === user.id) {
      return errorResponse('Cannot block yourself', 'VALIDATION_ERROR', 400)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isBlocked: !targetUser.isBlocked },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isBlocked: true,
      },
    })

    await logAdminAction({
      actorId: user.id,
      actorRole: user.role,
      action: updated.isBlocked ? 'user_blocked' : 'user_unblocked',
      targetType: 'user',
      targetId: id,
      details: { userName: targetUser.name, isBlocked: updated.isBlocked },
      request,
    })

    return successResponse(updated, `User ${updated.isBlocked ? 'blocked' : 'unblocked'}`)
  } catch (err) {
    console.error('[User Block]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to toggle user block status', 'SERVER_ERROR', 500)
  }
}