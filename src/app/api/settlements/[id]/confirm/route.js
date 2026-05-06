// src/app/api/settlements/[id]/confirm/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { confirmSettlement } from '@/lib/services/settlement.service'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request, { params }) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()
    const { utrNumber, transferMode } = body

    if (!utrNumber || !utrNumber.trim()) {
      return errorResponse(
        'UTR number is required to confirm settlement',
        'UTR_REQUIRED',
        400
      )
    }

    const settlement = await confirmSettlement({
      settlementId: params.id,
      utrNumber:    utrNumber.trim(),
      transferMode: transferMode || 'NEFT',
      confirmedBy:  user.id
    })

    await logAdminAction({
      actorId:    user.id,
      actorRole:  user.role,
      action:     'settlement.confirmed',
      targetType: 'settlement',
      targetId:   params.id,
      details:    { utrNumber: utrNumber.trim(), transferMode },
      request
    })

    return successResponse(
      settlement,
      `Settlement confirmed successfully. UTR: ${utrNumber.trim()}`
    )
  } catch (err) {
    return errorResponse(err.message, 'SETTLEMENT_ERROR', 400)
  }
}