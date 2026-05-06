import prisma from '@/lib/prisma'
import { verifyAuth }                   from '@/lib/middleware/auth.middleware'
import { comparePassword, hashPassword } from '@/lib/utils/encryption'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function PUT(request) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()

    const { oldPassword, newPassword } = body

    if (!oldPassword || !newPassword) {
      return errorResponse(
        'Old password and new password are required',
        'VALIDATION_ERROR',
        400
      )
    }

    if (newPassword.length < 6) {
      return errorResponse(
        'New password must be at least 6 characters',
        'VALIDATION_ERROR',
        400
      )
    }

    if (oldPassword === newPassword) {
      return errorResponse(
        'New password must be different from old password',
        'VALIDATION_ERROR',
        400
      )
    }

    // Fetch full user with passwordHash
    const fullUser = await prisma.user.findUnique({
      where:  { id: user.id },
      select: { id: true, passwordHash: true },
    })

    if (!fullUser?.passwordHash) {
      return errorResponse(
        'Password change not available for this account',
        'NO_PASSWORD',
        400
      )
    }

    const isMatch = await comparePassword(oldPassword, fullUser.passwordHash)
    if (!isMatch) {
      return errorResponse('Old password is incorrect', 'INVALID_PASSWORD', 401)
    }

    const newHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash: newHash },
    })

    return successResponse(
      { message: 'Password changed successfully' },
      'Password updated'
    )
  } catch (err) {
    console.error('[Change Password]', err.message)

    if (err.message.includes('token') || err.message.includes('auth')) {
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    }

    return errorResponse('Failed to change password', 'SERVER_ERROR', 500)
  }
}