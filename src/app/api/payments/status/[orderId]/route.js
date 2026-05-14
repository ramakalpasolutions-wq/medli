import { verifyAuth }                                    from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { prisma }                                        from '@/lib/prisma'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    await verifyAuth(request)

    // params.orderId is now razorpayOrderId (order_XXXXXX)
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: params.orderId },
    })

    if (!payment) {
      return errorResponse('Payment not found', 'NOT_FOUND', 404)
    }

    return successResponse({
      status:            payment.status,
      razorpayOrderId:   payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      amount:            payment.amount,
      bookingId:         payment.bookingId,
    })

  } catch (err) {
    return errorResponse(err.message, 'STATUS_ERROR', 500)
  }
}