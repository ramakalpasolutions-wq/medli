import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, context) {
  try {
    // ✅ Next.js 15
    const { txnId } = await context.params

    if (!txnId) {
      return errorResponse('txnId is required', 400)
    }

    console.log('[VERIFY API] txnId:', txnId)

    // Find payment directly
    const payment = await prisma.payment.findFirst({
      where: {
        onePayTxnId: txnId,
      },
      include: {
        booking: true,
      },
    })

    if (!payment) {
      return errorResponse('Payment not found', 404)
    }

    return successResponse(
      {
        success: payment.status === 'success',
        status: payment.status,
        txnId: payment.onePayTxnId,
        amount: payment.amount,
        bookingId: payment.bookingId,
        paymentId: payment.id,
      },
      'Payment status fetched'
    )

  } catch (error) {
    console.error('[VERIFY API ERROR]', error)

    return errorResponse(
      error.message || 'Internal server error',
      500
    )
  }
}