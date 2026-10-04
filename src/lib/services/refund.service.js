// src/lib/services/refund.service.js

import { prisma } from '../prisma.js'
import { generateRefundNumber } from '../utils/helpers.js'
import { emailQueue, smsQueue } from '../queues/setup.js'

const CASHFREE_API_VERSION =
  process.env.CASHFREE_API_VERSION || '2025-01-01'

function getCashfreeBaseUrl() {
  return process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'
}

function getCashfreeHeaders(idempotencyKey = null) {
  if (!process.env.CASHFREE_APP_ID) {
    throw new Error('CASHFREE_APP_ID is not configured')
  }

  if (!process.env.CASHFREE_SECRET_KEY) {
    throw new Error('CASHFREE_SECRET_KEY is not configured')
  }

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
    'x-api-version': CASHFREE_API_VERSION,
  }

  if (idempotencyKey) {
    headers['x-idempotency-key'] = idempotencyKey
  }

  return headers
}

/**
 * Safely reads Cashfree API response.
 */
async function parseCashfreeResponse(response) {
  const text = await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return {
      message: text,
    }
  }
}

/**
 * Converts Cashfree errors into readable errors.
 */
function getCashfreeErrorMessage(data, fallback) {
  return (
    data?.message ||
    data?.type ||
    data?.code ||
    data?.error_description ||
    fallback
  )
}

/**
 * MEDLI cancellation policy.
 *
 * > 24 hours  = 100%
 * 12-24 hours = 50%
 * 4-12 hours  = 25%
 * < 4 hours   = 0%
 */
export function calculateRefundAmount(booking) {
  const startTime = new Date(booking.startTime)

  if (Number.isNaN(startTime.getTime())) {
    throw new Error('Invalid booking start time')
  }

  const hoursUntilStart =
    (startTime.getTime() - Date.now()) /
    (1000 * 60 * 60)

  let refundPercent = 0

  if (hoursUntilStart > 24) {
    refundPercent = 100
  } else if (hoursUntilStart >= 12) {
    refundPercent = 50
  } else if (hoursUntilStart >= 4) {
    refundPercent = 25
  }

  const bookingAmount =
    Number(booking.totalAmount || 0)

  const refundAmount =
    Math.round(
      bookingAmount *
        (refundPercent / 100) *
        100
    ) / 100

  return {
    refundPercent,
    refundAmount,
  }
}

/**
 * Map Cashfree refund status into MEDLI RefundStatus.
 */
function mapCashfreeRefundStatus(status) {
  const normalized =
    String(status || '').toUpperCase()

  if (normalized === 'SUCCESS') {
    return 'completed'
  }

  if (
    normalized === 'CANCELLED' ||
    normalized === 'FAILED'
  ) {
    return 'failed'
  }

  return 'processing'
}

/**
 * Create refund in Cashfree.
 *
 * Cashfree endpoint:
 * POST /pg/orders/{order_id}/refunds
 */
async function createCashfreeRefund({
  orderId,
  refundId,
  refundAmount,
  reason,
}) {
  const url =
    `${getCashfreeBaseUrl()}` +
    `/orders/${encodeURIComponent(orderId)}/refunds`

  const response = await fetch(url, {
    method: 'POST',

    headers: getCashfreeHeaders(
      `medli-refund-${refundId}`
    ),

    body: JSON.stringify({
      refund_amount:
        Number(refundAmount.toFixed(2)),

      refund_id:
        refundId,

      refund_note:
        reason || 'MEDLI booking refund',

      refund_speed:
        'STANDARD',
    }),

    cache: 'no-store',
  })

  const data =
    await parseCashfreeResponse(response)

  if (!response.ok) {
    console.error(
      '[Cashfree Refund] Create failed:',
      data
    )

    throw new Error(
      getCashfreeErrorMessage(
        data,
        `Cashfree refund failed (${response.status})`
      )
    )
  }

  return data
}

/**
 * Fetch one Cashfree refund.
 *
 * GET /pg/orders/{order_id}/refunds/{refund_id}
 *
 * IMPORTANT:
 * refund_id here is OUR merchant refund ID.
 */
async function fetchCashfreeRefund({
  orderId,
  refundId,
}) {
  const url =
    `${getCashfreeBaseUrl()}` +
    `/orders/${encodeURIComponent(orderId)}` +
    `/refunds/${encodeURIComponent(refundId)}`

  const response = await fetch(url, {
    method: 'GET',
    headers: getCashfreeHeaders(),
    cache: 'no-store',
  })

  const data =
    await parseCashfreeResponse(response)

  if (!response.ok) {
    console.error(
      '[Cashfree Refund] Fetch failed:',
      data
    )

    throw new Error(
      getCashfreeErrorMessage(
        data,
        `Unable to fetch Cashfree refund (${response.status})`
      )
    )
  }

  return data
}

