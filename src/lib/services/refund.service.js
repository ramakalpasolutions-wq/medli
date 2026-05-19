// C:\Users\ASUS\medli2\src\lib\services\refund.service.js
// ✅ ONLY CHANGE from your original:
//    - Removed: import { process1PayRefund } from '@/lib/services/payment.service'
//    - Replaced: process1PayRefund() call → Razorpay SDK refund call
//    - Added:    syncRefundStatus() — used by /api/refunds/[id]/verify/route.js
//    - Everything else (calculateRefundAmount, retryRefund, structure) UNCHANGED

import Razorpay                   from 'razorpay'
import { prisma } from '../prisma.js'
import { generateRefundNumber } from '../utils/helpers.js'
import { emailQueue, smsQueue } from '../queues/setup.js'

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay SDK instance
// Works with test keys (rzp_test_*) and live keys (rzp_live_*) — no code change needed
// ─────────────────────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ─────────────────────────────────────────────────────────────────────────────
// REFUND POLICY — UNCHANGED
// >24h = 100% | 12-24h = 50% | 4-12h = 25% | <4h = 0%
// ─────────────────────────────────────────────────────────────────────────────
export function calculateRefundAmount(booking) {
  const hoursUntilStart =
    (new Date(booking.startTime) - new Date()) / (1000 * 60 * 60)

  let refundPercent = 0

  if      (hoursUntilStart > 24)  refundPercent = 100
  else if (hoursUntilStart >= 12) refundPercent = 50
  else if (hoursUntilStart >= 4)  refundPercent = 25
  else                             refundPercent = 0

  const refundAmount =
    Math.round((Number(booking.totalAmount || 0) * (refundPercent / 100)) * 100) / 100

  return { refundPercent, refundAmount }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS REFUND — replaces process1PayRefund with Razorpay SDK
// ─────────────────────────────────────────────────────────────────────────────
export async function processRefund({ bookingId, initiatedBy, reason }) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!booking) throw new Error('Booking not found')

  if (!['paid', 'partial_refund'].includes(booking.paymentStatus)) {
    throw new Error('Booking is not eligible for refund')
  }

  const { refundPercent, refundAmount } = calculateRefundAmount(booking)

  if (refundAmount <= 0) {
    throw new Error('No refund applicable based on cancellation policy')
  }

  // ── Idempotency: don't create duplicate refunds ──────────────────────────
  const existingRefund = await prisma.refund.findFirst({
    where: {
      bookingId,
      status: { in: ['pending', 'processing', 'completed'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existingRefund) return existingRefund

  // ── Get Razorpay payment ID ───────────────────────────────────────────────
  const payment = await prisma.payment.findFirst({
    where:   { bookingId },
    orderBy: { createdAt: 'desc' },
  })

  if (!payment?.razorpayPaymentId) {
    throw new Error(
      'Razorpay payment ID not found for this booking. Cannot initiate refund.'
    )
  }

  // ── Create Refund record as pending ──────────────────────────────────────
  const refundNumber = generateRefundNumber()

  const refund = await prisma.refund.create({
    data: {
      refundNumber,
      bookingId,
      userId:        booking.userId,
      bookingAmount: booking.totalAmount,
      refundPercent,
      refundAmount,
      reason:      reason || booking.cancellationReason || 'Booking cancelled',
      cancelledBy: booking.cancelledBy || initiatedBy || null,
      refundMethod: 'original_source',
      status:       'pending',
      initiatedBy:  initiatedBy || null,
    },
  })

  try {
    // ── ✅ Call Razorpay SDK refund API ───────────────────────────────────────
    // razorpay.payments.refund(paymentId, { amount, notes })
    // amount is in paise (₹ × 100)
    // Works identically with test keys and live keys
    const razorpayRefund = await razorpay.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: Math.round(refundAmount * 100), // paise
        notes: {
          booking_id:    bookingId,
          refund_number: refundNumber,
          reason:        reason || 'Booking cancelled',
        },
        speed: 'normal', // 'normal' = 5-7 days, 'optimum' = instant if eligible
      }
    )

    // razorpayRefund.status: 'pending' | 'processed' | 'failed'
    const rzStatus  = razorpayRefund.status
    const isCompleted = rzStatus === 'processed'
    const isFailed    = rzStatus === 'failed'

    // Map Razorpay status → our DB status
    // 'pending'   → 'processing'  (Razorpay is processing it asynchronously)
    // 'processed' → 'completed'   (instant refund, rare on test mode)
    // 'failed'    → 'failed'
    const nextStatus = isCompleted ? 'completed' : isFailed ? 'failed' : 'processing'

    const updatedRefund = await prisma.refund.update({
      where: { id: refund.id },
      data: {
        status:               nextStatus,
        razorpayRefundId:     razorpayRefund.id,      // rfnd_XXXXXX
        razorpayRefundStatus: rzStatus,
        processedAt:          isCompleted ? new Date() : null,
        failureReason:        isFailed ? (razorpayRefund.description || 'Razorpay refund failed') : null,
      },
    })

    // ── Update Booking payment status ────────────────────────────────────────
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: isCompleted ? 'refunded' : booking.paymentStatus,
        refundAmount,
      },
    })

    // ── Update Payment record — append to refunds[] embedded array ───────────
    if (payment) {
      const refundEntry = {
        amount:           refundAmount,
        refundTrackingId: razorpayRefund.id || null,
        utrNumber:        null,
        reason:           reason || booking.cancellationReason || 'Booking cancelled',
        status:           nextStatus,
        processedAt:      isCompleted ? new Date() : null,
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status:  isCompleted ? 'refunded' : payment.status,
          refunds: [...(payment.refunds || []), refundEntry],
        },
      })
    }

    // ── Notify user ──────────────────────────────────────────────────────────
    const notifData = {
      userId:       booking.userId,
      bookingId:    booking.bookingId,
      refundAmount,
      refundNumber,
      status:       nextStatus,
      message:      isCompleted
        ? 'Refund processed successfully'
        : 'Refund initiated — will be credited in 5-7 business days',
    }

    await smsQueue.add('refund_processed',   notifData)
    await emailQueue.add('refund_processed', notifData)

    console.log(
      `[Refund] ✅ ${refundNumber} — Razorpay: ${razorpayRefund.id} — status: ${nextStatus}`
    )

    return updatedRefund

  } catch (err) {
    await prisma.refund.update({
      where: { id: refund.id },
      data:  { status: 'failed', failureReason: err.message },
    })

    console.error(`[Refund] ❌ ${refundNumber} failed:`, err.message)
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC REFUND STATUS — called by GET /api/refunds/[id]/verify
// Polls Razorpay for current status of a 'processing' refund
// No webhook needed — admin clicks "Verify" in the refunds table
// ─────────────────────────────────────────────────────────────────────────────
export async function syncRefundStatus(refundId) {
  const refund = await prisma.refund.findUnique({ where: { id: refundId } })
  if (!refund)                       throw new Error('Refund not found')
  if (!refund.razorpayRefundId)      throw new Error('No Razorpay refund ID on record')
  if (refund.status === 'completed') return refund   // already done
  if (refund.status === 'failed')    return refund   // already terminal

  // ── Fetch current status from Razorpay ───────────────────────────────────
  const rzRefund = await razorpay.refunds.fetch(refund.razorpayRefundId)

  const rzStatus    = rzRefund.status
  const isCompleted = rzStatus === 'processed'
  const isFailed    = rzStatus === 'failed'

  if (!isCompleted && !isFailed) {
    // Still pending/processing — nothing to update yet
    console.log(`[Refund Sync] ${refund.refundNumber} still ${rzStatus}`)
    return await prisma.refund.update({
      where: { id: refundId },
      data:  { razorpayRefundStatus: rzStatus },
    })
  }

  // ── Terminal state reached — update DB ───────────────────────────────────
  const updated = await prisma.refund.update({
    where: { id: refundId },
    data: {
      status:               isCompleted ? 'completed' : 'failed',
      razorpayRefundStatus: rzStatus,
      processedAt:          isCompleted ? new Date() : null,
      failureReason:        isFailed ? (rzRefund.description || 'Failed at Razorpay') : null,
    },
  })

  // ── Update Booking ────────────────────────────────────────────────────────
  if (isCompleted) {
    await prisma.booking.update({
      where: { id: refund.bookingId },
      data:  { paymentStatus: 'refunded' },
    })
    console.log(`[Refund Sync] ✅ ${refund.refundNumber} completed`)
  }

  if (isFailed) {
    // Revert booking to 'paid' so admin can retry
    await prisma.booking.update({
      where: { id: refund.bookingId },
      data:  { paymentStatus: 'paid' },
    })
    console.log(`[Refund Sync] ❌ ${refund.refundNumber} failed`)
  }

  return updated
}

// ─────────────────────────────────────────────────────────────────────────────
// RETRY REFUND — UNCHANGED
// ─────────────────────────────────────────────────────────────────────────────
export async function retryRefund({ refundId, initiatedBy }) {
  const refund = await prisma.refund.findUnique({ where: { id: refundId } })
  if (!refund)                    throw new Error('Refund not found')
  if (refund.status !== 'failed') throw new Error('Only failed refunds can be retried')

  return await processRefund({
    bookingId:   refund.bookingId,
    initiatedBy: initiatedBy || refund.initiatedBy,
    reason:      refund.reason || 'Retry',
  })
}