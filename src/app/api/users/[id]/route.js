import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { sanitizeInput } from '@/lib/utils/validators'

export function OPTIONS() {
  return handleOptions()
}

export async function PUT(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params

      if (
        user.id !== id &&
        user.role !== 'super_admin' &&
        user.role !== 'regional_manager'
      ) {
        return errorResponse('Access denied', 403)
      }

      const body = await request.json()
      const updateData = {}

      if (body.name !== undefined) {
        const name = sanitizeInput(body.name || '').trim()
        if (!name) {
          return errorResponse('Name is required', 400)
        }
        updateData.name = name
      }

      if (body.email !== undefined) {
        const email = sanitizeInput(body.email || '').trim().toLowerCase()

        if (email) {
          const existingUser = await prisma.user.findFirst({
            where: {
              email,
              NOT: { id },
            },
            select: { id: true },
          })

          if (existingUser) {
            return errorResponse('Email already exists', 'EMAIL_ALREADY_EXISTS', 409)
          }

          updateData.email = email
        } else {
          updateData.email = null
        }
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          isVerified: true,
          isBlocked: true,
          avatar: true,
          wallet: true,
          familyMembers: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return successResponse(updated, 'User updated successfully')
    } catch (error) {
      console.error('[PUT /api/users/[id]]', error)

      if (error.code === 'P2002') {
        return errorResponse('Email already exists', 'EMAIL_ALREADY_EXISTS', 409)
      }

      return errorResponse(error.message || 'Internal server error', 'SERVER_ERROR', 500)
    }
  })
}