/**
 * Updates booking/payment after refund reaches a terminal state.
 */
async function applyRefundResult({
  booking,
  payment,
  refund,
  cashfreeRefund,
}) {
  const cashfreeStatus =
    String(
      cashfreeRefund?.refund_status || ''
    ).toUpperCase()

  const nextStatus =
    mapCashfreeRefundStatus(cashfreeStatus)

  const isCompleted =
    nextStatus === 'completed'

  const isFailed =
    nextStatus === 'failed'

  const cfRefundId =
    cashfreeRefund?.cf_refund_id
      ? String(cashfreeRefund.cf_refund_id)
      : refund.cashfreeRefundId || null

  const failureReason =
    isFailed
      ? (
          cashfreeRefund?.status_description ||
          cashfreeRefund?.message ||
          'Cashfree refund failed'
        )
      : null

  const processedAt =
    isCompleted
      ? cashfreeRefund?.processed_at
        ? new Date(cashfreeRefund.processed_at)
        : new Date()
      : null

  const updatedRefund =
    await prisma.refund.update({
      where: {
        id: refund.id,
      },

      data: {
        status:
          nextStatus,

        cashfreeRefundId:
          cfRefundId,

        cashfreeRefundStatus:
          cashfreeStatus || null,

        processedAt,

        failureReason,
      },
    })

  if (isCompleted) {
    /*
     * Your current refund calculation creates one
     * percentage-based refund.
     *
     * If refundAmount < booking.totalAmount, this is
     * a PARTIAL refund, not a full refund.
     */

    const totalAmount =
      Number(booking.totalAmount || 0)

    const refundAmount =
      Number(refund.refundAmount || 0)

    const isFullRefund =
      refundAmount >= totalAmount - 0.01

    await prisma.booking.update({
      where: {
        id: booking.id,
      },

      data: {
        paymentStatus:
          isFullRefund
            ? 'refunded'
            : 'partial_refund',

        refundAmount,
      },
    })

    if (payment) {
      const alreadyRecorded =
        (payment.refunds || []).some(
          (entry) =>
            entry.refundTrackingId ===
              cfRefundId ||
            (
              entry.amount === refundAmount &&
              entry.reason === refund.reason
            )
        )

      const existingEntries =
        payment.refunds || []

      const refundEntry = {
        amount:
          refundAmount,

        refundTrackingId:
          cfRefundId,

        utrNumber:
          cashfreeRefund?.refund_arn ||
          null,

        reason:
          refund.reason ||
          booking.cancellationReason ||
          'Booking cancelled',

        status:
          'completed',

        processedAt:
          processedAt || new Date(),
      }

      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          /*
           * Only mark Payment itself as refunded
           * when the full payment has been refunded.
           *
           * For a partial refund keep the original
           * successful payment status.
           */
          status:
            isFullRefund
              ? 'refunded'
              : payment.status,

          refunds:
            alreadyRecorded
              ? existingEntries
              : [
                  ...existingEntries,
                  refundEntry,
                ],
        },
      })
    }
  }

  if (isFailed) {
    /*
     * Refund failure means the original payment
     * is still paid.
     */

    await prisma.booking.update({
      where: {
        id: booking.id,
      },

      data: {
        paymentStatus:
          'paid',
      },
    })
  }

  return updatedRefund
}

/**
 * Initiates a Cashfree refund.
 */
