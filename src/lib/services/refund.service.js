// src/lib/services/refund.service.js

import prisma from '../prisma.js'
import { process1PayRefund } from './payment.service.js'
import { generateRefundNumber } from '../utils/helpers.js'
import { emailQueue, smsQueue } from '../queues/setup.js'

/**
 * Calculate refund amount based on cancellation policy
 * >24h = 100% | 12-24h = 50% | 4-12h = 25% | <4h = 0%
 */
export function calculateRefundAmount(booking) {
  const hoursUntilStart =
    (new Date(booking.startTime) - new Date()) / (1000 * 60 * 60)

  let refundPercent = 0

  if (hoursUntilStart > 24) {
    refundPercent = 100
  } else if (hoursUntilStart >= 12) {
    refundPercent = 50
  } else if (hoursUntilStart >= 4) {
    refundPercent = 25
  } else {
    refundPercent = 0
  }

  const refundAmount =
    Math.round(booking.totalAmount * (refundPercent / 100) * 100) / 100

  return { refundPercent, refundAmount }
}

/**
 * Process refund via 1Pay API
 */
export async function processRefund({ bookingId, initiatedBy, reason }) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  })

  if (!booking) throw new Error('Booking not found')

  const { refundPercent, refundAmount } = calculateRefundAmount(booking)

  if (refundAmount <= 0) {
    throw new Error('No refund applicable based on cancellation policy')
  }

  const refundNumber = generateRefundNumber()

  // Create refund record in pending state
  const refund = await prisma.refund.create({
    data: {
      refundNumber,
      bookingId,
      userId:       booking.userId,
      bookingAmount:booking.totalAmount,
      refundPercent,
      refundAmount,
      reason,
      cancelledBy:  initiatedBy,
      refundMethod: 'original_source',
      status:       'pending',
      initiatedBy
    }
  })

  try {
    // Call 1Pay Refund API
    const refundResult = await process1PayRefund({ bookingId, refundAmount })

    if (refundResult.success) {
      // RF000 - Refund accepted
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status:               'completed',
          onePayRefundRequestId:refundResult.refundRequestId,
          onePayRefundStatus:   refundResult.onePayRefundStatus,
          processedAt:          new Date()
        }
      })

      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'refunded', refundAmount }
      })
    } else {
      // Refund failed or deferred
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status:               'failed',
          failureReason:        refundResult.message,
          onePayRefundRequestId:refundResult.refundRequestId,
          onePayRefundStatus:   refundResult.onePayRefundStatus
        }
      })
    }

    // Queue notifications regardless of outcome
    const notifData = {
      userId:       booking.userId,
      bookingId,
      refundAmount,
      refundNumber,
      status:       refundResult.success ? 'completed' : 'failed',
      message:      refundResult.message
    }

    await smsQueue.add('refund_processed', notifData)
    await emailQueue.add('refund_processed', notifData)

    return await prisma.refund.findUnique({ where: { id: refund.id } })
  } catch (err) {
    // Unexpected error
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: 'failed', failureReason: err.message }
    })
    throw err
  }
}

/**
 * Retry a failed refund
 */
export async function retryRefund({ refundId, initiatedBy }) {
  const refund = await prisma.refund.findUnique({ where: { id: refundId } })

  if (!refund) throw new Error('Refund not found')
  if (refund.status !== 'failed') throw new Error('Only failed refunds can be retried')

  return await processRefund({
    bookingId:   refund.bookingId,
    initiatedBy: initiatedBy || refund.initiatedBy,
    reason:      refund.reason || 'Retry'
  })
}