import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { sanitizeInput } from '@/lib/utils/validators'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)

    // Own profile or super_admin
    if (user.id !== id && user.role !== 'super_admin') {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isVerified: true,
        isBlocked: true,
        bankAccount: true,
        wallet: true,
        devices: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!targetUser) {
      return errorResponse('User not found', 'NOT_FOUND', 404)
    }

    return successResponse(targetUser)
  } catch (err) {
    console.error('[User GET]', err.message)
    if (err.message.includes('token') || err.message.includes('auth')) {
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    }
    return errorResponse('Failed to fetch user', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)

    if (user.id !== id && user.role !== 'super_admin') {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const body = await request.json()
    const updateData = {}

    if (body.name !== undefined) updateData.name = sanitizeInput(body.name)
    if (body.avatar !== undefined) updateData.avatar = body.avatar

    // super_admin can change role
    if (body.role !== undefined && user.role === 'super_admin') {
      updateData.role = body.role
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isVerified: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return successResponse(updated, 'User updated')
  } catch (err) {
    console.error('[User PUT]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update user', 'SERVER_ERROR', 500)
  }
}