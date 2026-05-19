import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'

function esc(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)

    if (user.role !== 'super_admin' && user.role !== 'regional_manager') {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'completed'
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    const where = { status }

    if (from || to) {
      const createdAt = {}

      if (from) {
        const fromDate = new Date(`${from}T00:00:00.000Z`)
        if (Number.isNaN(fromDate.getTime())) {
          return Response.json({ success: false, error: 'Invalid from date' }, { status: 400 })
        }
        createdAt.gte = fromDate
      }

      if (to) {
        const toDate = new Date(`${to}T23:59:59.999Z`)
        if (Number.isNaN(toDate.getTime())) {
          return Response.json({ success: false, error: 'Invalid to date' }, { status: 400 })
        }
        createdAt.lte = toDate
      }

      where.createdAt = createdAt
    }

    const rows = await prisma.settlement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const header = [
      'Settlement Number',
      'Entity Name',
      'Entity Type',
      'Status',
      'Total Bookings',
      'Gross Amount',
      'Platform Fee',
      'GST',
      'Refunds Deducted',
      'Net Settlement Amount',
      'Transfer Mode',
      'UTR Number',
      'Created At',
      'Transferred At',
    ]

    const csv = [
      header.join(','),
      ...rows.map((r) =>
        [
          esc(r.settlementNumber),
          esc(r.entityName),
          esc(r.entityType),
          esc(r.status),
          esc(r.totalBookings),
          esc(r.grossAmount),
          esc(r.platformFee),
          esc(r.gst),
          esc(r.refundsDeducted),
          esc(r.netSettlementAmount),
          esc(r.transferMode),
          esc(r.utrNumber),
          esc(r.createdAt?.toISOString?.() || ''),
          esc(r.transferredAt?.toISOString?.() || ''),
        ].join(',')
      ),
    ].join('\n')

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="settlements-${status}-${from || 'all'}-to-${to || 'all'}.csv"`,
      },
    })
  } catch (err) {
    console.error('[Export Settlements CSV]', err)
    return Response.json(
      { success: false, error: 'Failed to export CSV' },
      { status: 500 }
    )
  }
}