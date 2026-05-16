import { prisma }         from '@/lib/prisma'
import { verifyAuth }     from '@/lib/middleware/auth.middleware'
import { checkRole }      from '@/lib/middleware/rbac.middleware'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function PATCH(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'hospital_admin')

      const { id } = await params

      const doctor = await prisma.doctor.findUnique({ where: { id } })
      if (!doctor) {
        return errorResponse('Doctor not found', 404)
      }

      // hospital_admin can only modify doctors in their own hospital
      if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findUnique({
          where: { id: doctor.hospitalId },
        })
        if (!hospital || hospital.adminUserId !== user.userId) {
          return errorResponse('Access denied', 403)
        }
      }

      const updated = await prisma.doctor.update({
        where: { id },
        data:  { isActive: !doctor.isActive },
      })

      logAdminAction(
        request,
        user,
        updated.isActive ? 'DOCTOR_ACTIVATED' : 'DOCTOR_DEACTIVATED',
        'Doctor',
        id,
        { doctorName: doctor.name, isActive: updated.isActive }
      ).catch((e) => console.warn('[audit]', e?.message))

      return successResponse(
        updated,
        `Doctor ${updated.isActive ? 'activated' : 'deactivated'}`
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[PATCH /api/doctors/[id]/activate]', error)
      return errorResponse('Failed to toggle doctor status', 500)
    }
  })
}