import prisma from '@/lib/prisma'
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

    const body = await request.json()
    const { managerId } = body

    if (!managerId) {
      return errorResponse('managerId is required', 'VALIDATION_ERROR', 400)
    }

    const region = await prisma.region.findUnique({ where: { id } })
    if (!region) {
      return errorResponse('Region not found', 'NOT_FOUND', 404)
    }

    const manager = await prisma.user.findUnique({ where: { id: managerId } })
    if (!manager) {
      return errorResponse('Manager user not found', 'NOT_FOUND', 404)
    }

    if (manager.role !== 'regional_manager') {
      return errorResponse(
        'Assigned user must have regional_manager role',
        'VALIDATION_ERROR',
        400
      )
    }

    const updated = await prisma.region.update({
      where: { id },
      data: { managerId },
    })

    await logAdminAction({
      actorId: user.id,
      actorRole: user.role,
      action: 'region_manager_assigned',
      targetType: 'region',
      targetId: id,
      details: {
        regionName: region.name,
        managerId,
        managerName: manager.name,
      },
      request,
    })

    return successResponse(updated, 'Region manager assigned')
  } catch (err) {
    console.error('[Region Manager]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to assign manager', 'SERVER_ERROR', 500)
  }
}