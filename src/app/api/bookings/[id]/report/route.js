import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getSignedDownloadUrl } from '@/lib/utils/cloudflare'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true, userId: true, labId: true, reportR2Key: true,
        labStatus: true, type: true,
      },
    })

    if (!booking) return errorResponse('Booking not found', 'NOT_FOUND', 404)
    if (booking.userId !== user.id && !['super_admin', 'lab_admin'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    if (booking.type !== 'lab')
      return errorResponse('Not a lab booking', 'INVALID_TYPE', 400)
    if (!booking.reportR2Key)
      return errorResponse('Report not yet uploaded', 'NOT_READY', 404)

    const signedUrl = await getSignedDownloadUrl(booking.reportR2Key, 3600)

    return successResponse({
      signedUrl,
      expiresIn: 3600,
      reportStatus: booking.labStatus,
    })
  } catch (err) {
    console.error('[Report]', err.message)
    return errorResponse('Failed to fetch report', 'SERVER_ERROR', 500)
  }
}