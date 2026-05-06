import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)

    const hospital = await prisma.hospital.findUnique({ where: { id } })
    if (!hospital) {
      return errorResponse('Hospital not found', 'NOT_FOUND', 404)
    }

    if (user.role === 'hospital_admin' && hospital.adminUserId !== user.id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }
    if (!['hospital_admin', 'super_admin', 'regional_manager'].includes(user.role)) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const unsettledBookings = await prisma.booking.findMany({
      where: {
        hospitalId: id,
        paymentStatus: 'paid',
        isSettled: false,
        status: { in: ['confirmed', 'completed'] },
      },
      select: {
        id: true,
        bookingId: true,
        baseFee: true,
        platformFee: true,
        gst: true,
        totalAmount: true,
        couponDiscount: true,
        adminCouponDiscount: true,
        createdAt: true,
      },
    })

    const summary = {
      totalBookings: unsettledBookings.length,
      grossAmount: 0,
      totalPlatformFee: 0,
      totalGst: 0,
      totalCouponAbsorbed: 0,
      netSettlementAmount: 0,
    }

    unsettledBookings.forEach((b) => {
      summary.grossAmount += b.baseFee || 0
      summary.totalPlatformFee += b.platformFee || 0
      summary.totalGst += b.gst || 0
      summary.totalCouponAbsorbed += b.adminCouponDiscount || 0
    })

    summary.netSettlementAmount =
      summary.grossAmount - summary.totalPlatformFee - summary.totalGst - summary.totalCouponAbsorbed

    return successResponse({
      ...summary,
      bookings: unsettledBookings,
    })
  } catch (err) {
    console.error('[Hospital Settlement Summary]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to fetch settlement summary', 'SERVER_ERROR', 500)
  }
}