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

    const doctor = await prisma.doctor.findUnique({ where: { id } })
    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: { isVerified: true },
    })

    await logAdminAction({
      actorId: user.id,
      actorRole: user.role,
      action: 'doctor_verified',
      targetType: 'doctor',
      targetId: id,
      details: { doctorName: doctor.name },
      request,
    })

    return successResponse(updated, 'Doctor verified')
  } catch (err) {
    console.error('[Doctor Verify]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to verify doctor', 'SERVER_ERROR', 500)
  }
}