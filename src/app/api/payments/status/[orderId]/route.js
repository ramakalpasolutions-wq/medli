import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'
import { cashfreeRequest } from '@/lib/utils/cashfree'

export const dynamic = 'force-dynamic'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, context) {
  try {
    const { orderId } = await context.params

    if (!orderId) {
      return errorResponse(
        'Cashfree order ID is required',
        'VALIDATION_ERROR',
        400
      )
    }

    console.log('[PAYMENT STATUS] Checking:', orderId)

    // ============================================================
    // FIND LOCAL PAYMENT
    // ============================================================

    const payment = await prisma.payment.findFirst({
      where: {
        cashfreeOrderId: orderId,
      },

      include: {
        booking: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!payment) {
      return errorResponse(
        'Payment not found',
        'NOT_FOUND',
        404
      )
    }

    // ============================================================
    // ALREADY SUCCESSFUL
    // ============================================================

    if (
      payment.status === 'success' &&
      payment.booking?.paymentStatus === 'paid'
    ) {
      return successResponse(
        {
          success: true,

          status: 'success',

          orderId: payment.cashfreeOrderId,

          cfOrderId:
            payment.cashfreeCfOrderId || null,

          paymentId:
            payment.cashfreePaymentId || null,

          amount:
            payment.amount || 0,

          bookingId:
            payment.bookingId,

          bookingRef:
            payment.booking?.bookingId || null,

          bookingStatus:
            payment.booking?.status || null,

          paymentStatus:
            payment.booking?.paymentStatus || null,
        },
        'Payment status fetched'
      )
    }

    // ============================================================
    // FETCH CASHFREE ORDER
    // ============================================================

    let cashfreeOrder = null
    let cashfreePayments = []

    try {
      cashfreeOrder = await cashfreeRequest(
        `/orders/${encodeURIComponent(orderId)}`
      )

      const paymentResponse =
        await cashfreeRequest(
          `/orders/${encodeURIComponent(orderId)}/payments`
        )

      cashfreePayments =
        Array.isArray(paymentResponse)
          ? paymentResponse
          : []
    } catch (cashfreeError) {
      console.error(
        '[PAYMENT STATUS] Cashfree lookup failed:',
        {
          message: cashfreeError?.message,
          status: cashfreeError?.status,
          response:
            cashfreeError?.cashfreeResponse,
        }
      )

      return errorResponse(
        cashfreeError?.message ||
          'Unable to fetch payment status from Cashfree',
        'CASHFREE_ERROR',
        502
      )
    }

    console.log('[PAYMENT STATUS] Cashfree:', {
      orderId,

      orderStatus:
        cashfreeOrder?.order_status || null,

      payments:
        cashfreePayments.map((item) => ({
          id:
            item?.cf_payment_id || null,

          status:
            item?.payment_status || null,

          amount:
            item?.payment_amount || null,
        })),
    })

    // ============================================================
    // SUCCESSFUL PAYMENT
    // ============================================================

    const successfulPayment =
      cashfreePayments.find(
        (item) =>
          String(
            item?.payment_status || ''
          ).toUpperCase() === 'SUCCESS'
      )

    if (successfulPayment) {
      const cashfreePaymentId =
        successfulPayment?.cf_payment_id
          ? String(
              successfulPayment.cf_payment_id
            )
          : null

      const paymentMethod =
        successfulPayment?.payment_group ||
        successfulPayment?.payment_method ||
        null

      const bankReference =
        successfulPayment?.bank_reference ||
        null

      // Update payment
      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: 'success',

          cashfreeOrderStatus:
            cashfreeOrder?.order_status ||
            'PAID',

          cashfreePaymentStatus:
            'SUCCESS',

          cashfreePaymentId,

          cashfreePaymentMethod:
            typeof paymentMethod === 'string'
              ? paymentMethod
              : paymentMethod
                ? JSON.stringify(paymentMethod)
                : null,

          cashfreeBankReference:
            bankReference,

          cashfreeFailureReason:
            null,

          callbackData: {
            order: cashfreeOrder,
            payments: cashfreePayments,
          },

          paidAt:
            payment.paidAt ||
            new Date(),
        },
      })

      // Update booking
      const booking =
        await prisma.booking.update({
          where: {
            id: payment.bookingId,
          },

          data: {
            paymentStatus: 'paid',

            status: 'confirmed',

            cashfreeOrderId:
              orderId,

            cashfreeCfOrderId:
              cashfreeOrder?.cf_order_id
                ? String(
                    cashfreeOrder.cf_order_id
                  )
                : payment.cashfreeCfOrderId ||
                  null,

            cashfreePaymentId,
          },
        })

      console.log(
        '[PAYMENT STATUS] Payment confirmed:',
        {
          orderId,
          paymentId:
            cashfreePaymentId,
          bookingId:
            booking.id,
          bookingRef:
            booking.bookingId,
        }
      )

      return successResponse(
        {
          success: true,

          status: 'success',

          orderId,

          cfOrderId:
            cashfreeOrder?.cf_order_id
              ? String(
                  cashfreeOrder.cf_order_id
                )
              : null,

          paymentId:
            cashfreePaymentId,

          amount:
            Number(
              successfulPayment
                ?.payment_amount ||
                payment.amount ||
                0
            ),

          bookingId:
            booking.id,

          bookingRef:
            booking.bookingId,

          bookingStatus:
            booking.status,

          paymentStatus:
            booking.paymentStatus,
        },
        'Payment verified successfully'
      )
    }

    // ============================================================
    // PENDING PAYMENT
    // ============================================================

    const pendingPayment =
      cashfreePayments.find(
        (item) =>
          String(
            item?.payment_status || ''
          ).toUpperCase() === 'PENDING'
      )

    if (pendingPayment) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: 'pending',

          cashfreeOrderStatus:
            cashfreeOrder?.order_status ||
            null,

          cashfreePaymentStatus:
            'PENDING',

          callbackData: {
            order: cashfreeOrder,
            payments: cashfreePayments,
          },
        },
      })

      return successResponse(
        {
          success: false,

          pending: true,

          status: 'pending',

          orderId,

          bookingId:
            payment.bookingId,

          bookingStatus:
            payment.booking?.status,

          paymentStatus:
            payment.booking?.paymentStatus,
        },
        'Payment is pending'
      )
    }

    // ============================================================
    // FAILED / USER DROPPED
    // ============================================================

    const failedPayment =
      cashfreePayments.find((item) => {
        const status =
          String(
            item?.payment_status || ''
          ).toUpperCase()

        return (
          status === 'FAILED' ||
          status === 'USER_DROPPED'
        )
      })

    if (failedPayment) {
      const cashfreePaymentId =
        failedPayment?.cf_payment_id
          ? String(
              failedPayment.cf_payment_id
            )
          : null

      const failureReason =
        failedPayment?.payment_message ||
        failedPayment?.error_details
          ?.error_description ||
        'Payment failed'

      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: 'failed',

          cashfreeOrderStatus:
            cashfreeOrder?.order_status ||
            null,

          cashfreePaymentStatus:
            failedPayment
              ?.payment_status ||
            'FAILED',

          cashfreePaymentId,

          cashfreeFailureReason:
            failureReason,

          callbackData: {
            order: cashfreeOrder,
            payments: cashfreePayments,
          },

          failedAt:
            new Date(),
        },
      })

      // Do NOT cancel booking.
      // User can retry payment.
      if (
        payment.booking?.paymentStatus !==
        'paid'
      ) {
        await prisma.booking.update({
          where: {
            id: payment.bookingId,
          },

          data: {
            paymentStatus:
              'failed',

            status:
              'pending_payment',
          },
        })
      }

      return successResponse(
        {
          success: false,

          status: 'failed',

          orderId,

          paymentId:
            cashfreePaymentId,

          bookingId:
            payment.bookingId,

          failureReason,
        },
        'Payment failed'
      )
    }

    // ============================================================
    // NO PAYMENT ATTEMPT YET
    // ============================================================

    return successResponse(
      {
        success: false,

        pending: true,

        status: 'pending',

        orderId,

        orderStatus:
          cashfreeOrder?.order_status ||
          null,

        bookingId:
          payment.bookingId,

        bookingStatus:
          payment.booking?.status,

        paymentStatus:
          payment.booking?.paymentStatus,
      },
      'No successful payment found yet'
    )
  } catch (error) {
    console.error(
      '[PAYMENT STATUS ERROR]',
      {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      }
    )

    return errorResponse(
      error?.message ||
        'Internal server error',
      'SERVER_ERROR',
      500
    )
  }
}