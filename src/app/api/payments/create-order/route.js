import { verifyAuth } from '@/lib/middleware/auth.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

import { prisma } from '@/lib/prisma'

import {
  Cashfree,
  generateCashfreeOrderId,
} from '@/lib/utils/cashfree'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    // ─────────────────────────────────────────────
    // AUTH
    // ─────────────────────────────────────────────

    const user = await verifyAuth(request)

    const body = await request.json()

    const { bookingId } = body

    if (!bookingId) {
      return errorResponse(
        'bookingId is required',
        'MISSING_BOOKING_ID',
        400
      )
    }

    const authUserId = user.userId || user.id

    // ─────────────────────────────────────────────
    // FIND BOOKING
    // ─────────────────────────────────────────────

    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
    })

    if (!booking) {
      return errorResponse(
        'Booking not found',
        'BOOKING_NOT_FOUND',
        404
      )
    }

    // ─────────────────────────────────────────────
    // SECURITY
    // ─────────────────────────────────────────────

    if (booking.userId !== authUserId) {
      return errorResponse(
        'Access denied',
        'FORBIDDEN',
        403
      )
    }

    if (booking.paymentStatus === 'paid') {
      return errorResponse(
        'Booking is already paid',
        'ALREADY_PAID',
        409
      )
    }

    // ─────────────────────────────────────────────
    // VALIDATE AMOUNT
    // ─────────────────────────────────────────────

    const amount = Number(booking.totalAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      console.error(
        '[Cashfree create-order] Invalid booking amount:',
        booking.totalAmount
      )

      return errorResponse(
        'Invalid booking amount',
        'INVALID_AMOUNT',
        400
      )
    }

    // ─────────────────────────────────────────────
    // GET USER
    // ─────────────────────────────────────────────

    const dbUser = await prisma.user.findUnique({
      where: {
        id: booking.userId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })

    if (!dbUser) {
      return errorResponse(
        'User not found',
        'USER_NOT_FOUND',
        404
      )
    }

    // ─────────────────────────────────────────────
    // CHECK EXISTING PAYMENT
    // ─────────────────────────────────────────────

    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId: booking.id,

        status: {
          in: ['created', 'pending'],
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    })

    /*
     * Reuse an existing Cashfree payment session.
     *
     * This avoids creating multiple orders every time
     * the patient clicks Pay.
     */

    if (
      existingPayment?.cashfreeOrderId &&
      existingPayment?.cashfreePaymentSessionId
    ) {
      return successResponse(
        {
          orderId: existingPayment.cashfreeOrderId,

          cfOrderId:
            existingPayment.cashfreeCfOrderId || null,

          paymentSessionId:
            existingPayment.cashfreePaymentSessionId,

          amount:
            existingPayment.amount || amount,

          currency:
            existingPayment.currency || 'INR',

          bookingId:
            booking.id,

          bookingRef:
            booking.bookingId,

          mode:
            process.env.CASHFREE_ENV === 'production'
              ? 'production'
              : 'sandbox',
        },

        'Existing Cashfree payment order fetched'
      )
    }

    // ─────────────────────────────────────────────
    // CREATE CASHFREE ORDER ID
    // ─────────────────────────────────────────────

    const cashfreeOrderId =
      generateCashfreeOrderId(booking.bookingId)

    // ─────────────────────────────────────────────
    // CUSTOMER DETAILS
    // ─────────────────────────────────────────────

    /*
     * Cashfree expects customer_id.
     *
     * Keep it deterministic so that MEDLI users
     * can be tracked against Cashfree orders.
     */

    const customerId = `MEDLI_${dbUser.id}`

    const customerPhone =
      dbUser.phone || '9999999999'

    const customerEmail =
      dbUser.email || 'patient@medli.in'

    const customerName =
      dbUser.name || 'MEDLI Patient'

    // ─────────────────────────────────────────────
    // RETURN URL
    // ─────────────────────────────────────────────

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      throw new Error(
        'NEXT_PUBLIC_APP_URL is not configured'
      )
    }

    const returnUrl =
      `${appUrl}/payment/callback` +
      `?order_id=${encodeURIComponent(cashfreeOrderId)}` +
      `&booking_id=${encodeURIComponent(booking.id)}`

    // ─────────────────────────────────────────────
    // CASHFREE REQUEST
    // ─────────────────────────────────────────────

    const requestPayload = {
      order_id: cashfreeOrderId,

      order_amount: Number(amount.toFixed(2)),

      order_currency: 'INR',

      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },

      order_meta: {
        return_url: returnUrl,
      },

      order_note:
        `MEDLI Booking ${booking.bookingId}`,
    }

    console.log(
      '[Cashfree create-order] Creating order:',
      {
        bookingId: booking.id,
        bookingRef: booking.bookingId,
        cashfreeOrderId,
        amount,
      }
    )

    // ─────────────────────────────────────────────
    // CREATE CASHFREE ORDER
    // ─────────────────────────────────────────────

    const response =
      await Cashfree.PGCreateOrder(requestPayload)

    const order = response.data

    if (!order?.payment_session_id) {
      console.error(
        '[Cashfree create-order] Invalid response:',
        order
      )

      throw new Error(
        'Cashfree did not return payment_session_id'
      )
    }

    // ─────────────────────────────────────────────
    // SAVE PAYMENT
    // ─────────────────────────────────────────────

    const payment =
      await prisma.payment.create({
        data: {
          bookingId:
            booking.id,

          userId:
            booking.userId,

          cashfreeOrderId:
            cashfreeOrderId,

          cashfreeCfOrderId:
            order.cf_order_id
              ? String(order.cf_order_id)
              : null,

          cashfreePaymentSessionId:
            order.payment_session_id,

          cashfreeOrderStatus:
            order.order_status || 'ACTIVE',

          amount:
            amount,

          currency:
            order.order_currency || 'INR',

          status:
            'created',
        },
      })

    // ─────────────────────────────────────────────
    // UPDATE BOOKING
    // ─────────────────────────────────────────────

    await prisma.booking.update({
      where: {
        id: booking.id,
      },

      data: {
        status:
          'pending_payment',

        paymentStatus:
          'pending',

        cashfreeOrderId:
          cashfreeOrderId,

        cashfreeCfOrderId:
          order.cf_order_id
            ? String(order.cf_order_id)
            : null,

        cashfreePaymentSessionId:
          order.payment_session_id,
      },
    })

    console.log(
      '[Cashfree create-order] Order created:',
      cashfreeOrderId
    )

    // ─────────────────────────────────────────────
    // RESPONSE TO FRONTEND
    // ─────────────────────────────────────────────

    return successResponse(
      {
        paymentId:
          payment.id,

        orderId:
          cashfreeOrderId,

        cfOrderId:
          order.cf_order_id || null,

        paymentSessionId:
          order.payment_session_id,

        amount:
          amount,

        currency:
          order.order_currency || 'INR',

        bookingId:
          booking.id,

        bookingRef:
          booking.bookingId,

        mode:
          process.env.CASHFREE_ENV === 'production'
            ? 'production'
            : 'sandbox',
      },

      'Cashfree payment order created'
    )
  } catch (error) {
    console.error(
      '[Cashfree create-order] ERROR:',
      error?.response?.data ||
        error?.message ||
        error
    )

    const gatewayMessage =
      error?.response?.data?.message ||
      error?.response?.data?.type ||
      error?.message ||
      'Failed to create Cashfree payment order'

    return errorResponse(
      gatewayMessage,
      'CASHFREE_ORDER_ERROR',
      500
    )
  }
}