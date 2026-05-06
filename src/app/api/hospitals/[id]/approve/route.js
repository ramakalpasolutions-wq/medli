import prisma from '@/lib/prisma'
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

    const hospital = await prisma.hospital.findUnique({ where: { id } })
    if (!hospital) {
      return errorResponse('Hospital not found', 'NOT_FOUND', 404)
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: { isApproved: true },
    })

    await cache.del(`hospital:${id}`)

    await logAdminAction({
      actorId: user.id,
      actorRole: user.role,
      action: 'hospital_approved',
      targetType: 'hospital',
      targetId: id,
      details: { hospitalName: hospital.name },
      request,
    })

    // Notify hospital admin via email
    if (hospital.contactEmail) {
      await emailQueue.add('hospital_approved', {
        to: hospital.contactEmail,
        subject: 'Your hospital has been approved on MEDLI',
        html: `<p>Dear ${hospital.name},</p><p>Your hospital has been approved and is now visible on MEDLI.</p>`,
      })
    }

    return successResponse(updated, 'Hospital approved')
  } catch (err) {
    console.error('[Hospital Approve]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to approve hospital', 'SERVER_ERROR', 500)
  }
}