// C:\projects\medli2\src\app\api\bookings\[id]\cancel\route.js

import { prisma }                from '@/lib/prisma'
import { verifyAuth }            from '@/lib/middleware/auth.middleware'
import { cache }                 from '@/lib/cache'
import { cancelConsultationEvent } from '@/lib/services/meet.service'
import { calculateRefundAmount, processRefund } from '@/lib/services/refund.service'
import { smsQueue, emailQueue }  from '@/lib/queues/setup'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'
import { createCreditNote } from '@/lib/services/invoice.service'

export function OPTIONS() {
  return handleOptions()
}

export async function POST(request, { params }) {
  try {
    // 🔍 DEBUG — confirm server time
    console.log('═══════════════════════════════════════════════════════')
    console.log('[CANCEL] Request received at:', new Date().toISOString())
    console.log('[CANCEL] Server local time:', new Date().toLocaleString('en-IN'))
    console.log('═══════════════════════════════════════════════════════')

    const user = await verifyAuth(request)
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const authUserId = user.userId || user.id

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        bookingId: true,
        userId: true,
        doctorId: true,
        labId: true,
        hospitalId: true,
        type: true,
        status: true,
        startTime: true,
        paymentStatus: true,
        totalAmount: true,
        calendarEventId: true,
      },
    })

    if (!booking) {
      return errorResponse('Booking not found', 'NOT_FOUND', 404)
    }

    // 🔍 DEBUG — booking info
    console.log('[CANCEL] Booking found:', booking.bookingId)
    console.log('[CANCEL] Booking startTime:', booking.startTime)
    console.log('[CANCEL] Booking status:', booking.status)
    console.log('[CANCEL] Payment status:', booking.paymentStatus)

    const isOwner = booking.userId === authUserId
    const isAdmin = ['super_admin', 'hospital_admin', 'lab_admin'].includes(user.role)

    if (!isOwner && !isAdmin) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    if (['cancelled', 'completed', 'refunded'].includes(booking.status)) {
      return errorResponse(
        `Booking is already ${booking.status} and cannot be cancelled`,
        'INVALID_STATUS',
        400
      )
    }

    const { refundPercent, refundAmount } = calculateRefundAmount(booking)

    // 🔍 DEBUG — refund calc
    console.log('[CANCEL] Refund calc:', { refundPercent, refundAmount })

    if (booking.type === 'online' && booking.calendarEventId) {
      try {
        await cancelConsultationEvent({ calendarEventId: booking.calendarEventId })
      } catch (calErr) {
        console.error('[Cancel] Calendar cancellation failed:', calErr.message)
      }
    }

    if (booking.doctorId) {
      const date = new Date(booking.startTime).toISOString().split('T')[0]
      await cache.del(`slots:${booking.doctorId}:${date}`)
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status:             'cancelled',
        cancellationReason: body.reason || null,
        cancelledBy:        authUserId,
        refundAmount:       refundAmount || 0,
      },
    })

    const refundEligible =
      refundAmount > 0 &&
      (booking.paymentStatus === 'paid' || booking.paymentStatus === 'partial_refund')

    let refundResult = null

    if (refundEligible) {
      refundResult = await processRefund({
        bookingId:   booking.id,
        initiatedBy: authUserId,
        reason:      body.reason || 'Booking cancelled by user',
      })

      // 🔍 DEBUG — what refund came back
      console.log('═══════════════════════════════════════════════════════')
      console.log('[CANCEL] Refund result from processRefund():')
      console.log('  - refundNumber:    ', refundResult?.refundNumber)
      console.log('  - createdAt:       ', refundResult?.createdAt)
      console.log('  - processedAt:     ', refundResult?.processedAt)
      console.log('  - status:          ', refundResult?.status)
      console.log('  - razorpayRefundId:', refundResult?.razorpayRefundId)
      console.log('═══════════════════════════════════════════════════════')

      console.log(
        `[Cancel] Initiated refund ₹${refundAmount} (${refundPercent}%) for booking ${booking.bookingId}`
      )

      createCreditNote(booking, refundAmount, refundPercent).catch((err) =>
        console.error('[Cancel] Credit note creation failed silently:', err.message)
      )
    }

    await smsQueue.add('booking_cancelled', {
      userId:        booking.userId,
      bookingId:     booking.bookingId,
      refundAmount,
      refundPercent,
    })

    await emailQueue.add('booking_cancelled', {
      userId:        booking.userId,
      bookingId:     booking.bookingId,
      refundAmount,
      refundPercent,
    })

    return successResponse(
      {
        booking:         updated,
        refundAmount,
        refundPercent,
        refundInitiated: !!refundResult,
        refundStatus:    refundResult?.status || null,
        refundMessage:   refundResult
          ? `Refund of ₹${refundAmount} (${refundPercent}%) has been initiated successfully.`
          : refundAmount > 0
          ? `Eligible refund is ₹${refundAmount} (${refundPercent}%).`
          : 'No refund applicable as per cancellation policy.',
      },
      'Booking cancelled successfully'
    )
  } catch (err) {
    console.error('[Cancel Booking]', err.message)

    if (err.message.includes('token') || err.message.includes('auth')) {
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    }

    return errorResponse('Failed to cancel booking', 'SERVER_ERROR', 500)
  }
}