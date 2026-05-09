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
      checkRole(user, 'super_admin')

      const { id }    = await params
      const body      = await request.json().catch(() => ({}))
      const utrNumber = body?.utrNumber || null

      const settlement = await prisma.settlement.findUnique({
        where: { id },
      })

      if (!settlement) {
        return errorResponse('Settlement not found', 404)
      }

      // ✅ Allow confirm for pending, initiated, processing
      const CONFIRMABLE = ['pending', 'processing', 'on_hold']
      if (settlement.status === 'completed') {
        return errorResponse('Settlement is already completed', 400)
      }
      if (settlement.status === 'failed') {
        return errorResponse('Cannot confirm a failed settlement', 400)
      }

      const updated = await prisma.settlement.update({
        where: { id },
        data: {
          status:        'completed',
          utrNumber:     utrNumber || settlement.utrNumber || undefined,
          transferredAt: new Date(),
          confirmedBy:   user.userId,
        },
      })

      logAdminAction(
        request,
        user,
        'CONFIRM_SETTLEMENT',
        'Settlement',
        id,
        {
          settlementNumber: settlement.settlementNumber,
          previousStatus:   settlement.status,
          utrNumber:        utrNumber || settlement.utrNumber,
          entityType:       settlement.entityType,
          netAmount:        settlement.netSettlementAmount,
        }
      ).catch((e) => console.warn('[audit] confirm settlement:', e?.message))

      return successResponse(updated, 'Settlement confirmed successfully')

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/settlements/[id]/confirm]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}