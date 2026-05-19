import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { syncRefundStatus } from '@/lib/services/refund.service'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)

    if (user.role !== 'super_admin') {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const { id } = await params

    if (!id) {
      return errorResponse('Refund ID is required', 'VALIDATION_ERROR', 400)
    }

    const refund = await syncRefundStatus(id)

    return successResponse(
      { refund },
      'Refund status verified successfully'
    )
  } catch (err) {
    console.error('[Verify Refund]', err.message)
    return errorResponse(err.message || 'Failed to verify refund', 'SERVER_ERROR', 500)
  }
}