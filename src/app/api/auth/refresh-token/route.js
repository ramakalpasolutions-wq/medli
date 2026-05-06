import { verifyRefreshToken, generateAccessToken } from '@/lib/utils/jwt'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    let token = null

    // Try body first
    try {
      const body = await request.json()
      token      = body.refreshToken || null
    } catch {
      // Body might be empty
    }

    // Fallback to cookie
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || ''
      const match        = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/)
      if (match) token   = match[1]
    }

    if (!token) {
      return errorResponse('Refresh token is required', 'TOKEN_MISSING', 400)
    }

    const payload     = verifyRefreshToken(token)
    const accessToken = generateAccessToken({ id: payload.id, role: payload.role })

    const response = successResponse({ accessToken }, 'Token refreshed')

    response.headers.set(
      'Set-Cookie',
      `accessToken=${accessToken}; HttpOnly; Path=/; Max-Age=900; SameSite=Strict`
    )

    return response
  } catch (err) {
    console.error('[Refresh Token]', err.message)
    return errorResponse('Invalid or expired refresh token', 'TOKEN_INVALID', 401)
  }
}