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

      // ✅ await params
      const { id } = await params

      const hospital = await prisma.hospital.findUnique({ where: { id } })
      if (!hospital) {
        return errorResponse('Hospital not found', 404)
      }

      const updated = await prisma.hospital.update({
        where: { id },
        data:  { isActive: !hospital.isActive },
      })

      // Invalidate cache
      await cache.del(`hospital:${id}`)

      // ✅ Correct logAdminAction signature: (request, user, action, targetType, targetId, details)
      logAdminAction(
        request,
        user,
        updated.isActive ? 'HOSPITAL_ACTIVATED' : 'HOSPITAL_DEACTIVATED',
        'Hospital',
        id,
        { hospitalName: hospital.name, isActive: updated.isActive }
      ).catch((e) => console.warn('[audit]', e?.message))

      return successResponse(
        updated,
        `Hospital ${updated.isActive ? 'activated' : 'deactivated'} successfully`
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[PATCH /api/hospitals/[id]/activate]', error)
      return errorResponse('Failed to toggle hospital status', 500)
    }
  })
}