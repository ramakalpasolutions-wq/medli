import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'regional_manager')

      // ✅ await params — Next.js 15 requirement
      const { txnId } = await params

      if (!txnId) {
        return errorResponse('txnId is required', 400)
      }

      console.log('[API] Verify txnId:', txnId)

      // Try payment.service first
      let result = null
      try {
        const { verifyTransaction } = await import('@/lib/services/payment.service')
        result = await verifyTransaction(txnId)
      } catch (e) {
        console.warn('[verify] payment.service failed:', e?.message)
      }

      // Fallback — find in DB and return current state
      if (!result) {
        const payment = await prisma.payment.findFirst({
          where: { onePayTxnId: txnId },
        })
        if (!payment) {
          return errorResponse('Payment not found for this txnId', 404)
        }
        result = payment
      }

      return successResponse(result, 'Transaction status fetched')

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/payments/verify/[txnId]]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}