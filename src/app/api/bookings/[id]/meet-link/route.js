import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, userId: true, doctorId: true, meetLink: true, type: true, status: true },
    })

    if (!booking) return errorResponse('Booking not found', 'NOT_FOUND', 404)
    if (booking.userId !== user.id && user.role !== 'super_admin' && user.role !== 'doctor')
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    if (booking.type !== 'online')
      return errorResponse('Not an online consultation', 'INVALID_TYPE', 400)
    if (!booking.meetLink)
      return errorResponse('Meet link not yet generated', 'NOT_READY', 404)

    return successResponse({ meetLink: booking.meetLink })
  } catch (err) {
    console.error('[Meet Link]', err.message)
    return errorResponse('Failed to fetch meet link', 'SERVER_ERROR', 500)
  }
}