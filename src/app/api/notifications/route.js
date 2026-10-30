import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import {
  getPaginationParams,
  buildPaginationMeta,
} from '@/lib/utils/helpers'
import {
  successResponse,
  errorResponse,
  handleOptions,
  paginatedResponse,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url)

      if (user.role !== 'super_admin') {
        const userId = user.userId || user.id
        if (!userId) return errorResponse('Unauthorized', 401)
        const bookings = await prisma.booking.findMany({
          where: { userId },
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            status: true,
            paymentStatus: true,
            startTime: true,
            createdAt: true,
            totalAmount: true,
            collectionType: true,
            meetLink: true,
          },
        })

        const dismissed = await prisma.notificationDismissal.findMany({
          where: {
            userId,
            bookingId: { in: bookings.map((booking) => booking.id) },
          },
          select: { bookingId: true },
        })
        const dismissedBookingIds = new Set(
          dismissed.map((item) => item.bookingId)
        )

        const now = new Date()
        const notifications = bookings.filter(
          (booking) => !dismissedBookingIds.has(booking.id)
        ).map((booking) => {
          const isLab = booking.type === 'lab'
          const isCancelled = booking.status === 'cancelled'
          const isPending =
            ['created', 'pending_payment'].includes(booking.status) ||
            booking.paymentStatus === 'pending'
          const isUpcoming =
            booking.status === 'confirmed' && booking.startTime > now
          const status = isCancelled
            ? 'cancelled'
            : isPending
              ? 'pending'
              : isUpcoming
                ? 'upcoming'
                : 'confirmed'
          const dateLabel = booking.startTime.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
          })

          return {
            id: booking.id,
            refId: booking.id,
            type: isLab ? 'lab_order' : 'appointment',
            title: isCancelled
              ? 'Booking cancelled'
              : isPending
                ? 'Payment pending'
                : isLab
                  ? 'Lab booking confirmed'
                  : 'Consultation confirmed',
            body: `${isLab ? 'Lab test' : 'Consultation'} scheduled for ${dateLabel}.`,
            status,
            paymentStatus: booking.paymentStatus,
            date: booking.startTime.toISOString(),
            createdAt: booking.createdAt.toISOString(),
            amount: booking.totalAmount,
            meta: {
              consultationType: booking.type,
              visitType: booking.collectionType,
              meetLink: booking.meetLink,
            },
          }
        })

        return successResponse({ notifications }, 'Notifications retrieved')
      }

      checkRole(user, 'super_admin')
      const status  = searchParams.get('status')  || ''
      const channel = searchParams.get('channel') || ''

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}
      if (status)  where.status  = status
      if (channel) where.channel = channel

      const [notifications, total] = await Promise.all([
        prisma.notificationLog.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notificationLog.count({ where }),
      ])

      return paginatedResponse(
        notifications,
        buildPaginationMeta(total, page, limit),
        'notifications',
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/notifications]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function DELETE(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      if (user.role === 'super_admin') {
        return errorResponse('This action is only available for user notifications', 403)
      }

      const userId = user.userId || user.id
      if (!userId) return errorResponse('Unauthorized', 401)

      const bookings = await prisma.booking.findMany({
        where: { userId },
        select: { id: true },
      })

      await Promise.all(
        bookings.map(async (booking) => {
          const existing = await prisma.notificationDismissal.findFirst({
            where: { userId, bookingId: booking.id },
            select: { id: true },
          })
          if (!existing) {
            await prisma.notificationDismissal.create({
              data: { userId, bookingId: booking.id },
            })
          }
        })
      )

      return successResponse({ deletedCount: bookings.length }, 'Notifications cleared')
    } catch (error) {
      console.error('[DELETE /api/notifications]', error)
      return errorResponse('Could not clear notifications', 500)
    }
  })
}
