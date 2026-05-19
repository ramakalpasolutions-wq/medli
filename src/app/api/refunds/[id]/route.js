import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { processRefund } from '@/lib/services/refund.service'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params

      const refund = await prisma.refund.findUnique({
        where: { id },
      })

      if (!refund) {
        return errorResponse('Refund not found', 404)
      }

      if (user.role === 'user') {
        if (refund.userId !== user.userId) {
          return errorResponse('Access denied', 403)
        }
      } else {
        checkRole(user, 'super_admin', 'regional_manager')
      }

      return successResponse(refund)
    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }

      console.error('[GET /api/refunds/:id]', error)
      return errorResponse('Failed to fetch refund', 500)
    }
  })
}

export async function POST(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin')

      const { id } = await params
      const body = await request.json()

      const refund = await prisma.refund.findUnique({
        where: { id },
      })

      if (!refund) {
        return errorResponse('Refund not found', 404)
      }

      if (refund.status === 'completed') {
        return errorResponse('Refund already completed', 400)
      }

      const retried = await processRefund({
        bookingId: refund.bookingId,
        initiatedBy: user.userId,
        reason: body.reason || refund.reason,
      })

      return successResponse(retried, 'Refund retried')
    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }

      console.error('[POST /api/refunds/:id]', error)
      return errorResponse(error.message || 'Refund retry failed', 400)
    }
  })
}