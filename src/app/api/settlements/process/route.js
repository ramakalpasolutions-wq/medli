import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { processSettlement } from '@/lib/services/settlement.service'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()
    if (!body.entityType || !body.entityId)
      return errorResponse('entityType and entityId required', 'VALIDATION_ERROR', 400)

    const settlement = await processSettlement({
      entityType: body.entityType,
      entityId: body.entityId,
      periodFrom: body.periodFrom,
      periodTo: body.periodTo,
      initiatedBy: user.id,
      notes: body.notes,
    })

    await logAdminAction({
      actorId: user.id,
      actorRole: user.role,
      action: 'settlement_processed',
      targetType: body.entityType,
      targetId: body.entityId,
      details: {
        settlementNumber: settlement.settlementNumber,
        amount: settlement.netSettlementAmount,
        status: settlement.status,
      },
      request,
    })

    return successResponse(settlement, 'Settlement processed')
  } catch (err) {
    console.error('[Settlement Process]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse(err.message, 'SETTLEMENT_ERROR', 400)
  }
}