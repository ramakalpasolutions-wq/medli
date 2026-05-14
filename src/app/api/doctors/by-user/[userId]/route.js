import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, context) {
  try {
    const authUser = await verifyAuth(request)
    checkRole(authUser, 'doctor', 'hospital_admin', 'super_admin')

    const { userId } = await context.params

    console.log('[Doctor By User] authUser.id =', authUser.id)
    console.log('[Doctor By User] param userId =', userId)

    if (authUser.role === 'doctor' && authUser.id !== userId) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const doctor = await prisma.doctor.findFirst({
      where: { userId },
      select: {
        id: true,
        userId: true,
        hospitalId: true,
        name: true,
        consultationTypes: true,
        availability: true,
        exceptions: true,
      },
    })

    console.log('[Doctor By User] doctor =', doctor)

    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    return successResponse(doctor, 'Doctor fetched')
  } catch (err) {
    console.error('[Doctor By User][GET]', err)
    if (
      err.message?.includes('Access denied') ||
      err.message?.toLowerCase().includes('token')
    ) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to fetch doctor', 'SERVER_ERROR', 500)
  }
}