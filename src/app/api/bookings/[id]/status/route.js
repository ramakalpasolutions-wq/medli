import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function PATCH(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params
    const body = await request.json()

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return errorResponse('Booking not found', 'NOT_FOUND', 404)

    const updateData = {}

    if (user.role === 'doctor') {
      // Doctor can only mark completed or no_show
      if (!['completed', 'no_show'].includes(body.status))
        return errorResponse('Doctors can only set completed or no_show', 'FORBIDDEN', 403)
      const doctor = await prisma.doctor.findFirst({ where: { userId: user.id } })
      if (!doctor || booking.doctorId !== doctor.id)
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      updateData.status = body.status

    } else if (user.role === 'lab_admin') {
      // Lab admin can only update labStatus
      if (!body.labStatus)
        return errorResponse('labStatus required', 'VALIDATION_ERROR', 400)
      const lab = await prisma.lab.findFirst({ where: { adminUserId: user.id } })
      if (!lab || booking.labId !== lab.id)
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      updateData.labStatus = body.labStatus
      if (body.labStatus === 'report_ready') updateData.status = 'completed'

    } else if (user.role === 'super_admin') {
      if (body.status) updateData.status = body.status
      if (body.labStatus) updateData.labStatus = body.labStatus
      if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus
    } else {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const updated = await prisma.booking.update({ where: { id }, data: updateData })
    return successResponse(updated, 'Booking status updated')
  } catch (err) {
    console.error('[Booking Status]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to update status', 'SERVER_ERROR', 500)
  }
}