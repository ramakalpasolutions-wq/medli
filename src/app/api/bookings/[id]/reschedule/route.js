import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { cache } from '@/lib/cache'
import { updateConsultationEvent } from '@/lib/services/meet.service'
import { smsQueue, emailQueue } from '@/lib/queues/setup'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

const MAX_RESCHEDULES = 2

export function OPTIONS() { return handleOptions() }

export async function POST(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params
    const body = await request.json()

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return errorResponse('Booking not found', 'NOT_FOUND', 404)

    if (booking.userId !== user.id && !['super_admin'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    if (booking.status !== 'confirmed')
      return errorResponse('Only confirmed bookings can be rescheduled', 'INVALID_STATUS', 400)

    if (new Date(booking.startTime) <= new Date())
      return errorResponse('Cannot reschedule past bookings', 'INVALID_TIME', 400)

    if (booking.rescheduleCount >= MAX_RESCHEDULES)
      return errorResponse(`Maximum ${MAX_RESCHEDULES} reschedules allowed`, 'RESCHEDULE_LIMIT', 400)

    const newStart = new Date(body.startTime)
    const newEnd = new Date(body.endTime)

    if (newStart <= new Date()) return errorResponse('New time must be in future', 'INVALID_TIME', 400)

    // Atomic slot check
    if (booking.doctorId) {
      const conflict = await prisma.booking.findFirst({
        where: {
          doctorId: booking.doctorId,
          startTime: newStart,
          status: { in: ['confirmed', 'pending_payment'] },
          NOT: { id },
        },
      })
      if (conflict) return errorResponse('New slot is already taken', 'SLOT_CONFLICT', 409)
    }

    const updateData = {
      startTime: newStart,
      endTime: newEnd,
      rescheduleCount: { increment: 1 },
    }

    // Update Google Calendar if online
    if (booking.type === 'online' && booking.calendarEventId) {
      try {
        await updateConsultationEvent({
          calendarEventId: booking.calendarEventId,
          newStartTime: newStart,
          newEndTime: newEnd,
          timezone: booking.timezone,
        })
      } catch (calErr) {
        console.error('[Reschedule] Calendar update failed:', calErr.message)
      }
    }

    // Invalidate slot cache
    if (booking.doctorId) {
      const oldDate = new Date(booking.startTime).toISOString().split('T')[0]
      const newDate = newStart.toISOString().split('T')[0]
      await cache.del(`slots:${booking.doctorId}:${oldDate}`)
      await cache.del(`slots:${booking.doctorId}:${newDate}`)
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
    })

    // Queue notifications
    await smsQueue.add('booking_rescheduled', {
      userId: booking.userId,
      bookingId: booking.bookingId,
      newStartTime: newStart,
    })

    return successResponse(updated, 'Booking rescheduled')
  } catch (err) {
    console.error('[Reschedule]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse(err.message, 'RESCHEDULE_ERROR', 400)
  }
}