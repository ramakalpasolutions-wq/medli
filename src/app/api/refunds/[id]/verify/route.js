// src/app/api/refunds/[id]/verify/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { syncRefundStatus } from '@/lib/services/refund.service'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    // ----------------------------------------------
    // AUTH
    // ----------------------------------------------

    const user =
      await verifyAuth(request)

    if (user.role !== 'super_admin') {
      return errorResponse(
        'Access denied',
        'FORBIDDEN',
        403
      )
    }

    // ----------------------------------------------
    // PARAMS
    // ----------------------------------------------

    const { id } =
      await params

    if (!id) {
      return errorResponse(
        'Refund ID is required',
        'VALIDATION_ERROR',
        400
      )
    }

    // ----------------------------------------------
    // SYNC WITH CASHFREE
    // ----------------------------------------------

    const refund =
      await syncRefundStatus(id)

    return successResponse(
      {
        refund,
      },
      'Cashfree refund status verified successfully'
    )
  } catch (error) {
    console.error(
      '[Verify Cashfree Refund]',
      error.message
    )

    const status =
      error.message === 'Refund not found'
        ? 404
        : error.message === 'Access denied'
          ? 403
          : 500

    return errorResponse(
      error.message ||
        'Failed to verify refund',

      'REFUND_VERIFY_ERROR',

      status
    )
  }
}