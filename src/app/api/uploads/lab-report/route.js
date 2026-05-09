import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { uploadToR2, R2Keys } from '@/lib/utils/cloudflare'
import { notifyLabReportReady } from '@/lib/services/notification.service'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'lab_admin', 'super_admin')

    const formData = await request.formData()
    const file = formData.get('file')
    const bookingId = formData.get('bookingId')

    if (!file || !bookingId) {
      return errorResponse('file and bookingId required', 'VALIDATION_ERROR', 400)
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return errorResponse('Booking not found', 'NOT_FOUND', 404)
    if (booking.type !== 'lab') return errorResponse('Not a lab booking', 'INVALID_TYPE', 400)

    // Verify lab admin owns this booking's lab
    if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findFirst({ where: { adminUserId: user.id } })
      if (!lab || booking.labId !== lab.id)
        return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = R2Keys.labReport(bookingId, `report-${Date.now()}.pdf`)

    await uploadToR2({ key, buffer, contentType: 'application/pdf' })

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        reportR2Key: key,
        labStatus: 'report_ready',
        status: 'completed',
      },
    })

    // Get user info for notification
    const bookingUser = await prisma.user.findUnique({
      where: { id: booking.userId },
      select: { name: true },
    })
    const lab = await prisma.lab.findUnique({
      where: { id: booking.labId },
      select: { name: true },
    })

    await notifyLabReportReady({
      userId: booking.userId,
      bookingId: booking.bookingId,
      labName: lab?.name || 'Lab',
    })

    return successResponse(updated, 'Report uploaded')
  } catch (err) {
    console.error('[Lab Report Upload]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to upload report', 'SERVER_ERROR', 500)
  }
}