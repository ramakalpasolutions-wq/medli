import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'

function escapeCsv(value) {
  if (value === null || value === undefined) return ''
  return `"${String(value).replace(/"/g, '""')}"`
}

export async function getSettlementCsv({ status, from, to }) {
  const fromDate = new Date(`${from}T00:00:00.000Z`)
  const toDate = new Date(`${to}T23:59:59.999Z`)

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error('Invalid date range')
  }

  if (fromDate > toDate) {
    throw new Error('From date cannot be greater than To date')
  }

  const settlements = await prisma.settlement.findMany({
    where: {
      status,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const header = [
    'Settlement Number',
    'Entity Type',
    'Entity Name',
    'Total Bookings',
    'Gross Amount',
    'Platform Fee',
    'GST',
    'Refunds Deducted',
    'Net Settlement Amount',
    'Beneficiary Name',
    'Beneficiary Account',
    'Beneficiary IFSC',
    'Bank Name',
    'Transfer Mode',
    'UTR Number',
    'Status',
    'Failure Reason',
    'Created At',
    'Transferred At',
  ]

  const rows = settlements.map((s) => [
    escapeCsv(s.settlementNumber),
    escapeCsv(s.entityType),
    escapeCsv(s.entityName),
    escapeCsv(s.totalBookings ?? 0),
    escapeCsv(s.grossAmount ?? 0),
    escapeCsv(s.platformFee ?? 0),
    escapeCsv(s.gst ?? 0),
    escapeCsv(s.refundsDeducted ?? 0),
    escapeCsv(s.netSettlementAmount ?? 0),
    escapeCsv(s.beneficiaryName),
    escapeCsv(s.beneficiaryAccount),
    escapeCsv(s.beneficiaryIFSC),
    escapeCsv(s.bankName),
    escapeCsv(s.transferMode),
    escapeCsv(s.utrNumber),
    escapeCsv(s.status),
    escapeCsv(s.failureReason),
    escapeCsv(s.createdAt ? new Date(s.createdAt).toISOString() : ''),
    escapeCsv(s.transferredAt ? new Date(s.transferredAt).toISOString() : ''),
  ])

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)

    if (user.role !== 'super_admin' && user.role !== 'regional_manager') {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'completed'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return Response.json(
        { success: false, error: 'From and To dates are required' },
        { status: 400 }
      )
    }

    const csv = await getSettlementCsv({ status, from, to })

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="settlements-${status}-${from}-to-${to}.csv"`,
      },
    })
  } catch (err) {
    console.error('[Export Settlements CSV]', err.message)
    return Response.json(
      { success: false, error: err.message || 'Failed to export settlements' },
      { status: 500 }
    )
  }
}