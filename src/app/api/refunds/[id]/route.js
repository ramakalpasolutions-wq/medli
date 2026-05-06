import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { processRefund } from '@/lib/services/refund.service'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    const refund = await prisma.refund.findUnique({ where: { id } })
    if (!refund) return errorResponse('Refund not found', 'NOT_FOUND', 404)

    if (user.role === 'user' && refund.userId !== user.id)
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    return successResponse(refund)
  } catch (err) {
    return errorResponse('Failed to fetch refund', 'SERVER_ERROR', 500)
  }
}

export async function POST(request, { params }) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')
    const { id } = await params
    const body = await request.json()

    const refund = await prisma.refund.findUnique({ where: { id } })
    if (!refund) return errorResponse('Refund not found', 'NOT_FOUND', 404)

    if (refund.status === 'completed')
      return errorResponse('Refund already completed', 'INVALID_STATUS', 400)

    const retried = await processRefund({
      bookingId: refund.bookingId,
      initiatedBy: user.id,
      reason: body.reason || refund.reason,
    })

    return successResponse(retried, 'Refund retried')
  } catch (err) {
    console.error('[Refund Retry]', err.message)
    return errorResponse(err.message, 'REFUND_ERROR', 400)
  }
}