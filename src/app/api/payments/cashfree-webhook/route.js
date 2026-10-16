// src/app/api/payments/cashfree-webhook/route.js

import crypto from 'crypto'

import { prisma } from '@/lib/prisma'

import {
  queueBookingConfirmedWhatsapp,
} from '@/lib/services/booking-notification.service'

export const dynamic = 'force-dynamic'

// ============================================================
// VERIFY CASHFREE WEBHOOK SIGNATURE
// ============================================================

function verifyWebhookSignature({
  rawBody,
  timestamp,
  signature,
}) {
  const secretKey =
    process.env
      .CASHFREE_SECRET_KEY

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
        .update(
          signedPayload
        )
        .digest(
          'base64'
        )

    const expectedBuffer =
      Buffer.from(
        expectedSignature
      )

    const receivedBuffer =
      Buffer.from(
        signature
      )

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

// ============================================================
// NORMALIZE PAYMENT METHOD
// ============================================================

function normalizePaymentMethod(
  paymentData
) {
  const method =
    paymentData
      ?.payment_group ||
    paymentData
      ?.payment_method ||
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
    // RAW BODY
    // ========================================================

    /*
     * IMPORTANT:
     *
     * Cashfree signature verification must use the exact
     * raw body. Do not call request.json() before this.
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

    // ========================================================
    // VERIFY SIGNATURE
    // ========================================================

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

    // ========================================================
    // PARSE PAYLOAD
    // ========================================================

    let payload

    try {
      payload =
        JSON.parse(
          rawBody
        )
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

    // ========================================================
    // CASHFREE PAYLOAD
    // ========================================================

    const webhookType =
      payload?.type ||
      null

    const order =
      payload?.data
        ?.order ||
      {}

    const paymentData =
      payload?.data
        ?.payment ||
      {}

    const orderId =
      order?.order_id ||
      null

    const gatewayStatus =
      String(
        paymentData
          ?.payment_status ||
          ''
      ).toUpperCase()

    console.log(
      '[Cashfree Webhook] Received:',
      {
        type:
          webhookType,

        orderId,

        paymentStatus:
          gatewayStatus ||
          null,

        cfPaymentId:
          paymentData
            ?.cf_payment_id ||
          null,
      }
    )

    // ========================================================
    // ORDER ID
    // ========================================================

    if (!orderId) {
      console.warn(
        '[Cashfree Webhook] Missing order_id'
      )

      return Response.json({
        success: true,
        ignored: true,
      })
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

        orderBy: {
          createdAt:
            'desc',
        },
      })

    if (!payment) {
      console.warn(
        '[Cashfree Webhook] Unknown order:',
        orderId
      )

      /*
       * Webhook is valid, but the order is not ours
       * or local record isn't available.
       *
       * Return 200 so Cashfree doesn't continuously
       * retry an unknown order.
       */

      return Response.json({
        success: true,
        ignored: true,
      })
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
      console.error(
        '[Cashfree Webhook] Booking missing:',
        payment.bookingId
      )

      return Response.json({
        success: true,
        ignored: true,
      })
    }

    // ========================================================
    // CASHFREE PAYMENT DETAILS
    // ========================================================

    const cashfreePaymentId =
      paymentData
        ?.cf_payment_id
        ? String(
            paymentData
              .cf_payment_id
          )
        : null

    const paymentMethod =
      normalizePaymentMethod(
        paymentData
      )

    const bankReference =
      paymentData
        ?.bank_reference ||
      null

    const failureReason =
      paymentData
        ?.payment_message ||
      paymentData
        ?.error_details
        ?.error_description ||
      null

    const paymentAmount =
      Number(
        paymentData
          ?.payment_amount ||
          0
      )

    // ========================================================
    // SUCCESS
    // ========================================================

    if (
      gatewayStatus ===
      'SUCCESS'
    ) {
      // ======================================================
      // AMOUNT VERIFICATION
      // ======================================================

      const expectedAmount =
        Number(
          booking.totalAmount ||
          payment.amount ||
          0
        )

      if (
        Number.isFinite(
          expectedAmount
        ) &&
        expectedAmount > 0 &&
        Number.isFinite(
          paymentAmount
        ) &&
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
            id:
              payment.id,
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

        /*
         * Webhook itself is authentic, so return 200.
         * Booking MUST NOT be confirmed.
         */

        return Response.json({
          success: true,

          ignored: true,

          reason:
            'amount_mismatch',
        })
      }

      // ======================================================
      // UPDATE PAYMENT
      // ======================================================

      await prisma.payment.update({
        where: {
          id:
            payment.id,
        },

        data: {
          status:
            'success',

          cashfreeOrderStatus:
            order
              ?.order_status ||
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

      // ======================================================
      // UPDATE BOOKING
      // ======================================================

      let updatedBooking =
        booking

      if (
        booking.paymentStatus !==
          'paid' ||
        booking.status !==
          'confirmed' ||
        booking.cashfreeOrderId !==
          orderId ||
        (
          cashfreePaymentId &&
          booking.cashfreePaymentId !==
            cashfreePaymentId
        )
      ) {
        updatedBooking =
          await prisma.booking.update({
            where: {
              id:
                booking.id,
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

      // ======================================================
      // UPDATE INVOICE
      // ======================================================

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

            paymentMethod:
              paymentMethod ||
              'Cashfree',

            paymentMode:
              'online',
          },
        })
      } catch (invoiceError) {
        console.error(
          '[Cashfree Webhook] Invoice update failed:',
          invoiceError?.message
        )
      }

      // ======================================================
      // WHATSAPP BOOKING CONFIRMATION
      // ======================================================

      /*
       * This queues:
       *
       * hospital / online:
       *   patient
       *   doctor
       *   hospital
       *
       * lab:
       *   patient
       *   lab
       *
       * The queue uses a deterministic jobId, therefore
       * /verify and this webhook won't intentionally create
       * separate jobs for the same booking.
       */

      await queueBookingConfirmedWhatsapp(
        updatedBooking.id
      )

      // ======================================================
      // LOG
      // ======================================================

      console.log(
        '[Cashfree Webhook] SUCCESS:',
        {
          orderId,

          bookingId:
            updatedBooking.id,

          bookingRef:
            updatedBooking
              .bookingId,

          cashfreePaymentId,

          whatsappQueued:
            true,
        }
      )

      return Response.json({
        success: true,
      })
    }

    // ========================================================
    // FAILED / USER DROPPED
    // ========================================================

    if (
      gatewayStatus ===
        'FAILED' ||
      gatewayStatus ===
        'USER_DROPPED'
    ) {
      /*
       * Cashfree can send multiple payment events for an
       * order.
       *
       * NEVER turn a successfully paid booking back into
       * failed/pending because of a later failed attempt.
       */

      if (
        payment.status !==
          'success' &&
        booking.paymentStatus !==
          'paid'
      ) {
        await prisma.payment.update({
          where: {
            id:
              payment.id,
          },

          data: {
            status:
              'failed',

            cashfreeOrderStatus:
              order
                ?.order_status ||
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
         * Keep it available for payment retry.
         */

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

    // ========================================================
    // PENDING / OTHER
    // ========================================================

    /*
     * Do not modify Booking.status here.
     *
     * A pending webhook should not overwrite an already
     * successful booking.
     */

    await prisma.payment.update({
      where: {
        id:
          payment.id,
      },

      data: {
        cashfreeOrderStatus:
          order
            ?.order_status ||
          null,

        cashfreePaymentStatus:
          gatewayStatus ||
          null,

        cashfreePaymentId:
          cashfreePaymentId ||
          payment
            .cashfreePaymentId ||
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
        name:
          error?.name,

        message:
          error?.message,

        stack:
          error?.stack,
      }
    )

    /*
     * Return 500 so Cashfree can retry when MEDLI
     * genuinely failed to process an authentic webhook.
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