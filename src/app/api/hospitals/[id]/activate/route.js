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

    const hospital = await prisma.hospital.findUnique({ where: { id } })
    if (!hospital) {
      return errorResponse('Hospital not found', 'NOT_FOUND', 404)
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: { isActive: !hospital.isActive },
    })

    await cache.del(`hospital:${id}`)

    await logAdminAction({
      actorId: user.id,
      actorRole: user.role,
      action: updated.isActive ? 'hospital_activated' : 'hospital_deactivated',
      targetType: 'hospital',
      targetId: id,
      details: { hospitalName: hospital.name, isActive: updated.isActive },
      request,
    })

    return successResponse(updated, `Hospital ${updated.isActive ? 'activated' : 'deactivated'}`)
  } catch (err) {
    console.error('[Hospital Activate]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to toggle hospital status', 'SERVER_ERROR', 500)
  }
}