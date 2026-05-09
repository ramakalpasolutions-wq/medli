import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return errorResponse('Booking not found', 'NOT_FOUND', 404)

    // Access check
    if (user.role === 'user' && booking.userId !== user.id)
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    return successResponse(booking)
  } catch (err) {
    console.error('[Booking GET]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to fetch booking', 'SERVER_ERROR', 500)
  }
}