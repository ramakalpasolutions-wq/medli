import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

function isValidObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value)
}

export async function GET(request, context) {
  try {
    const user = await verifyAuth(request)

    if (!user) {
      return errorResponse('Authentication required', 'AUTH_ERROR', 401)
    }

    const { id } = await context.params

    console.log('[Booking GET] param id =', id)
    console.log('[Booking GET] user =', user)

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid booking id', 'VALIDATION_ERROR', 400)
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return errorResponse('Booking not found', 'NOT_FOUND', 404)
    }

    if (user.role === 'user' && booking.userId !== user.userId) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    if (user.role === 'doctor') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: user.userId },
        select: { id: true },
      })

      if (!doctor || booking.doctorId !== doctor.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findFirst({
        where: { adminUserId: user.userId },
        select: { id: true },
      })

      console.log('[Booking GET] hospital =', hospital)
      console.log('[Booking GET] booking.hospitalId =', booking.hospitalId)

      if (!hospital || booking.hospitalId !== hospital.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findFirst({
        where: { adminUserId: user.userId },
        select: { id: true },
      })

      if (!lab || booking.labId !== lab.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    return successResponse(booking, 'Booking fetched')
  } catch (err) {
    console.error('[Booking GET full error]', err)
    return errorResponse(err.message || 'Failed to fetch booking', 'SERVER_ERROR', 500)
  }
}