import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function DELETE(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      if (user.role === 'super_admin') {
        return errorResponse('This action is only available for user notifications', 403)
      }

      const userId = user.userId || user.id
      const { id } = await params
      if (!userId || !id) return errorResponse('Notification not found', 404)

      const booking = await prisma.booking.findFirst({
        where: { id, userId },
        select: { id: true },
      })
      if (!booking) return errorResponse('Notification not found', 404)

      const existing = await prisma.notificationDismissal.findFirst({
        where: { userId, bookingId: booking.id },
        select: { id: true },
      })
      if (!existing) {
        await prisma.notificationDismissal.create({
          data: { userId, bookingId: booking.id },
        })
      }

      return successResponse({ id }, 'Notification deleted')
    } catch (error) {
      console.error('[DELETE /api/notifications/:id]', error)
      return errorResponse('Could not delete notification', 500)
    }
  })
}
