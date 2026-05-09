import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import { getDateRange } from '@/lib/utils/helpers'
import { errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { NextResponse } from 'next/server'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'regional_manager')

      const { searchParams } = new URL(request.url)
      const preset   = searchParams.get('preset')  || 'last30'
      const dateFrom = searchParams.get('dateFrom') || ''
      const dateTo   = searchParams.get('dateTo')   || ''
      const format   = searchParams.get('format')   || 'csv'

      const { from, to } = getDateRange(preset, dateFrom, dateTo)

      const bookings = await prisma.booking.findMany({
        where:   { createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: 'desc' },
        select: {
          bookingId:   true,
          type:        true,
          status:      true,
          paymentStatus: true,
          baseFee:     true,
          platformFee: true,
          gst:         true,
          totalAmount: true,
          createdAt:   true,
        },
      })

      if (format === 'csv') {
        const headers = [
          'Booking ID', 'Type', 'Status', 'Payment Status',
          'Base Fee', 'Platform Fee', 'GST', 'Total Amount', 'Date',
        ]

        const rows = bookings.map((b) => [
          b.bookingId,
          b.type,
          b.status,
          b.paymentStatus,
          b.baseFee,
          b.platformFee,
          b.gst,
          b.totalAmount,
          new Date(b.createdAt).toLocaleDateString('en-IN'),
        ])

        const csv = [
          headers.join(','),
          ...rows.map((r) => r.map((v) => `"${v ?? ''}"`).join(',')),
        ].join('\n')

        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type':        'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="analytics-${preset}.csv"`,
          },
        })
      }

      return errorResponse('Unsupported format. Use ?format=csv', 400)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/analytics/export]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}