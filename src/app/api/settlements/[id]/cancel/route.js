// src/app/api/settlements/[id]/cancel/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { cancelSettlement } from '@/lib/services/settlement.service'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request, { params }) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()
    const { reason } = body

    const settlement = await cancelSettlement({
      settlementId: params.id,
      reason,
      cancelledBy:  user.id
    })

    await logAdminAction({
      actorId:    user.id,
      actorRole:  user.role,
      action:     'settlement.cancelled',
      targetType: 'settlement',
      targetId:   params.id,
      details:    { reason },
      request
    })

    return successResponse(settlement, 'Settlement cancelled')
  } catch (err) {
    return errorResponse(err.message, 'SETTLEMENT_ERROR', 400)
  }
}