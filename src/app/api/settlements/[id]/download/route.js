import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import {
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'
import { NextResponse } from 'next/server'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user,
        'super_admin', 'regional_manager',
        'hospital_admin', 'lab_admin',
      )

      const { id } = await params

      const settlement = await prisma.settlement.findUnique({
        where: { id },
      })

      if (!settlement) {
        return errorResponse('Settlement not found', 404)
      }

      // Build CSV
      const rows = [
        ['Field',              'Value'],
        ['Settlement Number',  settlement.settlementNumber                                          ],
        ['Entity Type',        settlement.entityType                                                ],
        ['Entity Name',        settlement.entityName          || ''                                 ],
        ['Status',             settlement.status                                                    ],
        ['Total Bookings',     String(settlement.totalBookings || 0)                               ],
        ['Gross Amount',       `Rs. ${(settlement.grossAmount         || 0).toLocaleString('en-IN')}`],
        ['Platform Fee',       `Rs. ${(settlement.platformFee         || 0).toLocaleString('en-IN')}`],
        ['GST',                `Rs. ${(settlement.gst                 || 0).toLocaleString('en-IN')}`],
        ['Coupon Absorbed',    `Rs. ${(settlement.couponAbsorbed      || 0).toLocaleString('en-IN')}`],
        ['Refunds Deducted',   `Rs. ${(settlement.refundsDeducted     || 0).toLocaleString('en-IN')}`],
        ['Net Payout',         `Rs. ${(settlement.netSettlementAmount || 0).toLocaleString('en-IN')}`],
        ['Beneficiary Name',   settlement.beneficiaryName     || ''                                 ],
        ['Beneficiary Account',settlement.beneficiaryAccount  || ''                                 ],
        ['Beneficiary IFSC',   settlement.beneficiaryIFSC     || ''                                 ],
        ['Bank Name',          settlement.bankName             || ''                                 ],
        ['Transfer Mode',      settlement.transferMode         || ''                                 ],
        ['UTR Number',         settlement.utrNumber            || ''                                 ],
        ['Transferred At',     settlement.transferredAt
          ? new Date(settlement.transferredAt).toLocaleDateString('en-IN', { dateStyle: 'long' })
          : ''
        ],
        ['Failure Reason',     settlement.failureReason        || ''                                 ],
        ['Notes',              settlement.notes                || ''                                 ],
        ['Created At',         new Date(settlement.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })],
      ]

      const csv = rows
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type':        'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="settlement-${settlement.settlementNumber}.csv"`,
          'Cache-Control':       'no-store',
        },
      })

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/settlements/[id]/download]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}