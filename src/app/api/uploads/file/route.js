import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { deleteFromR2 } from '@/lib/utils/cloudflare'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function DELETE(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'hospital_admin', 'lab_admin')

    const body = await request.json()
    if (!body.key) return errorResponse('key is required', 'VALIDATION_ERROR', 400)

    const result = await deleteFromR2(body.key)
    return successResponse(result, 'File deleted')
  } catch (err) {
    console.error('[File Delete]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to delete file', 'SERVER_ERROR', 500)
  }
}