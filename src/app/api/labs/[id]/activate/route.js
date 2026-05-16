import { prisma }         from '@/lib/prisma'
import { cache }          from '@/lib/cache'
import { verifyAuth }     from '@/lib/middleware/auth.middleware'
import { checkRole }      from '@/lib/middleware/rbac.middleware'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function PATCH(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin')

      const { id } = await params

      const lab = await prisma.lab.findUnique({ where: { id } })
      if (!lab) {
        return errorResponse('Lab not found', 404)
      }

      const updated = await prisma.lab.update({
        where: { id },
        data:  { isActive: !lab.isActive },
      })

      await cache.del(`lab:${id}`)

      logAdminAction(
        request,
        user,
        updated.isActive ? 'LAB_ACTIVATED' : 'LAB_DEACTIVATED',
        'Lab',
        id,
        { labName: lab.name, isActive: updated.isActive }
      ).catch((e) => console.warn('[audit]', e?.message))

      return successResponse(
        updated,
        `Lab ${updated.isActive ? 'activated' : 'deactivated'} successfully`
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[PATCH /api/labs/[id]/activate]', error)
      return errorResponse('Failed to toggle lab status', 500)
    }
  })
}