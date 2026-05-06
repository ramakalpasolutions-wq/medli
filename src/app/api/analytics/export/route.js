import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { getDateRange, formatCurrency } from '@/lib/utils/helpers'
import { errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'regional_manager')

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const preset = searchParams.get('preset') || 'last30'
    const { from, to } = getDateRange(preset, searchParams.get('dateFrom'), searchParams.get('dateTo'))

    const bookings = await prisma.booking.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    if (format === 'csv') {
      const headers = [
        'Booking ID', 'Type', 'Status', 'Payment Status',
        'Base Fee', 'Coupon Discount', 'Platform Fee', 'GST', 'Total Amount',
        'Created At',
      ]

      const rows = bookings.map((b) => [
        b.bookingId,
        b.type,
        b.status,
        b.paymentStatus,
        b.baseFee,
        b.couponDiscount,
        b.platformFee,
        b.gst,
        b.totalAmount,
        new Date(b.createdAt).toLocaleString('en-IN'),
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=medli-export-${Date.now()}.csv`,
          'Cache-Control': 'no-store',
        },
      })
    }

    return errorResponse('Unsupported format', 'VALIDATION_ERROR', 400)
  } catch (err) {
    console.error('[Analytics Export]', err.message)
    return errorResponse('Failed to export data', 'SERVER_ERROR', 500)
  }
}