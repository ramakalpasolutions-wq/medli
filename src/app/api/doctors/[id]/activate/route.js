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
    checkRole(user, 'super_admin', 'hospital_admin')

    const doctor = await prisma.doctor.findUnique({ where: { id } })
    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findUnique({ where: { id: doctor.hospitalId } })
      if (!hospital || hospital.adminUserId !== user.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: { isActive: !doctor.isActive },
    })

    await logAdminAction({
      actorId: user.id,
      actorRole: user.role,
      action: updated.isActive ? 'doctor_activated' : 'doctor_deactivated',
      targetType: 'doctor',
      targetId: id,
      details: { doctorName: doctor.name, isActive: updated.isActive },
      request,
    })

    return successResponse(updated, `Doctor ${updated.isActive ? 'activated' : 'deactivated'}`)
  } catch (err) {
    console.error('[Doctor Activate]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to toggle doctor status', 'SERVER_ERROR', 500)
  }
}