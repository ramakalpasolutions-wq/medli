import { prisma }         from '@/lib/prisma'
import { cache }          from '@/lib/cache'
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
      checkRole(user, 'super_admin')

      // ✅ await params
      const { id } = await params

      const hospital = await prisma.hospital.findUnique({ where: { id } })
      if (!hospital) {
        return errorResponse('Hospital not found', 404)
      }

      if (hospital.isApproved) {
        return errorResponse('Hospital is already approved', 400)
      }

      const updated = await prisma.hospital.update({
        where: { id },
        data:  { isApproved: true },
      })

      // Invalidate cache
      await cache.del(`hospital:${id}`)

      // ✅ Correct logAdminAction signature
      logAdminAction(
        request,
        user,
        'HOSPITAL_APPROVED',
        'Hospital',
        id,
        { hospitalName: hospital.name }
      ).catch((e) => console.warn('[audit]', e?.message))

      // Send approval email — fire and forget
    // ✅ Fire-and-forget — doesn't block response
if (hospital.contactEmail) {
  import('@/lib/queues/setup')
    .then(({ emailQueue }) =>
      emailQueue.add('hospital_approved', {
        to:      hospital.contactEmail,
        subject: 'Your hospital has been approved on MEDLI',
        html:    `
          <p>Dear ${hospital.name},</p>
          <p>Congratulations! Your hospital has been <strong>approved</strong> and is now visible to patients on MEDLI.</p>
          <p>Patients can now book appointments with your doctors.</p>
          <br/>
          <p>Team MEDLI</p>
        `,
      })
    )
    .catch((e) => console.warn('[approve] email queue:', e?.message))
}

      return successResponse(updated, 'Hospital approved successfully')

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[PATCH /api/hospitals/[id]/approve]', error)
      return errorResponse('Failed to approve hospital', 500)
    }
  })
}