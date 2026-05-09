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

export async function PATCH(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin')

      const { id } = await params

      const targetUser = await prisma.user.findUnique({ where: { id } })
      if (!targetUser) return errorResponse('User not found', 404)

      // ✅ user.userId
      if (targetUser.id === user.userId) {
        return errorResponse('Cannot block yourself', 400)
      }

      const updated = await prisma.user.update({
        where:  { id },
        data:   { isBlocked: !targetUser.isBlocked },
        select: { id: true, name: true, email: true, phone: true, role: true, isBlocked: true },
      })

      logAdminAction(
        request, user,
        updated.isBlocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
        'User', id,
        { userName: targetUser.name, isBlocked: updated.isBlocked }
      ).catch(() => null)

      return successResponse(updated, `User ${updated.isBlocked ? 'blocked' : 'unblocked'}`)
    } catch (error) {
      if (error.message?.includes('Access denied')) return errorResponse(error.message, 403)
      console.error('[PATCH /api/users/[id]/block]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}