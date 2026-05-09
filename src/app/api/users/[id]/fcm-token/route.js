import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function PATCH(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params  // ✅ await

      // ✅ user.userId
      if (user.userId !== id) {
        return errorResponse('Access denied', 403)
      }

      const body = await request.json()
      const { token, platform = 'web' } = body

      if (!token) return errorResponse('token is required', 400)

      if (!['web', 'android', 'ios'].includes(platform)) {
        return errorResponse('platform must be web, android, or ios', 400)
      }

      const currentUser = await prisma.user.findUnique({
        where:  { id },
        select: { devices: true },
      })

      let devices = (currentUser?.devices || []).filter((d) => d.token !== token)

      devices.push({ token, platform, lastActive: new Date() })

      // Keep max 5 devices
      if (devices.length > 5) devices = devices.slice(-5)

      const updated = await prisma.user.update({
        where:  { id },
        data:   { devices },
        select: { id: true, devices: true },
      })

      return successResponse(updated, 'FCM token updated')
    } catch (error) {
      console.error('[PATCH /api/users/[id]/fcm-token]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}