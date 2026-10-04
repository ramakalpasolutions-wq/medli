// src/app/api/bookings/[id]/cancel/route.js

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { cache } from '@/lib/cache'
import { cancelConsultationEvent } from '@/lib/services/meet.service'
import {
  calculateRefundAmount,
  processRefund,
} from '@/lib/services/refund.service'
import {
  smsQueue,
  emailQueue,
} from '@/lib/queues/setup'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function POST(request, { params }) {
  try {
    // ==================================================
    // REQUEST / AUTH
    // ==================================================

    console.log(
      '═══════════════════════════════════════════════════════'
    )
    console.log(
      '[CANCEL] Request received:',
      new Date().toISOString()
    )
    console.log(
      '═══════════════════════════════════════════════════════'
    )

    const user = await verifyAuth(request)

    const { id } = await params

    if (!id) {
      return errorResponse(
        'Booking ID is required',
        'VALIDATION_ERROR',
        400
      )
    }

    const body = await request
      .json()
      .catch(() => ({}))

    const authUserId =
      user.userId || user.id

    if (!authUserId) {
      return errorResponse(
        'Unauthorized',
        'UNAUTHORIZED',
        401
      )
    }

    // ==================================================
    // FETCH BOOKING
    // ==================================================

    const booking =
      await prisma.booking.findUnique({
        where: {
          id,
        },

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
          endTime: true,

          paymentStatus: true,

          baseFee: true,
          couponDiscount: true,
          discountedFee: true,

          platformFeePercent: true,
          platformFee: true,

          gstPercent: true,
          gst: true,

          subtotal: true,
          adminCouponDiscount: true,

          totalAmount: true,

          calendarEventId: true,

          cancellationReason: true,
          cancelledBy: true,
          refundAmount: true,

          cashfreeOrderId: true,
          cashfreePaymentId: true,

          createdAt: true,
          updatedAt: true,
        },
      })

    if (!booking) {
      return errorResponse(
        'Booking not found',
        'NOT_FOUND',
        404
      )
    }

    console.log('[CANCEL] Booking:', {
      id: booking.id,
      bookingId: booking.bookingId,
      type: booking.type,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      startTime: booking.startTime,
      totalAmount: booking.totalAmount,
      cashfreeOrderId:
        booking.cashfreeOrderId || null,
      cashfreePaymentId:
        booking.cashfreePaymentId || null,
    })

    // ==================================================
    // PERMISSION CHECK
    // ==================================================

    const isOwner =
      booking.userId === authUserId

    const isAdmin = [
      'super_admin',
      'hospital_admin',
      'lab_admin',
    ].includes(user.role)

    if (!isOwner && !isAdmin) {
      return errorResponse(
        'Access denied',
        'FORBIDDEN',
        403
      )
    }

    // ==================================================
    // STATUS CHECK
    // ==================================================

    if (
      [
        'cancelled',
        'completed',
        'refunded',
        'no_show',
      ].includes(booking.status)
    ) {
      return errorResponse(
        `Booking is already ${booking.status} and cannot be cancelled`,
        'INVALID_STATUS',
        400
      )
    }

    // ==================================================
    // CANCELLATION REASON
    // ==================================================

    const cancellationReason =
      typeof body.reason === 'string' &&
      body.reason.trim()
        ? body.reason.trim()
        : isOwner
          ? 'Booking cancelled by user'
          : 'Booking cancelled by admin'

    // ==================================================
    // REFUND CALCULATION
    // ==================================================

    let refundPercent = 0
    let refundAmount = 0

    const isPaidBooking =
      booking.paymentStatus === 'paid' ||
      booking.paymentStatus ===
        'partial_refund'

    /*
     * Only calculate a monetary refund when the
     * booking actually has a successful payment.
     *
     * Unpaid bookings can still be cancelled,
     * but no Cashfree refund is created.
     */
    if (isPaidBooking) {
      const refundCalculation =
        calculateRefundAmount(booking)

      refundPercent =
        Number(
          refundCalculation?.refundPercent ||
            0
        )

      refundAmount =
        Number(
          refundCalculation?.refundAmount ||
            0
        )

      refundAmount =
        Math.round(
          (refundAmount +
            Number.EPSILON) *
            100
        ) / 100
    }

    console.log(
      '[CANCEL] Refund calculation:',
      {
        paid: isPaidBooking,
        refundPercent,
        refundAmount,
        totalAmount:
          booking.totalAmount,
      }
    )

    // ==================================================
    // CANCEL GOOGLE MEET / CALENDAR EVENT
    // ==================================================

    if (
      booking.type === 'online' &&
      booking.calendarEventId
    ) {
      try {
        await cancelConsultationEvent({
          calendarEventId:
            booking.calendarEventId,
        })

        console.log(
          '[CANCEL] Calendar event cancelled:',
          booking.calendarEventId
        )
      } catch (calendarError) {
        /*
         * Calendar failure must NOT prevent the
         * MEDLI booking from being cancelled.
         */
        console.error(
          '[CANCEL] Calendar cancellation failed:',
          calendarError.message
        )
      }
    }

    // ==================================================
    // INVALIDATE DOCTOR SLOT CACHE
    // ==================================================

    if (
      booking.doctorId &&
      booking.startTime
    ) {
      try {
        const date =
          new Date(
            booking.startTime
          )
            .toISOString()
            .split('T')[0]

        await cache.del(
          `slots:${booking.doctorId}:${date}`
        )
      } catch (cacheError) {
        console.warn(
          '[CANCEL] Slot cache invalidation failed:',
          cacheError.message
        )
      }
    }

    // ==================================================
    // MARK BOOKING CANCELLED
    // ==================================================

    const updated =
      await prisma.booking.update({
        where: {
          id: booking.id,
        },

        data: {
          status: 'cancelled',

          cancellationReason,

          cancelledBy:
            authUserId,

          refundAmount:
            refundAmount || 0,
        },
      })

    console.log(
      `[CANCEL] Booking ${booking.bookingId} marked cancelled`
    )

    // ==================================================
    // CASHFREE REFUND
    // ==================================================

    const refundEligible =
      isPaidBooking &&
      refundAmount > 0

    let refundResult = null
    let refundError = null

    if (refundEligible) {
      try {
        refundResult =
          await processRefund({
            bookingId:
              booking.id,

            initiatedBy:
              authUserId,

            reason:
              cancellationReason,
          })

        console.log(
          '═══════════════════════════════════════════════════════'
        )

        console.log(
          '[CANCEL] Cashfree refund result:'
        )

        console.log(
          '  - refundNumber:',
          refundResult?.refundNumber ||
            null
        )

        console.log(
          '  - cashfreeRefundId:',
          refundResult?.cashfreeRefundId ||
            null
        )

        console.log(
          '  - cashfreeRefundStatus:',
          refundResult?.cashfreeRefundStatus ||
            null
        )

        console.log(
          '  - refundAmount:',
          refundResult?.refundAmount ||
            refundAmount
        )

        console.log(
          '  - refundPercent:',
          refundResult?.refundPercent ||
            refundPercent
        )

        console.log(
          '  - status:',
          refundResult?.status ||
            null
        )

        console.log(
          '  - createdAt:',
          refundResult?.createdAt ||
            null
        )

        console.log(
          '  - processedAt:',
          refundResult?.processedAt ||
            null
        )

        console.log(
          '═══════════════════════════════════════════════════════'
        )

        console.log(
          `[CANCEL] Cashfree refund ₹${refundAmount} (${refundPercent}%) initiated for ${booking.bookingId}`
        )
      } catch (error) {
        refundError = error

        /*
         * IMPORTANT:
         *
         * Booking cancellation has already succeeded.
         * A temporary Cashfree refund failure should
         * not restore the booking automatically.
         *
         * Admin can retry/verify the refund.
         */

        console.error(
          '[CANCEL] Cashfree refund initiation failed:',
          error.message
        )
      }
    }

    // ==================================================
    // IMPORTANT:
    // DO NOT CREATE CREDIT NOTE HERE
    // ==================================================

    /*
     * Cashfree may return a refund as:
     *
     * PENDING / PROCESSING
     *
     * Therefore we should NOT create the credit note
     * immediately after processRefund().
     *
     * Credit note creation should happen only when
     * refund.service.js confirms the refund as
     * successfully completed.
     */

    // ==================================================
    // SMS NOTIFICATION
    // ==================================================

    try {
      await smsQueue.add(
        'booking_cancelled',
        {
          userId:
            booking.userId,

          bookingId:
            booking.bookingId,

          refundAmount,

          refundPercent,

          refundEligible,

          refundStatus:
            refundResult?.status ||
            null,
        }
      )
    } catch (smsError) {
      console.error(
        '[CANCEL] SMS queue failed:',
        smsError.message
      )
    }

    // ==================================================
    // EMAIL NOTIFICATION
    // ==================================================

    try {
      await emailQueue.add(
        'booking_cancelled',
        {
          userId:
            booking.userId,

          bookingId:
            booking.bookingId,

          refundAmount,

          refundPercent,

          refundEligible,

          refundStatus:
            refundResult?.status ||
            null,
        }
      )
    } catch (emailError) {
      console.error(
        '[CANCEL] Email queue failed:',
        emailError.message
      )
    }

    // ==================================================
    // RESPONSE MESSAGE
    // ==================================================

    let refundMessage =
      'Booking cancelled successfully. No refund is applicable as per the cancellation policy.'

    if (!isPaidBooking) {
      refundMessage =
        'Booking cancelled successfully. No payment was captured, so no refund is required.'
    } else if (
      refundAmount <= 0
    ) {
      refundMessage =
        'Booking cancelled successfully. No refund is applicable as per the cancellation policy.'
    } else if (refundError) {
      refundMessage =
        `Booking cancelled successfully. Refund of ₹${refundAmount} could not be initiated automatically and requires verification.`
    } else if (refundResult) {
      if (
        refundResult.status ===
        'completed'
      ) {
        refundMessage =
          `Refund of ₹${refundAmount} (${refundPercent}%) has been completed successfully.`
      } else if (
        refundResult.status ===
        'failed'
      ) {
        refundMessage =
          `Booking cancelled successfully. Refund of ₹${refundAmount} failed and requires retry.`
      } else {
        refundMessage =
          `Refund of ₹${refundAmount} (${refundPercent}%) has been initiated successfully and is being processed.`
      }
    }

    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return successResponse(
      {
        booking:
          updated,

        refundEligible,

        refundAmount,

        refundPercent,

        refundInitiated:
          !!refundResult,

        refundStatus:
          refundResult?.status ||
          null,

        cashfreeRefundId:
          refundResult?.cashfreeRefundId ||
          null,

        cashfreeRefundStatus:
          refundResult?.cashfreeRefundStatus ||
          null,

        refundNumber:
          refundResult?.refundNumber ||
          null,

        refundRequiresAttention:
          !!refundError ||
          refundResult?.status ===
            'failed',

        refundMessage,
      },

      'Booking cancelled successfully'
    )
  } catch (error) {
    console.error(
      '[CANCEL BOOKING]',
      error
    )

    const message =
      error?.message ||
      'Failed to cancel booking'

    // ==================================================
    // AUTH ERRORS
    // ==================================================

    if (
      message
        .toLowerCase()
        .includes('token') ||
      message
        .toLowerCase()
        .includes('auth') ||
      message
        .toLowerCase()
        .includes('unauthorized')
    ) {
      return errorResponse(
        message,
        'AUTH_ERROR',
        401
      )
    }

    // ==================================================
    // NOT FOUND
    // ==================================================

    if (
      message
        .toLowerCase()
        .includes('not found')
    ) {
      return errorResponse(
        message,
        'NOT_FOUND',
        404
      )
    }

    // ==================================================
    // SERVER ERROR
    // ==================================================

    return errorResponse(
      message,
      'SERVER_ERROR',
      500
    )
  }
}