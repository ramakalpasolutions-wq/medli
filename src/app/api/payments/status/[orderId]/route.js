import { verifyAuth } from '@/lib/middleware/auth.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------
    const user = await verifyAuth(request)

    // Next.js 16 dynamic route params
    const { orderId } = await params

    if (!orderId) {
      return errorResponse(
        'Cashfree order ID is required',
        'VALIDATION_ERROR',
        400
      )
    }

    // --------------------------------------------------
    // FIND PAYMENT
    // --------------------------------------------------
    const payment = await prisma.payment.findFirst({
      where: {
        cashfreeOrderId: orderId,
      },
    })

    if (!payment) {
      return errorResponse(
        'Payment not found',
        'NOT_FOUND',
        404
      )
    }

    // --------------------------------------------------
    // SECURITY
    // User should only be able to see their own payment.
    // Super admin can see all payments.
    // --------------------------------------------------
    if (
      user.role !== 'super_admin' &&
      payment.userId !== user.id &&
      payment.userId !== user.userId
    ) {
      return errorResponse(
        'Access denied',
        'FORBIDDEN',
        403
      )
    }

    // --------------------------------------------------
    // GET BOOKING
    // --------------------------------------------------
    const booking = await prisma.booking.findUnique({
      where: {
        id: payment.bookingId,
      },
    })

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------
    return successResponse({
      status: payment.status,

      orderId: payment.cashfreeOrderId,

      cfOrderId:
        payment.cashfreeCfOrderId || null,

      paymentId:
        payment.cashfreePaymentId || null,

      paymentSessionId:
        payment.cashfreePaymentSessionId || null,

      paymentMethod:
        payment.cashfreePaymentMethod || null,

      bankReference:
        payment.cashfreeBankReference || null,

      failureReason:
        payment.cashfreeFailureReason || null,

      orderStatus:
        payment.cashfreeOrderStatus || null,

      paymentStatus:
        payment.cashfreePaymentStatus || null,

      amount:
        Number(payment.amount || 0),

      currency:
        payment.currency || 'INR',

      bookingId:
        payment.bookingId,

      bookingNumber:
        booking?.bookingId || null,

      bookingStatus:
        booking?.status || null,

      bookingPaymentStatus:
        booking?.paymentStatus || null,

      paidAt:
        payment.paidAt || null,

      failedAt:
        payment.failedAt || null,

      createdAt:
        payment.createdAt,

      updatedAt:
        payment.updatedAt,
    })
  } catch (err) {
    console.error(
      '[Cashfree Payment Status]',
      err
    )

    if (
      err.message === 'Unauthorized' ||
      err.message === 'Invalid token'
    ) {
      return errorResponse(
        'Unauthorized',
        'UNAUTHORIZED',
        401
      )
    }

    return errorResponse(
      err.message || 'Failed to fetch payment status',
      'STATUS_ERROR',
      500
    )
  }
}