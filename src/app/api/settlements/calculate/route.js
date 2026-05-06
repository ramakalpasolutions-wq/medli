// src/app/api/settlements/calculate/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { calculateSettlement } from '@/lib/services/settlement.service'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()
    const { entityType, entityId, periodFrom, periodTo } = body

    if (!entityType || !entityId) {
      return errorResponse('entityType and entityId required', 'MISSING_FIELDS', 400)
    }

    const result = await calculateSettlement({
      entityType, entityId, periodFrom, periodTo
    })

    return successResponse(result, 'Settlement calculation preview')
  } catch (err) {
    return errorResponse(err.message, 'CALCULATION_ERROR', 400)
  }
}