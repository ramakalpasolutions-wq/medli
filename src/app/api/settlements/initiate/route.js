// src/app/api/settlements/initiate/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { initiateSettlement } from '@/lib/services/settlement.service'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()
    const { entityType, entityId, periodFrom, periodTo, notes } = body

    if (!entityType || !entityId) {
      return errorResponse(
        'entityType and entityId are required',
        'MISSING_FIELDS',
        400
      )
    }

    const result = await initiateSettlement({
      entityType,
      entityId,
      periodFrom,
      periodTo,
      initiatedBy: user.id,
      notes
    })

    await logAdminAction({
      actorId:    user.id,
      actorRole:  user.role,
      action:     'settlement.initiated',
      targetType: 'settlement',
      targetId:   result.settlement.id,
      details: {
        entityName:  result.settlement.entityName,
        entityType,
        amount:      result.settlement.netSettlementAmount,
        totalBookings: result.settlement.totalBookings
      },
      request
    })

    return successResponse(
      {
        settlement:           result.settlement,
        transferInstructions: result.transferInstructions
      },
      'Settlement initiated. Please complete the bank transfer and confirm with UTR number.'
    )
  } catch (err) {
    return errorResponse(err.message, 'SETTLEMENT_ERROR', 400)
  }
}