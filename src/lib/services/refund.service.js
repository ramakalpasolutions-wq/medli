// C:\projects\medli2\src\lib\services\refund.service.js

import Razorpay from 'razorpay'
import { prisma } from '../prisma.js'
import { generateRefundNumber } from '../utils/helpers.js'
import { emailQueue, smsQueue } from '../queues/setup.js'

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

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

export async function processRefund({ bookingId, initiatedBy, reason }) {
  // 🔍 DEBUG
  console.log('[REFUND] processRefund called at:', new Date().toISOString())
  console.log('[REFUND] bookingId:', bookingId)

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!booking) throw new Error('Booking not found')

  if (!['paid', 'partial_refund'].includes(booking.paymentStatus)) {
    throw new Error('Booking is not eligible for refund')
  }

  const { refundPercent, refundAmount } = calculateRefundAmount(booking)

  if (refundAmount <= 0) {
    throw new Error('No refund applicable based on cancellation policy')
  }

  // ── Idempotency check ──
  const existingRefund = await prisma.refund.findFirst({
    where: {
      bookingId,
      status: { in: ['pending', 'processing', 'completed'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  // 🔍 DEBUG
  if (existingRefund) {
    console.log('═══════════════════════════════════════════════════════')
    console.log('[REFUND] ⚠️  EXISTING REFUND FOUND — returning old one!')
    console.log('  - refundNumber:', existingRefund.refundNumber)
    console.log('  - createdAt:   ', existingRefund.createdAt)
    console.log('  - status:      ', existingRefund.status)
    console.log('  - NO new refund created. This is the BUG source!')
    console.log('═══════════════════════════════════════════════════════')
    return existingRefund
  }

  console.log('[REFUND] No existing refund — creating new one now...')

  const payment = await prisma.payment.findFirst({
    where:   { bookingId },
    orderBy: { createdAt: 'desc' },
  })

  if (!payment?.razorpayPaymentId) {
    throw new Error(
      'Razorpay payment ID not found for this booking. Cannot initiate refund.'
    )
  }

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

  // 🔍 DEBUG — what timestamp did Prisma give the new refund
  console.log('[REFUND] ✅ New refund created in DB:')
  console.log('  - refundNumber:', refund.refundNumber)
  console.log('  - createdAt:   ', refund.createdAt)
  console.log('  - id:          ', refund.id)

  try {
    const razorpayRefund = await razorpay.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: Math.round(refundAmount * 100),
        notes: {
          booking_id:    bookingId,
          refund_number: refundNumber,
          reason:        reason || 'Booking cancelled',
        },
        speed: 'normal',
      }
    )

    const rzStatus    = razorpayRefund.status
    const isCompleted = rzStatus === 'processed'
    const isFailed    = rzStatus === 'failed'

    const nextStatus = isCompleted ? 'completed' : isFailed ? 'failed' : 'processing'

    const updatedRefund = await prisma.refund.update({
      where: { id: refund.id },
      data: {
        status:               nextStatus,
        razorpayRefundId:     razorpayRefund.id,
        razorpayRefundStatus: rzStatus,
        processedAt:          isCompleted ? new Date() : null,
        failureReason:        isFailed ? (razorpayRefund.description || 'Razorpay refund failed') : null,
      },
    })

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: isCompleted ? 'refunded' : booking.paymentStatus,
        refundAmount,
      },
    })

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

export async function syncRefundStatus(refundId) {
  const refund = await prisma.refund.findUnique({ where: { id: refundId } })
  if (!refund)                       throw new Error('Refund not found')
  if (!refund.razorpayRefundId)      throw new Error('No Razorpay refund ID on record')
  if (refund.status === 'completed') return refund
  if (refund.status === 'failed')    return refund

  const rzRefund = await razorpay.refunds.fetch(refund.razorpayRefundId)

  const rzStatus    = rzRefund.status
  const isCompleted = rzStatus === 'processed'
  const isFailed    = rzStatus === 'failed'

  if (!isCompleted && !isFailed) {
    console.log(`[Refund Sync] ${refund.refundNumber} still ${rzStatus}`)
    return await prisma.refund.update({
      where: { id: refundId },
      data:  { razorpayRefundStatus: rzStatus },
    })
  }

  const updated = await prisma.refund.update({
    where: { id: refundId },
    data: {
      status:               isCompleted ? 'completed' : 'failed',
      razorpayRefundStatus: rzStatus,
      processedAt:          isCompleted ? new Date() : null,
      failureReason:        isFailed ? (rzRefund.description || 'Failed at Razorpay') : null,
    },
  })

  if (isCompleted) {
    await prisma.booking.update({
      where: { id: refund.bookingId },
      data:  { paymentStatus: 'refunded' },
    })
    console.log(`[Refund Sync] ✅ ${refund.refundNumber} completed`)
  }

  if (isFailed) {
    await prisma.booking.update({
      where: { id: refund.bookingId },
      data:  { paymentStatus: 'paid' },
    })
    console.log(`[Refund Sync] ❌ ${refund.refundNumber} failed`)
  }

  return updated
}

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