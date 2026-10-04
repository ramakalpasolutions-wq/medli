import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyWebhookSignature({
  rawBody,
  timestamp,
  signature,
}) {
  if (
    !rawBody ||
    !timestamp ||
    !signature ||
    !process.env.CASHFREE_SECRET_KEY
  ) {
    return false
  }

  const signedPayload =
    `${timestamp}${rawBody}`

  const expectedSignature =
    crypto
      .createHmac(
        'sha256',
        process.env.CASHFREE_SECRET_KEY
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
}

export async function POST(request) {
  try {
    /*
     * IMPORTANT:
     * Read request.text() BEFORE JSON.parse().
     *
     * Cashfree webhook verification requires the
     * original/raw body.
     */

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

    let payload

    try {
      payload =
        JSON.parse(rawBody)
    } catch {
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

    console.log(
      '[Cashfree Webhook]',
      payload?.type
    )

    const order =
      payload?.data?.order || {}

    const paymentData =
      payload?.data?.payment || {}

    const orderId =
      order.order_id

    if (!orderId) {
      return Response.json({
        success: true,
        ignored: true,
      })
    }

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

      /*
       * Return 200 for a correctly authenticated
       * webhook that doesn't belong to this DB.
       */
      return Response.json({
        success: true,
        ignored: true,
      })
    }

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

    const gatewayStatus =
      String(
        paymentData.payment_status ||
          ''
      ).toUpperCase()

    const cashfreePaymentId =
      paymentData.cf_payment_id
        ? String(
            paymentData.cf_payment_id
          )
        : null

    const paymentMethod =
      paymentData.payment_group ||
      paymentData.payment_method ||
      null

    const bankReference =
      paymentData.bank_reference ||
      null

    const failureReason =
      paymentData.payment_message ||
      paymentData.error_details
        ?.error_description ||
      null

    // ------------------------------------------
    // SUCCESS
    // ------------------------------------------

    if (
      gatewayStatus === 'SUCCESS'
    ) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status:
            'success',

          cashfreeOrderStatus:
            'PAID',

          cashfreePaymentStatus:
            gatewayStatus,

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

      /*
       * Webhooks may be delivered more than once.
       *
       * Only transition an unpaid booking.
       */

      if (
        booking.paymentStatus !==
        'paid'
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

            cashfreePaymentId:
              cashfreePaymentId,
          },
        })
      }

      console.log(
        '[Cashfree Webhook] SUCCESS:',
        orderId
      )
    }

    // ------------------------------------------
    // FAILED
    // ------------------------------------------

    else if (
      gatewayStatus === 'FAILED' ||
      gatewayStatus ===
        'USER_DROPPED'
    ) {
      /*
       * Never overwrite an already successful
       * payment with an older/duplicate failed
       * webhook.
       */

      if (
        payment.status !== 'success' &&
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

            cashfreePaymentStatus:
              gatewayStatus,

            cashfreePaymentId,

            cashfreeFailureReason:
              failureReason,

            webhookPayload:
              payload,

            failedAt:
              new Date(),
          },
        })

        await prisma.booking.update({
          where: {
            id: booking.id,
          },

          data: {
            paymentStatus:
              'failed',

            /*
             * Keep booking available for another
             * payment attempt.
             */
            status:
              'pending_payment',
          },
        })
      }

      console.log(
        '[Cashfree Webhook] FAILED:',
        orderId
      )
    }

    // ------------------------------------------
    // OTHER STATUS
    // ------------------------------------------

    else {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          cashfreePaymentStatus:
            gatewayStatus ||
            null,

          webhookPayload:
            payload,
        },
      })
    }

    return Response.json({
      success: true,
    })
  } catch (error) {
    console.error(
      '[Cashfree Webhook] ERROR:',
      error
    )

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