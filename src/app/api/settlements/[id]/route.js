import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    if (!['super_admin', 'regional_manager', 'hospital_admin', 'lab_admin'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const settlement = await prisma.settlement.findUnique({ where: { id } })
    if (!settlement) return errorResponse('Settlement not found', 'NOT_FOUND', 404)

    return successResponse(settlement)
  } catch (err) {
    return errorResponse('Failed to fetch settlement', 'SERVER_ERROR', 500)
  }
}

export async function POST(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params
    const { checkRole } = await import('@/lib/middleware/rbac.middleware')
    checkRole(user, 'super_admin')

    const settlement = await prisma.settlement.findUnique({ where: { id } })
    if (!settlement) return errorResponse('Settlement not found', 'NOT_FOUND', 404)
    if (settlement.status === 'completed')
      return errorResponse('Settlement already completed', 'INVALID_STATUS', 400)

    const { processSettlement } = await import('@/lib/services/settlement.service')
    const retried = await processSettlement({
      entityType: settlement.entityType,
      entityId: settlement.entityId,
      initiatedBy: user.id,
      notes: `Retry attempt ${settlement.retryCount + 1}`,
    })

    return successResponse(retried, 'Settlement retried')
  } catch (err) {
    console.error('[Settlement Retry]', err.message)
    return errorResponse(err.message, 'SETTLEMENT_ERROR', 400)
  }
}