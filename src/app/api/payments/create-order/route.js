// src/app/api/payments/create-order/route.js

import { verifyAuth }                          from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { createOrder }                         from '@/lib/services/payment.service'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()

    const { bookingId } = body

    if (!bookingId) {
      return errorResponse('bookingId is required', 'MISSING_BOOKING_ID', 400)
    }

    console.log('[API][create-order] bookingId:', bookingId, 'userId:', user.id)

    const result = await createOrder({
      bookingId,
      userId: user.id,
    })

    // result has: paymentId, txnId, merchantId, reqData, paymentUrl, amount
    return successResponse(result, 'Payment order created')

  } catch (err) {
    console.error('[API][create-order] Error:', err.message)

    const statusMap = {
      'Booking is already paid': 409,
      'Booking not found':       404,
      'GATEWAY_TIMEOUT':         504,
      'GATEWAY_UNREACHABLE':     503,
    }

    const status = statusMap[err.message] || 400
    return errorResponse(err.message, 'PAYMENT_ERROR', status)
  }
}