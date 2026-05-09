import { prisma }        from '@/lib/prisma'
import { verifyAuth }    from '@/lib/middleware/auth.middleware'
import { sanitizeInput } from '@/lib/utils/validators'
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

      // ✅ user.userId (not user.id)
      if (user.userId !== id && user.role !== 'super_admin') {
        return errorResponse('Access denied', 403)
      }

      const targetUser = await prisma.user.findUnique({
        where:  { id },
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          avatar: true, isVerified: true, isBlocked: true,
          bankAccount: true, wallet: true, familyMembers: true,
          createdAt: true, updatedAt: true,
        },
      })

      if (!targetUser) return errorResponse('User not found', 404)

      return successResponse(targetUser)
    } catch (error) {
      console.error('[GET /api/users/[id]]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function PUT(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params

      // ✅ user.userId
      if (user.userId !== id && user.role !== 'super_admin') {
        return errorResponse('Access denied', 403)
      }

      const body       = await request.json()
      const updateData = {}

      if (body.name   !== undefined) updateData.name   = sanitizeInput(body.name)
      if (body.avatar !== undefined) updateData.avatar = body.avatar
      if (body.email  !== undefined) updateData.email  = body.email?.toLowerCase().trim() || null

      if (body.role !== undefined && user.role === 'super_admin') {
        updateData.role = body.role
      }

      const updated = await prisma.user.update({
        where:  { id },
        data:   updateData,
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          avatar: true, isVerified: true, isBlocked: true,
          createdAt: true, updatedAt: true,
        },
      })

      return successResponse(updated, 'User updated')
    } catch (error) {
      console.error('[PUT /api/users/[id]]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}