// src/app/api/payments/create-order/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { createOrder } from '@/lib/services/payment.service'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()

    if (!body.bookingId) {
      return errorResponse('bookingId is required', 'MISSING_BOOKING_ID', 400)
    }

    console.log('[API] create-order for bookingId:', body.bookingId, 'userId:', user.id)

    const result = await createOrder({
      bookingId: body.bookingId,
      userId:    user.id,
    })

    return successResponse(result, 'Payment order created')
  } catch (err) {
    console.error('[API] create-order error:', err.message)
    return errorResponse(err.message, 'PAYMENT_ERROR', 400)
  }
}