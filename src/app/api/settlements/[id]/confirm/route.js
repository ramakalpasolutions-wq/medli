// C:\Users\ASUS\medli2\src\app\api\settlements\[id]\confirm\route.js

import { prisma }         from '@/lib/prisma'
import { verifyAuth }     from '@/lib/middleware/auth.middleware'
import { checkRole }      from '@/lib/middleware/rbac.middleware'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

const VALID_TRANSFER_MODES = ['NEFT', 'IMPS', 'RTGS', 'UPI']

export async function POST(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin')

      const { id }    = await params
      const body      = await request.json().catch(() => ({}))

      const utrNumber    = body?.utrNumber?.toString().trim().toUpperCase() || null
      const transferMode = body?.transferMode?.toString().toUpperCase() || 'NEFT'

      console.log('[confirm-settlement] Request:', {
        settlementId: id,
        utrNumber,
        transferMode,
        by:           user.userId,
      })

      /* ── Validate ── */
      if (!utrNumber || utrNumber.length < 6) {
        return errorResponse('Valid UTR number is required (min 6 chars)', 400)
      }
      if (!/^[A-Z0-9]+$/.test(utrNumber)) {
        return errorResponse('UTR can only contain letters and numbers', 400)
      }
      if (!VALID_TRANSFER_MODES.includes(transferMode)) {
        return errorResponse(
          `Invalid transfer mode. Must be one of: ${VALID_TRANSFER_MODES.join(', ')}`,
          400
        )
      }

      const settlement = await prisma.settlement.findUnique({
        where: { id },
      })

      if (!settlement) {
        return errorResponse('Settlement not found', 404)
      }

      /* ── Status checks ── */
      if (settlement.status === 'completed') {
        return errorResponse('Settlement is already completed', 400)
      }
      if (settlement.status === 'failed') {
        return errorResponse('Cannot confirm a failed settlement', 400)
      }

      /* ── Update settlement WITH transferMode ── */
      const updated = await prisma.settlement.update({
        where: { id },
        data: {
          status:        'completed',
          utrNumber,                              // ✅ saved
          transferMode,                           // ✅ NOW saved (was missing!)
          transferredAt: new Date(),
          confirmedBy:   user.userId,
        },
      })

      console.log('[confirm-settlement] ✅ Saved:', {
        id:           updated.id,
        utr:          updated.utrNumber,
        mode:         updated.transferMode,
        transferred:  updated.transferredAt,
      })

      /* ── Mark associated bookings as settled ── */
      if (settlement.bookingIds && settlement.bookingIds.length > 0) {
        try {
          await prisma.booking.updateMany({
            where: { id: { in: settlement.bookingIds } },
            data:  {
              isSettled:    true,
              settlementId: settlement.id,
            },
          })
          console.log(
            `[confirm-settlement] Marked ${settlement.bookingIds.length} bookings as settled`
          )
        } catch (bookErr) {
          console.warn('[confirm-settlement] Failed to mark bookings:', bookErr?.message)
        }
      }

      /* ── Audit log ── */
      logAdminAction(
        request,
        user,
        'CONFIRM_SETTLEMENT',
        'Settlement',
        id,
        {
          settlementNumber: settlement.settlementNumber,
          previousStatus:   settlement.status,
          utrNumber,
          transferMode,                          // ✅ logged too
          entityType:       settlement.entityType,
          entityName:       settlement.entityName,
          netAmount:        settlement.netSettlementAmount,
        }
      ).catch((e) => console.warn('[audit] confirm settlement:', e?.message))

      return successResponse(
        {
          id:               updated.id,
          settlementNumber: updated.settlementNumber,
          status:           updated.status,
          utrNumber:        updated.utrNumber,
          transferMode:     updated.transferMode,
          transferredAt:    updated.transferredAt,
          netSettlementAmount: updated.netSettlementAmount,
        },
        `✅ Settlement confirmed via ${transferMode}`
      )

    } catch (error) {
      console.error('[POST /api/settlements/[id]/confirm] FATAL:', error)

      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      return errorResponse(
        `Failed to confirm settlement: ${error.message || 'Unknown'}`,
        500
      )
    }
  })
}