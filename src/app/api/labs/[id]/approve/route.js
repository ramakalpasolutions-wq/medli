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

      const { id } = await params

      const lab = await prisma.lab.findUnique({ where: { id } })
      if (!lab) {
        return errorResponse('Lab not found', 404)
      }

      if (lab.isApproved) {
        return errorResponse('Lab is already approved', 400)
      }

      const updated = await prisma.lab.update({
        where: { id },
        data:  { isApproved: true },
      })

      // Invalidate cache
      await cache.del(`lab:${id}`)

      // ✅ CORRECT signature
      logAdminAction(
        request,
        user,
        'LAB_APPROVED',
        'Lab',
        id,
        { labName: lab.name }
      ).catch((e) => console.warn('[audit]', e?.message))

      // Send approval email — fire and forget, don't block response
      if (lab.contactEmail) {
        try {
          const { emailQueue } = await import('@/lib/queues/setup')
          emailQueue.add('lab_approved', {
            to:      lab.contactEmail,
            subject: 'Your lab has been approved on MEDLI',
            html:    `
              <p>Dear ${lab.name},</p>
              <p>Congratulations! Your lab has been <strong>approved</strong> and is now visible to patients on MEDLI.</p>
              <p>Patients can now book diagnostic services with you.</p>
              <br/>
              <p>Team MEDLI</p>
            `,
          }).catch((e) => console.warn('[approve] email queue:', e?.message))
        } catch (e) {
          console.warn('[approve] email queue import:', e?.message)
        }
      }

      return successResponse(updated, 'Lab approved successfully')

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[PATCH /api/labs/[id]/approve]', error)
      return errorResponse('Failed to approve lab', 500)
    }
  })
}