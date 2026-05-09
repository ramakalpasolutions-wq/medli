import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import { emailQueue } from '@/lib/queues/setup'
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
      data: { isApproved: true },
    })

    await cache.del(`lab:${id}`)

    await logAdminAction({
      actorId: user.id,
      actorRole: user.role,
      action: 'lab_approved',
      targetType: 'lab',
      targetId: id,
      details: { labName: lab.name },
      request,
    })

    if (lab.contactEmail) {
      await emailQueue.add('lab_approved', {
        to: lab.contactEmail,
        subject: 'Your lab has been approved on MEDLI',
        html: `<p>Dear ${lab.name},</p><p>Your lab has been approved and is now visible on MEDLI.</p>`,
      })
    }

    return successResponse(updated, 'Lab approved')
  } catch (err) {
    console.error('[Lab Approve]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to approve lab', 'SERVER_ERROR', 500)
  }
}