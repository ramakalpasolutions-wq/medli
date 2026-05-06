import { verifyAuth }  from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    return successResponse(user, 'User fetched')
  } catch (err) {
    console.error('[Me]', err.message)
    return errorResponse(err.message, 'AUTH_ERROR', 401)
  }
}