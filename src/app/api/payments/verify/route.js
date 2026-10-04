import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { cashfreeRequest } from '@/lib/utils/cashfree'

export async function POST(request) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const user = await verifyAuth(request)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        {
          status: 401,
        }
      )
    }

    // ========================================================
    // REQUEST
    // ========================================================

    const body = await request.json()

    const orderId =
      body?.orderId ||
      body?.cashfreeOrderId

    const bookingId =
      body?.bookingId

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cashfree order ID is required',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // FIND PAYMENT
    // ========================================================

    const payment =
      await prisma.payment.findFirst({
        where: {
          cashfreeOrderId:
            orderId,
        },
      })

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment record not found',
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
          error: 'Booking not found',
        },
        {
          status: 404,
        }
      )
    }

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
      String(booking.userId) ===
      String(authUserId)

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
    // IDEMPOTENT SUCCESS
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
    // FETCH ORDER FROM CASHFREE
    // ========================================================

    const cashfreeOrder =
      await cashfreeRequest(
        `/orders/${encodeURIComponent(orderId)}`
      )

    console.log(
      '[Cashfree verify] Order:',
      {
        orderId,
        orderStatus:
          cashfreeOrder?.order_status,
      }
    )

    // ========================================================
    // FETCH PAYMENTS FROM CASHFREE
    // ========================================================

    const cashfreePayments =
      await cashfreeRequest(
        `/orders/${encodeURIComponent(orderId)}/payments`
      )

    const payments =
      Array.isArray(
        cashfreePayments
      )
        ? cashfreePayments
        : []

    console.log(
      '[Cashfree verify] Payments:',
      payments.map(
        (item) => ({
          cfPaymentId:
            item?.cf_payment_id,

          status:
            item?.payment_status,

          amount:
            item?.payment_amount,
        })
      )
    )

    // ========================================================
    // FIND SUCCESSFUL PAYMENT
    // ========================================================

    const successfulPayment =
      payments.find(
        (item) =>
          String(
            item?.payment_status ||
              ''
          ).toUpperCase() ===
          'SUCCESS'
      )

    // ========================================================
    // NO SUCCESSFUL PAYMENT
    // ========================================================

    if (!successfulPayment) {
      const pendingPayment =
        payments.find(
          (item) =>
            String(
              item?.payment_status ||
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

            callbackData:
              {
                order:
                  cashfreeOrder,

                payments:
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

      const failedPayment =
        payments.find(
          (item) => {
            const status =
              String(
                item?.payment_status ||
                  ''
              ).toUpperCase()

            return (
              status === 'FAILED' ||
              status ===
                'USER_DROPPED'
            )
          }
        )

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
            failedPayment
              ?.payment_message ||
            failedPayment
              ?.error_details
              ?.error_description ||
            'Payment failed',

          status:
            'failed',

          failedAt:
            new Date(),

          callbackData: {
            order:
              cashfreeOrder,

            payments:
              payments,
          },
        },
      })

      return NextResponse.json(
        {
          success: false,

          error:
            failedPayment
              ?.payment_message ||
            'Payment was not successful',

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
        paidAmount
      ) ||
      Math.abs(
        expectedAmount -
          paidAmount
      ) > 0.01
    ) {
      console.error(
        '[Cashfree verify] Amount mismatch:',
        {
          bookingId:
            booking.id,

          expectedAmount,

          paidAmount,

          orderId,
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
    // NORMALIZE PAYMENT METHOD
    // ========================================================

    let paymentMethod =
      successfulPayment
        ?.payment_group ||
      null

    if (
      successfulPayment
        ?.payment_method
    ) {
      if (
        typeof successfulPayment
          .payment_method ===
        'string'
      ) {
        paymentMethod =
          successfulPayment
            .payment_method
      } else {
        try {
          paymentMethod =
            JSON.stringify(
              successfulPayment
                .payment_method
            )
        } catch {
          // Keep payment_group.
        }
      }
    }

    // ========================================================
    // BANK REFERENCE
    // ========================================================

    const bankReference =
      successfulPayment
        ?.bank_reference
        ? String(
            successfulPayment
              .bank_reference
          )
        : null

    const cfPaymentId =
      successfulPayment
        ?.cf_payment_id
        ? String(
            successfulPayment
              .cf_payment_id
          )
        : null

    // ========================================================
    // MARK PAYMENT SUCCESS
    // ========================================================

    const updatedPayment =
      await prisma.payment.update({
        where: {
          id:
            payment.id,
        },

        data: {
          cashfreePaymentId:
            cfPaymentId,

          cashfreeOrderStatus:
            cashfreeOrder
              ?.order_status ||
            'PAID',

          cashfreePaymentStatus:
            'SUCCESS',

          cashfreePaymentMethod:
            paymentMethod,

          cashfreeBankReference:
            bankReference,

          cashfreeFailureReason:
            null,

          amount:
            paidAmount,

          currency:
            successfulPayment
              ?.payment_currency ||
            'INR',

          status:
            'success',

          callbackData: {
            order:
              cashfreeOrder,

            payment:
              successfulPayment,
          },

          paidAt:
            new Date(),

          failedAt:
            null,
        },
      })

    // ========================================================
    // CONFIRM BOOKING
    // ========================================================

    const updatedBooking =
      await prisma.booking.update({
        where: {
          id:
            booking.id,
        },

        data: {
          cashfreePaymentId:
            cfPaymentId,

          paymentStatus:
            'paid',

          status:
            'confirmed',
        },
      })

    // ========================================================
    // UPDATE EXISTING INVOICE
    // ========================================================

    try {
      const invoice =
        await prisma.invoice.findFirst({
          where: {
            bookingId:
              booking.id,

            type:
              'invoice',
          },

          orderBy: {
            createdAt:
              'desc',
          },
        })

      if (invoice) {
        await prisma.invoice.update({
          where: {
            id:
              invoice.id,
          },

          data: {
            paymentMethod:
              'Cashfree',

            paymentMode:
              paymentMethod ||
              'Cashfree',

            cashfreePaymentId:
              cfPaymentId,

            cashfreeOrderId:
              orderId,
          },
        })
      }
    } catch (invoiceError) {
      console.error(
        '[Cashfree verify] Invoice update failed:',
        invoiceError?.message
      )
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      '[Cashfree verify] Payment verified:',
      {
        bookingId:
          booking.id,

        bookingRef:
          booking.bookingId,

        orderId,

        cfPaymentId,

        amount:
          paidAmount,
      }
    )

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

          cashfreeOrderId:
            orderId,

          paymentId:
            cfPaymentId,

          cashfreePaymentId:
            cfPaymentId,

          paymentStatus:
            'SUCCESS',

          bookingStatus:
            updatedBooking.status,

          amount:
            paidAmount,

          currency:
            updatedPayment
              .currency,
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

        cashfreeResponse:
          error
            ?.cashfreeResponse,
      }
    )

    return NextResponse.json(
      {
        success: false,

        error:
          error?.cashfreeResponse
            ?.message ||
          error?.message ||
          'Failed to verify payment',
      },
      {
        status:
          error?.status >= 400 &&
          error?.status < 500
            ? 400
            : 500,
      }
    )
  }
}