import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { cache } from '@/lib/cache'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()
    const { pattern } = body

    if (pattern) {
      await cache.delPattern(pattern)
    } else {
      await cache.delPattern('*')
    }

    await logAdminAction({
      actorId: user.id,
      actorRole: user.role,
      action: 'cache_cleared',
      details: { pattern: pattern || '*' },
      request,
    })

    return successResponse({ cleared: true, pattern: pattern || '*' }, 'Cache cleared')
  } catch (err) {
    console.error('[Cache Clear]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to clear cache', 'SERVER_ERROR', 500)
  }
}