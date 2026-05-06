// src/app/api/payments/status/[orderId]/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import prisma from '@/lib/prisma'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    await verifyAuth(request)

    // orderId here is the onePayTxnId
    const payment = await prisma.payment.findFirst({
      where: { onePayTxnId: params.orderId }
    })

    if (!payment) {
      return errorResponse('Payment not found', 'NOT_FOUND', 404)
    }

    return successResponse(payment)
  } catch (err) {
    return errorResponse(err.message, 'STATUS_ERROR', 500)
  }
}