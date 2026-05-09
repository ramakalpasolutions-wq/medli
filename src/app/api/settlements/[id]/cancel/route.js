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

export async function POST(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'regional_manager')

      const { id }  = await params
      const body    = await request.json().catch(() => ({}))
      const reason  = body?.reason || 'Cancelled by admin'

      const settlement = await prisma.settlement.findUnique({
        where: { id },
      })

      if (!settlement) {
        return errorResponse('Settlement not found', 404)
      }

      // ✅ Allow cancel for any non-final status
      const FINAL_STATUSES = ['completed', 'failed']
      if (FINAL_STATUSES.includes(settlement.status)) {
        return errorResponse(
          `Cannot cancel a settlement that is already ${settlement.status}`,
          400
        )
      }

      // ✅ Schema SettlementStatus enum: pending | processing | completed | failed | on_hold
      const updated = await prisma.settlement.update({
        where: { id },
        data: {
          status:        'failed',      // 'cancelled' is not in schema — use 'failed'
          failureReason: reason,
        },
      })

      // Fire and forget audit log
      logAdminAction(
        request,
        user,
        'CANCEL_SETTLEMENT',
        'Settlement',
        id,
        {
          settlementNumber: settlement.settlementNumber,
          previousStatus:   settlement.status,
          reason,
        }
      ).catch((e) => console.warn('[audit] cancel settlement:', e?.message))

      return successResponse(
        {
          id:               updated.id,
          settlementNumber: updated.settlementNumber,
          status:           updated.status,
          failureReason:    updated.failureReason,
        },
        'Settlement cancelled successfully'
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/settlements/[id]/cancel]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}