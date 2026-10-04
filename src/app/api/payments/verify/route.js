import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

import {
  verifyAuth,
} from '@/lib/middleware/auth.middleware'

import {
  cashfreeRequest,
} from '@/lib/utils/cashfree'

export const dynamic =
  'force-dynamic'

// ============================================================
// HELPERS
// ============================================================

function normalizePaymentMethod(
  payment
) {
  const method =
    payment?.payment_group ||
    payment?.payment_method ||
    null

  if (!method) {
    return null
  }

  if (
    typeof method ===
    'string'
  ) {
    return method
  }

  try {
    return JSON.stringify(
      method
    )
  } catch {
    return null
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const user =
      await verifyAuth(
        request
      )

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Authentication required',
        },
        {
          status: 401,
        }
      )
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body =
      await request.json()

    const orderId =
      body?.orderId ||
      body?.cashfreeOrderId

    const bookingId =
      body?.bookingId ||
      null

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cashfree order ID is required',
        },
        {
          status: 400,
        }
      )
    }

    console.log(
      '[Cashfree verify] Request:',
      {
        orderId,
        bookingId,
      }
    )

    // ========================================================
    // FIND PAYMENT
    // ========================================================

    const payment =
      await prisma.payment.findFirst({
        where: {
          cashfreeOrderId:
            orderId,
        },

        orderBy: {
          createdAt: 'desc',
        },
      })

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Payment record not found',
        },
        {
          status: 404,
        }
      )
    }

    // ========================================================
    // FIND BOOKING
    // ========================================================

    const booking =
      await prisma.booking.findUnique({
        where: {
          id:
            payment.bookingId,
        },
      })

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Booking not found',
        },
        {
          status: 404,
        }
      )
    }

    // ========================================================
    // BOOKING MATCH
    // ========================================================

    if (
      bookingId &&
      String(booking.id) !==
        String(bookingId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Booking does not match payment order',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // OWNERSHIP
    // ========================================================

    const authUserId =
      user.userId ||
      user.id

    const isOwner =
      String(
        booking.userId
      ) ===
      String(
        authUserId
      )

    const isSuperAdmin =
      user.role ===
      'super_admin'

    if (
      !isOwner &&
      !isSuperAdmin
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You are not authorized to verify this payment',
        },
        {
          status: 403,
        }
      )
    }

    // ========================================================
    // ALREADY VERIFIED
    // ========================================================

    if (
      booking.paymentStatus ===
        'paid' &&
      payment.status ===
        'success'
    ) {
      return NextResponse.json(
        {
          success: true,

          message:
            'Payment already verified',

          data: {
            bookingId:
              booking.id,

            bookingRef:
              booking.bookingId,

            orderId:
              payment.cashfreeOrderId,

            paymentId:
              payment.cashfreePaymentId,

            paymentStatus:
              'SUCCESS',

            bookingStatus:
              booking.status,
          },
        },
        {
          status: 200,
        }
      )
    }

    // ========================================================
    // CASHFREE ORDER
    // ========================================================

    const cashfreeOrder =
      await cashfreeRequest(
        `/orders/${encodeURIComponent(
          orderId
        )}`
      )

    console.log(
      '[Cashfree verify] Order:',
      {
        orderId,

        cfOrderId:
          cashfreeOrder
            ?.cf_order_id ||
          null,

        orderStatus:
          cashfreeOrder
            ?.order_status ||
          null,

        amount:
          cashfreeOrder
            ?.order_amount ||
          null,
      }
    )

    // ========================================================
    // CASHFREE PAYMENTS
    // ========================================================

    const response =
      await cashfreeRequest(
        `/orders/${encodeURIComponent(
          orderId
        )}/payments`
      )

    const payments =
      Array.isArray(
        response
      )
        ? response
        : []

    console.log(
      '[Cashfree verify] Payments:',
      payments.map(
        (item) => ({
          cfPaymentId:
            item
              ?.cf_payment_id ||
            null,

          status:
            item
              ?.payment_status ||
            null,

          amount:
            item
              ?.payment_amount ||
            null,
        })
      )
    )

    // ========================================================
    // FIND SUCCESS
    // ========================================================

    const successfulPayment =
      payments.find(
        (item) =>
          String(
            item
              ?.payment_status ||
              ''
          ).toUpperCase() ===
          'SUCCESS'
      )

    // ========================================================
    // NO SUCCESS
    // ========================================================

    if (
      !successfulPayment
    ) {
      const pendingPayment =
        payments.find(
          (item) =>
            String(
              item
                ?.payment_status ||
                ''
            ).toUpperCase() ===
            'PENDING'
        )

      if (pendingPayment) {
        await prisma.payment.update({
          where: {
            id:
              payment.id,
          },

          data: {
            cashfreeOrderStatus:
              cashfreeOrder
                ?.order_status ||
              null,

            cashfreePaymentStatus:
              'PENDING',

            status:
              'pending',

            callbackData: {
              order:
                cashfreeOrder,

              payments,
            },
          },
        })

        return NextResponse.json(
          {
            success: false,

            pending: true,

            error:
              'Payment is still pending',

            data: {
              orderId,

              paymentStatus:
                'PENDING',
            },
          },
          {
            status: 202,
          }
        )
      }

      // ======================================================
      // FAILED PAYMENT
      // ======================================================

      const failedPayment =
        payments.find(
          (item) => {
            const status =
              String(
                item
                  ?.payment_status ||
                  ''
              ).toUpperCase()

            return (
              status ===
                'FAILED' ||
              status ===
                'USER_DROPPED'
            )
          }
        )

      if (failedPayment) {
        const failureReason =
          failedPayment
            ?.payment_message ||
          failedPayment
            ?.error_details
            ?.error_description ||
          'Payment failed'

        await prisma.payment.update({
          where: {
            id:
              payment.id,
          },

          data: {
            cashfreeOrderStatus:
              cashfreeOrder
                ?.order_status ||
              null,

            cashfreePaymentId:
              failedPayment
                ?.cf_payment_id
                ? String(
                    failedPayment
                      .cf_payment_id
                  )
                : null,

            cashfreePaymentStatus:
              failedPayment
                ?.payment_status ||
              'FAILED',

            cashfreeFailureReason:
              failureReason,

            status:
              'failed',

            failedAt:
              new Date(),

            callbackData: {
              order:
                cashfreeOrder,

              payments,
            },
          },
        })

        if (
          booking
            .paymentStatus !==
          'paid'
        ) {
          await prisma.booking.update({
            where: {
              id:
                booking.id,
            },

            data: {
              paymentStatus:
                'failed',

              status:
                'pending_payment',
            },
          })
        }

        return NextResponse.json(
          {
            success: false,

            error:
              failureReason,

            data: {
              orderId,

              paymentStatus:
                failedPayment
                  ?.payment_status ||
                'FAILED',
            },
          },
          {
            status: 400,
          }
        )
      }

      // ======================================================
      // NO PAYMENT ATTEMPT YET
      // ======================================================

      await prisma.payment.update({
        where: {
          id:
            payment.id,
        },

        data: {
          cashfreeOrderStatus:
            cashfreeOrder
              ?.order_status ||
            null,

          cashfreePaymentStatus:
            null,

          status:
            'pending',

          callbackData: {
            order:
              cashfreeOrder,

            payments,
          },
        },
      })

      return NextResponse.json(
        {
          success: false,

          pending: true,

          error:
            'No successful payment found',

          data: {
            orderId,

            orderStatus:
              cashfreeOrder
                ?.order_status ||
              null,
          },
        },
        {
          status: 202,
        }
      )
    }

    // ========================================================
    // AMOUNT VERIFICATION
    // ========================================================

    const expectedAmount =
      Number(
        booking.totalAmount
      )

    const paidAmount =
      Number(
        successfulPayment
          ?.payment_amount
      )

    if (
      !Number.isFinite(
        expectedAmount
      ) ||
      expectedAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid booking amount',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !Number.isFinite(
        paidAmount
      ) ||
      paidAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid paid amount returned by Cashfree',
        },
        {
          status: 400,
        }
      )
    }

    if (
      Math.abs(
        expectedAmount -
          paidAmount
      ) > 0.01
    ) {
      console.error(
        '[Cashfree verify] Amount mismatch:',
        {
          orderId,
          expectedAmount,
          paidAmount,
        }
      )

      return NextResponse.json(
        {
          success: false,

          error:
            'Payment amount does not match booking amount',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // PAYMENT DETAILS
    // ========================================================

    const cfPaymentId =
      successfulPayment
        ?.cf_payment_id
        ? String(
            successfulPayment
              .cf_payment_id
          )
        : null

    const cfOrderId =
      cashfreeOrder
        ?.cf_order_id
        ? String(
            cashfreeOrder
              .cf_order_id
          )
        : payment
            .cashfreeCfOrderId ||
          null

    const paymentMethod =
      normalizePaymentMethod(
        successfulPayment
      )

    const bankReference =
      successfulPayment
        ?.bank_reference ||
      null

    // ========================================================
    // UPDATE PAYMENT
    // ========================================================

    await prisma.payment.update({
      where: {
        id:
          payment.id,
      },

      data: {
        status:
          'success',

        amount:
          paidAmount,

        currency:
          successfulPayment
            ?.payment_currency ||
          cashfreeOrder
            ?.order_currency ||
          'INR',

        cashfreeOrderId:
          orderId,

        cashfreeCfOrderId:
          cfOrderId,

        cashfreePaymentId:
          cfPaymentId,

        cashfreePaymentMethod:
          paymentMethod,

        cashfreeBankReference:
          bankReference,

        cashfreeFailureReason:
          null,

        cashfreeOrderStatus:
          cashfreeOrder
            ?.order_status ||
          'PAID',

        cashfreePaymentStatus:
          'SUCCESS',

        callbackData: {
          order:
            cashfreeOrder,

          payment:
            successfulPayment,

          payments,
        },

        paidAt:
          payment.paidAt ||
          new Date(),
      },
    })

    // ========================================================
    // UPDATE BOOKING
    // ========================================================

    const updatedBooking =
      await prisma.booking.update({
        where: {
          id:
            booking.id,
        },

        data: {
          status:
            'confirmed',

          paymentStatus:
            'paid',

          cashfreeOrderId:
            orderId,

          cashfreeCfOrderId:
            cfOrderId,

          cashfreePaymentId:
            cfPaymentId,
        },
      })

    // ========================================================
    // UPDATE INVOICE
    // ========================================================

    try {
      await prisma.invoice.updateMany({
        where: {
          bookingId:
            booking.id,
        },

        data: {
          cashfreePaymentId:
            cfPaymentId,

          cashfreeOrderId:
            orderId,

          paymentMethod:
            paymentMethod ||
            'Cashfree',

          paymentMode:
            'online',
        },
      })
    } catch (invoiceError) {
      console.error(
        '[Cashfree verify] Invoice update failed:',
        invoiceError
          ?.message
      )
    }

    console.log(
      '[Cashfree verify] Payment verified:',
      {
        orderId,

        cfPaymentId,

        bookingId:
          updatedBooking.id,

        bookingRef:
          updatedBooking
            .bookingId,

        paymentStatus:
          updatedBooking
            .paymentStatus,

        bookingStatus:
          updatedBooking
            .status,
      }
    )

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          'Payment verified successfully',

        data: {
          bookingId:
            updatedBooking.id,

          bookingRef:
            updatedBooking
              .bookingId,

          orderId,

          cfOrderId,

          paymentId:
            cfPaymentId,

          paymentStatus:
            'SUCCESS',

          bookingStatus:
            updatedBooking
              .status,

          amount:
            paidAmount,
        },
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      '[Cashfree verify] ERROR:',
      {
        name:
          error?.name,

        message:
          error?.message,

        status:
          error?.status,

        response:
          error
            ?.cashfreeResponse,

        stack:
          error?.stack,
      }
    )

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          'Payment verification failed',
      },
      {
        status:
          error?.status &&
          Number(
            error.status
          ) >= 400 &&
          Number(
            error.status
          ) < 600
            ? Number(
                error.status
              )
            : 500,
      }
    )
  }
}