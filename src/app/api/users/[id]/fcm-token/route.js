import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)

    if (user.id !== id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const body = await request.json()
    const { token, platform } = body

    if (!token || !platform) {
      return errorResponse('token and platform are required', 'VALIDATION_ERROR', 400)
    }

    if (!['web', 'android', 'ios'].includes(platform)) {
      return errorResponse('platform must be web, android, or ios', 'VALIDATION_ERROR', 400)
    }

    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { devices: true },
    })

    let devices = currentUser?.devices || []

    // Remove existing entry with same token
    devices = devices.filter((d) => d.token !== token)

    // Add new device
    devices.push({
      token,
      platform,
      lastActive: new Date(),
    })

    // Keep max 5 devices (remove oldest)
    if (devices.length > 5) {
      devices = devices.slice(-5)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { devices },
      select: {
        id: true,
        devices: true,
      },
    })

    return successResponse(updated, 'FCM token updated')
  } catch (err) {
    console.error('[FCM Token]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update FCM token', 'SERVER_ERROR', 500)
  }
}