import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { cache } from '@/lib/cache'
import { cancelConsultationEvent } from '@/lib/services/meet.service'
import { calculateRefundAmount } from '@/lib/services/refund.service'
import { refundQueue, smsQueue, emailQueue } from '@/lib/queues/setup'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function POST(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params
    const body = await request.json()

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return errorResponse('Booking not found', 'NOT_FOUND', 404)

    if (booking.userId !== user.id && !['super_admin', 'hospital_admin', 'lab_admin'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    if (['cancelled', 'completed', 'refunded'].includes(booking.status))
      return errorResponse('Booking cannot be cancelled', 'INVALID_STATUS', 400)

    const { refundPercent, refundAmount } = calculateRefundAmount(booking)

    // Cancel calendar event
    if (booking.type === 'online' && booking.calendarEventId) {
      try {
        await cancelConsultationEvent({ calendarEventId: booking.calendarEventId })
      } catch (calErr) {
        console.error('[Cancel] Calendar cancellation failed:', calErr.message)
      }
    }

    // Invalidate slot cache
    if (booking.doctorId) {
      const date = new Date(booking.startTime).toISOString().split('T')[0]
      await cache.del(`slots:${booking.doctorId}:${date}`)
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancellationReason: body.reason || null,
        cancelledBy: user.id,
        refundAmount,
      },
    })

    // Queue refund if applicable
    if (refundAmount > 0 && booking.paymentStatus === 'paid') {
      await refundQueue.add('process_refund', {
        bookingId: id,
        userId: booking.userId,
        amount: refundAmount,
        reason: body.reason || 'Booking cancelled',
        initiatedBy: user.id,
      })
    }

    // Queue cancel notifications
    await smsQueue.add('booking_cancelled', {
      userId: booking.userId,
      bookingId: booking.bookingId,
      refundAmount,
    })
    await emailQueue.add('booking_cancelled', {
      userId: booking.userId,
      bookingId: booking.bookingId,
      refundAmount,
      refundPercent,
    })

    return successResponse({
      booking: updated,
      refundAmount,
      refundPercent,
    }, 'Booking cancelled')
  } catch (err) {
    console.error('[Cancel]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to cancel booking', 'SERVER_ERROR', 500)
  }
}