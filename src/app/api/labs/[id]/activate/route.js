import prisma from '@/lib/prisma'
import { cache } from '@/lib/cache'
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

    const lab = await prisma.lab.findUnique({ where: { id } })
    if (!lab) {
      return errorResponse('Lab not found', 'NOT_FOUND', 404)
    }

    const updated = await prisma.lab.update({
      where: { id },
      data: { isActive: !lab.isActive },
    })

    await cache.del(`lab:${id}`)

    await logAdminAction({
      actorId: user.id,
      actorRole: user.role,
      action: updated.isActive ? 'lab_activated' : 'lab_deactivated',
      targetType: 'lab',
      targetId: id,
      details: { labName: lab.name, isActive: updated.isActive },
      request,
    })

    return successResponse(updated, `Lab ${updated.isActive ? 'activated' : 'deactivated'}`)
  } catch (err) {
    console.error('[Lab Activate]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to toggle lab status', 'SERVER_ERROR', 500)
  }
}