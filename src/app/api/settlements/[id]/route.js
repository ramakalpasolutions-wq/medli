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

export async function GET(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params

      const settlement = await prisma.settlement.findUnique({
        where: { id },
      })

      if (!settlement) {
        return errorResponse('Settlement not found', 404)
      }

      // Role-based access
      if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true },
        })
        if (!hospital || settlement.entityId !== hospital.id) {
          return errorResponse('Access denied', 403)
        }
      } else if (user.role === 'lab_admin') {
        const lab = await prisma.lab.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true },
        })
        if (!lab || settlement.entityId !== lab.id) {
          return errorResponse('Access denied', 403)
        }
      } else {
        checkRole(user,
          'super_admin', 'regional_manager',
          'hospital_admin', 'lab_admin',
        )
      }

      return successResponse(settlement)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/settlements/[id]]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function PATCH(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin')

      const { id }  = await params
      const body    = await request.json()

      const settlement = await prisma.settlement.findUnique({
        where: { id },
      })

      if (!settlement) {
        return errorResponse('Settlement not found', 404)
      }

      // Only allow updating non-final settlements
      if (['completed', 'failed'].includes(settlement.status)) {
        return errorResponse(
          `Cannot update a ${settlement.status} settlement`,
          400
        )
      }

      const updated = await prisma.settlement.update({
        where: { id },
        data: {
          notes:        body.notes        || undefined,
          utrNumber:    body.utrNumber    || undefined,
          bankName:     body.bankName     || undefined,
          transferMode: body.transferMode || undefined,
        },
      })

      logAdminAction(
        request,
        user,
        'UPDATE_SETTLEMENT',
        'Settlement',
        id,
        { changes: body }
      ).catch(() => null)

      return successResponse(updated, 'Settlement updated')

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[PATCH /api/settlements/[id]]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}