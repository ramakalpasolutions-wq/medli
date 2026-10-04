import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyWebhookSignature({
  rawBody,
  timestamp,
  signature,
}) {
  const secretKey =
    process.env.CASHFREE_SECRET_KEY

  if (
    !rawBody ||
    !timestamp ||
    !signature ||
    !secretKey
  ) {
    return false
  }

  try {
    const signedPayload =
      `${timestamp}${rawBody}`

    const expectedSignature =
      crypto
        .createHmac(
          'sha256',
          secretKey
        )
        .update(signedPayload)
        .digest('base64')

    const expectedBuffer =
      Buffer.from(expectedSignature)

    const receivedBuffer =
      Buffer.from(signature)

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return false
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    )
  } catch (error) {
    console.error(
      '[Cashfree Webhook] Signature verification error:',
      error
    )

    return false
  }
}

function normalizePaymentMethod(
  paymentData
) {
  const method =
    paymentData?.payment_group ||
    paymentData?.payment_method ||
    null

  if (!method) {
    return null
  }

  if (typeof method === 'string') {
    return method
  }

  try {
    return JSON.stringify(method)
  } catch {
    return null
  }
}

export async function POST(request) {
  try {
    // ============================================================
    // RAW BODY
    // ============================================================

    const rawBody =
      await request.text()

    const timestamp =
      request.headers.get(
        'x-webhook-timestamp'
      )

    const signature =
      request.headers.get(
        'x-webhook-signature'
      )

    // ============================================================
    // VERIFY SIGNATURE
    // ============================================================

    const valid =
      verifyWebhookSignature({
        rawBody,
        timestamp,
        signature,
      })

    if (!valid) {
      console.error(
        '[Cashfree Webhook] Invalid signature'
      )

      return Response.json(
        {
          success: false,
          message:
            'Invalid webhook signature',
        },
        {
          status: 401,
        }
      )
    }

    // ============================================================
    // PARSE PAYLOAD
    // ============================================================

    let payload

    try {
      payload =
        JSON.parse(rawBody)
    } catch (error) {
      console.error(
        '[Cashfree Webhook] Invalid JSON:',
        error
      )

      return Response.json(
        {
          success: false,
          message:
            'Invalid JSON payload',
        },
        {
          status: 400,
        }
      )
    }

    const webhookType =
      payload?.type || null

    const order =
      payload?.data?.order || {}

    const paymentData =
      payload?.data?.payment || {}

    const orderId =
      order?.order_id || null

    const gatewayStatus =
      String(
        paymentData?.payment_status ||
          ''
      ).toUpperCase()

    console.log(
      '[Cashfree Webhook] Received:',
      {
        type: webhookType,
        orderId,
        paymentStatus:
          gatewayStatus || null,
        cfPaymentId:
          paymentData?.cf_payment_id ||
          null,
      }
    )

    // ============================================================
    // ORDER ID
    // ============================================================

    if (!orderId) {
      console.warn(
        '[Cashfree Webhook] Missing order_id'
      )

      return Response.json({
        success: true,
        ignored: true,
      })
    }

    // ============================================================
    // FIND PAYMENT
    // ============================================================

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
      console.warn(
        '[Cashfree Webhook] Unknown order:',
        orderId
      )

      return Response.json({
        success: true,
        ignored: true,
      })
    }

    // ============================================================
    // FIND BOOKING
    // ============================================================

    const booking =
      await prisma.booking.findUnique({
        where: {
          id: payment.bookingId,
        },
      })

    if (!booking) {
      console.error(
        '[Cashfree Webhook] Booking missing:',
        payment.bookingId
      )

      return Response.json({
        success: true,
        ignored: true,
      })
    }

    // ============================================================
    // CASHFREE DATA
    // ============================================================

    const cashfreePaymentId =
      paymentData?.cf_payment_id
        ? String(
            paymentData.cf_payment_id
          )
        : null

    const paymentMethod =
      normalizePaymentMethod(
        paymentData
      )

    const bankReference =
      paymentData?.bank_reference ||
      null

    const failureReason =
      paymentData?.payment_message ||
      paymentData?.error_details
        ?.error_description ||
      null

    const paymentAmount =
      Number(
        paymentData?.payment_amount ||
          0
      )

    // ============================================================
    // SUCCESS
    // ============================================================

    if (
      gatewayStatus === 'SUCCESS'
    ) {
      const expectedAmount =
        Number(
          booking.totalAmount ||
            payment.amount ||
            0
        )

      if (
        Number.isFinite(expectedAmount) &&
        expectedAmount > 0 &&
        Number.isFinite(paymentAmount) &&
        paymentAmount > 0 &&
        Math.abs(
          expectedAmount -
            paymentAmount
        ) > 0.01
      ) {
        console.error(
          '[Cashfree Webhook] Amount mismatch:',
          {
            orderId,
            expectedAmount,
            paymentAmount,
          }
        )

        await prisma.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            cashfreePaymentStatus:
              gatewayStatus,

            cashfreePaymentId,

            cashfreeFailureReason:
              `Amount mismatch. Expected ${expectedAmount}, received ${paymentAmount}`,

            webhookPayload:
              payload,
          },
        })

        // Return 200 because webhook itself
        // was authentic. Do not confirm booking.
        return Response.json({
          success: true,
          ignored: true,
          reason:
            'amount_mismatch',
        })
      }

      // ========================================================
      // UPDATE PAYMENT
      // ========================================================

      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: 'success',

          cashfreeOrderStatus:
            order?.order_status ||
            'PAID',

          cashfreePaymentStatus:
            'SUCCESS',

          cashfreePaymentId,

          cashfreePaymentMethod:
            paymentMethod,

          cashfreeBankReference:
            bankReference,

          cashfreeFailureReason:
            null,

          webhookPayload:
            payload,

          paidAt:
            payment.paidAt ||
            new Date(),
        },
      })

      // ========================================================
      // UPDATE BOOKING
      // ========================================================

      if (
        booking.paymentStatus !==
          'paid' ||
        booking.status !==
          'confirmed'
      ) {
        await prisma.booking.update({
          where: {
            id: booking.id,
          },

          data: {
            paymentStatus:
              'paid',

            status:
              'confirmed',

            cashfreeOrderId:
              orderId,

            cashfreePaymentId,
          },
        })
      }

      // ========================================================
      // UPDATE INVOICE PAYMENT IDS
      // ========================================================

      try {
        await prisma.invoice.updateMany({
          where: {
            bookingId:
              booking.id,
          },

          data: {
            cashfreeOrderId:
              orderId,

            cashfreePaymentId,
          },
        })
      } catch (invoiceError) {
        console.error(
          '[Cashfree Webhook] Invoice update failed:',
          invoiceError?.message
        )
      }

      console.log(
        '[Cashfree Webhook] SUCCESS:',
        {
          orderId,
          bookingId:
            booking.id,
          bookingRef:
            booking.bookingId,
          cashfreePaymentId,
        }
      )

      return Response.json({
        success: true,
      })
    }

    // ============================================================
    // FAILED / USER DROPPED
    // ============================================================

    if (
      gatewayStatus === 'FAILED' ||
      gatewayStatus ===
        'USER_DROPPED'
    ) {
      /*
       * Cashfree can send multiple webhook events.
       * Never overwrite an already-successful payment.
       */

      if (
        payment.status !==
          'success' &&
        booking.paymentStatus !==
          'paid'
      ) {
        await prisma.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            status:
              'failed',

            cashfreeOrderStatus:
              order?.order_status ||
              null,

            cashfreePaymentStatus:
              gatewayStatus,

            cashfreePaymentId,

            cashfreePaymentMethod:
              paymentMethod,

            cashfreeBankReference:
              bankReference,

            cashfreeFailureReason:
              failureReason ||
              'Payment failed',

            webhookPayload:
              payload,

            failedAt:
              new Date(),
          },
        })

        /*
         * Do not cancel the booking.
         *
         * User may retry payment.
         */
        await prisma.booking.update({
          where: {
            id: booking.id,
          },

          data: {
            paymentStatus:
              'failed',

            status:
              'pending_payment',
          },
        })
      }

      console.log(
        '[Cashfree Webhook] FAILED:',
        {
          orderId,
          gatewayStatus,
          bookingId:
            booking.id,
        }
      )

      return Response.json({
        success: true,
      })
    }

    // ============================================================
    // PENDING / OTHER
    // ============================================================

    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        cashfreeOrderStatus:
          order?.order_status ||
          null,

        cashfreePaymentStatus:
          gatewayStatus ||
          null,

        cashfreePaymentId:
          cashfreePaymentId ||
          payment.cashfreePaymentId ||
          null,

        webhookPayload:
          payload,
      },
    })

    console.log(
      '[Cashfree Webhook] Other status:',
      {
        orderId,
        gatewayStatus,
      }
    )

    return Response.json({
      success: true,
    })
  } catch (error) {
    console.error(
      '[Cashfree Webhook] ERROR:',
      {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      }
    )

    /*
     * Return 500 here so Cashfree can retry
     * processing if our database/server failed.
     */
    return Response.json(
      {
        success: false,
        message:
          'Webhook processing failed',
      },
      {
        status: 500,
      }
    )
  }
}