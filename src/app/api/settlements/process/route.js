// src/app/api/settlements/process-all/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
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
    const { entityIds } = body

    if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
      return errorResponse('entityIds array is required', 'MISSING_FIELDS', 400)
    }

    const results = []

    for (const item of entityIds) {
      try {
        const result = await initiateSettlement({
          entityType:  item.entityType,
          entityId:    item.entityId,
          periodFrom:  item.periodFrom,
          periodTo:    item.periodTo,
          initiatedBy: user.id,
          notes:       item.notes,
        })
        results.push({
          success:              true,
          entityId:             item.entityId,
          entityType:           item.entityType,
          settlement:           result.settlement,
          transferInstructions: result.transferInstructions,
        })
      } catch (err) {
        results.push({
          success:    false,
          entityId:   item.entityId,
          entityType: item.entityType,
          error:      err.message,
        })
      }
    }

    return successResponse({
      total:      results.length,
      successful: results.filter(r => r.success).length,
      failed:     results.filter(r => !r.success).length,
      results,
    }, 'Bulk settlement initiation complete')
  } catch (err) {
    console.error('[Settlement Process-All] Error:', err)
    return errorResponse(err.message, 'SETTLEMENT_ERROR', 500)
  }
}