export async function processRefund({
  bookingId,
  initiatedBy,
  reason,
}) {
  console.log(
    '[REFUND] processRefund:',
    bookingId
  )

  // --------------------------------------------------
  // BOOKING
  // --------------------------------------------------

  const booking =
    await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
    })

  if (!booking) {
    throw new Error('Booking not found')
  }

  if (
    ![
      'paid',
      'partial_refund',
    ].includes(booking.paymentStatus)
  ) {
    throw new Error(
      'Booking is not eligible for refund'
    )
  }

  // --------------------------------------------------
  // CALCULATE REFUND
  // --------------------------------------------------

  const {
    refundPercent,
    refundAmount,
  } = calculateRefundAmount(booking)

  if (refundAmount <= 0) {
    throw new Error(
      'No refund applicable based on cancellation policy'
    )
  }

  // --------------------------------------------------
  // IDEMPOTENCY
  // --------------------------------------------------

  const existingRefund =
    await prisma.refund.findFirst({
      where: {
        bookingId,

        status: {
          in: [
            'pending',
            'processing',
            'completed',
          ],
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    })

  if (existingRefund) {
    console.log(
      '[REFUND] Existing refund:',
      existingRefund.refundNumber,
      existingRefund.status
    )

    return existingRefund
  }

  // --------------------------------------------------
  // CASHFREE PAYMENT
  // --------------------------------------------------

  const payment =
    await prisma.payment.findFirst({
      where: {
        bookingId,

        status: {
          in: [
            'success',
            'refunded',
          ],
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    })

  if (!payment) {
    throw new Error(
      'Successful payment not found for this booking'
    )
  }

  const cashfreeOrderId =
    payment.cashfreeOrderId ||
    booking.cashfreeOrderId

  if (!cashfreeOrderId) {
    throw new Error(
      'Cashfree order ID not found for this booking. Cannot initiate refund.'
    )
  }

  if (!payment.cashfreePaymentId) {
    console.warn(
      '[REFUND] Cashfree payment ID missing, but order ID is available:',
      cashfreeOrderId
    )
  }

  // --------------------------------------------------
  // REFUND NUMBER
  // --------------------------------------------------

  const refundNumber =
    generateRefundNumber()

  const refundReason =
    reason ||
    booking.cancellationReason ||
    'Booking cancelled'

  // --------------------------------------------------
  // CREATE LOCAL REFUND
  // --------------------------------------------------

  const refund =
    await prisma.refund.create({
      data: {
        refundNumber,

        bookingId,

        userId:
          booking.userId,

        bookingAmount:
          Number(
            booking.totalAmount || 0
          ),

        refundPercent,

        refundAmount,

        reason:
          refundReason,

        cancelledBy:
          booking.cancelledBy ||
          initiatedBy ||
          null,

        refundMethod:
          'original_source',

        status:
          'pending',

        initiatedBy:
          initiatedBy || null,

        /*
         * refundNumber is also our Cashfree
         * merchant refund_id.
         */
        cashfreeRefundStatus:
          'PENDING',
      },
    })

  console.log(
    '[REFUND] Local refund created:',
    refund.refundNumber
  )

  try {
    // ------------------------------------------------
    // CREATE CASHFREE REFUND
    // ------------------------------------------------

    const cashfreeRefund =
      await createCashfreeRefund({
        orderId:
          cashfreeOrderId,

        refundId:
          refundNumber,

        refundAmount,

        reason:
          refundReason,
      })

    console.log(
      '[Cashfree Refund] Response:',
      {
        refundId:
          cashfreeRefund.refund_id,

        cfRefundId:
          cashfreeRefund.cf_refund_id,

        status:
          cashfreeRefund.refund_status,
      }
    )

    // ------------------------------------------------
    // APPLY RESULT
    // ------------------------------------------------

    const updatedRefund =
      await applyRefundResult({
        booking,
        payment,
        refund,
        cashfreeRefund,
      })

    // ------------------------------------------------
    // NOTIFICATIONS
    // ------------------------------------------------

    const nextStatus =
      mapCashfreeRefundStatus(
        cashfreeRefund.refund_status
      )

    const notifData = {
      userId:
        booking.userId,

      bookingId:
        booking.bookingId,

      refundAmount,

      refundNumber,

      status:
        nextStatus,

      message:
        nextStatus === 'completed'
          ? 'Refund processed successfully'
          : 'Refund initiated and is being processed',
    }

    /*
     * Notification failures should NOT make a
     * successful gateway refund appear failed.
     */
    try {
      await Promise.all([
        smsQueue.add(
          'refund_processed',
          notifData
        ),

        emailQueue.add(
          'refund_processed',
          notifData
        ),
      ])
    } catch (notificationError) {
      console.error(
        '[Refund] Notification error:',
        notificationError.message
      )
    }

    console.log(
      `[Refund] ✅ ${refundNumber}` +
      ` | Cashfree: ${cashfreeRefund.cf_refund_id || '-'}` +
      ` | ${updatedRefund.status}`
    )

    return updatedRefund
  } catch (error) {
    // ------------------------------------------------
    // IMPORTANT IDEMPOTENCY HANDLING
    // ------------------------------------------------
    //
    // If Cashfree timed out after accepting the
    // request, we do NOT want retryRefund() to create
    // a completely new refund immediately.
    //
    // First attempt to fetch our refund using the
    // same merchant refund ID.
    // ------------------------------------------------

    console.error(
      '[Cashfree Refund] Create error:',
      error.message
    )

    try {
      const recoveredRefund =
        await fetchCashfreeRefund({
          orderId:
            cashfreeOrderId,

          refundId:
            refundNumber,
        })

      console.log(
        '[Cashfree Refund] Recovered after create error:',
        recoveredRefund.refund_status
      )

      return await applyRefundResult({
        booking,
        payment,
        refund,
        cashfreeRefund:
          recoveredRefund,
      })
    } catch (fetchError) {
      console.error(
        '[Cashfree Refund] Recovery failed:',
        fetchError.message
      )

      await prisma.refund.update({
        where: {
          id: refund.id,
        },

        data: {
          status:
            'failed',

          failureReason:
            error.message,
        },
      })

      throw error
    }
  }
}

/**
 * Fetch current refund status directly from Cashfree.
 */
export async function syncRefundStatus(
  refundId
) {
  // --------------------------------------------------
  // REFUND
  // --------------------------------------------------

  const refund =
    await prisma.refund.findUnique({
      where: {
        id: refundId,
      },
    })

  if (!refund) {
    throw new Error(
      'Refund not found'
    )
  }

  if (
    refund.status === 'completed'
  ) {
    return refund
  }

  // --------------------------------------------------
  // BOOKING
  // --------------------------------------------------

  const booking =
    await prisma.booking.findUnique({
      where: {
        id: refund.bookingId,
      },
    })

  if (!booking) {
    throw new Error(
      'Booking not found'
    )
  }

  // --------------------------------------------------
  // PAYMENT
  // --------------------------------------------------

  const payment =
    await prisma.payment.findFirst({
      where: {
        bookingId:
          refund.bookingId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })

  const cashfreeOrderId =
    payment?.cashfreeOrderId ||
    booking.cashfreeOrderId

  if (!cashfreeOrderId) {
    throw new Error(
      'No Cashfree order ID found for this refund'
    )
  }

  /*
   * We use refund.refundNumber here because that
   * value was sent to Cashfree as refund_id.
   *
   * cashfreeRefundId is cf_refund_id, which is
   * Cashfree's own reference.
   */
  const cashfreeRefund =
    await fetchCashfreeRefund({
      orderId:
        cashfreeOrderId,

      refundId:
        refund.refundNumber,
    })

  console.log(
    '[Refund Sync]',
    refund.refundNumber,
    cashfreeRefund.refund_status
  )

  return await applyRefundResult({
    booking,
    payment,
    refund,
    cashfreeRefund,
  })
}

/**
 * Retry a failed refund.
 *
 * IMPORTANT:
 * Before creating another Cashfree refund we first
 * check whether the previous merchant refund ID
 * actually exists at Cashfree.
 */
export async function retryRefund({
  refundId,
  initiatedBy,
}) {
  const refund =
    await prisma.refund.findUnique({
      where: {
        id: refundId,
      },
    })

  if (!refund) {
    throw new Error(
      'Refund not found'
    )
  }

  if (refund.status !== 'failed') {
    throw new Error(
      'Only failed refunds can be retried'
    )
  }

  const booking =
    await prisma.booking.findUnique({
      where: {
        id: refund.bookingId,
      },
    })

  if (!booking) {
    throw new Error(
      'Booking not found'
    )
  }

  const payment =
    await prisma.payment.findFirst({
      where: {
        bookingId:
          refund.bookingId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })

  const cashfreeOrderId =
    payment?.cashfreeOrderId ||
    booking.cashfreeOrderId

  if (cashfreeOrderId) {
    try {
      /*
       * Maybe the previous POST actually succeeded,
       * but MEDLI lost the response.
       */
      const cashfreeRefund =
        await fetchCashfreeRefund({
          orderId:
            cashfreeOrderId,

          refundId:
            refund.refundNumber,
        })

      console.log(
        '[Refund Retry] Existing Cashfree refund found:',
        cashfreeRefund.refund_status
      )

      return await applyRefundResult({
        booking,
        payment,
        refund,
        cashfreeRefund,
      })
    } catch (error) {
      console.log(
        '[Refund Retry] Previous refund not recoverable:',
        error.message
      )
    }
  }

  /*
   * The old failed local refund must not block the
   * new processRefund() idempotency query because
   * that query only checks pending/processing/completed.
   */

  return processRefund({
    bookingId:
      refund.bookingId,

    initiatedBy:
      initiatedBy ||
      refund.initiatedBy,

    reason:
      refund.reason ||
      'Retry refund',
  })
}