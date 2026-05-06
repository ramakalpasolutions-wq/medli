// src/app/api/labs/[id]/settlement-summary/route.js
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const user   = await verifyAuth(request)

    const lab = await prisma.lab.findUnique({ where: { id } })
    if (!lab) return errorResponse('Lab not found', 'NOT_FOUND', 404)

    if (user.role === 'lab_admin' && lab.adminUserId !== user.id)
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    if (!['lab_admin', 'super_admin', 'regional_manager'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const unsettledBookings = await prisma.booking.findMany({
      where: {
        labId:         id,
        paymentStatus: 'paid',
        isSettled:     false,
        status:        { in: ['confirmed', 'completed'] },
      },
      select: {
        id:           true,
        bookingId:    true,
        baseFee:      true,   // ✅ lab earns this
        refundAmount: true,   // ✅ only deduction
        totalAmount:  true,
        createdAt:    true,
      },
    })

    const round = (n) => Math.round(n * 100) / 100

    // ✅ Lab gets baseFee — no platform fee/gst deducted
    const grossAmount     = unsettledBookings.reduce((s, b) => s + (b.baseFee      || 0), 0)
    const refundsDeducted = unsettledBookings.reduce((s, b) => s + (b.refundAmount || 0), 0)
    const netAmount       = Math.max(0, grossAmount - refundsDeducted)

    const summary = {
      totalBookings:       unsettledBookings.length,
      grossAmount:         round(grossAmount),
      refundsDeducted:     round(refundsDeducted),
      netSettlementAmount: round(netAmount),
    }

    return successResponse({ ...summary, bookings: unsettledBookings })
  } catch (err) {
    console.error('[Lab Settlement Summary]', err.message)
    if (err.message?.includes('Access denied') || err.message?.includes('token'))
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    return errorResponse('Failed to fetch settlement summary', 'SERVER_ERROR', 500)
  }
}