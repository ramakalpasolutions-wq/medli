import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    const response = successResponse(
      { message: 'Logged out successfully' },
      'Logged out'
    )

    // Clear access token cookie
    response.headers.append(
      'Set-Cookie',
      'accessToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
    )

    // Clear refresh token cookie
    response.headers.append(
      'Set-Cookie',
      'refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
    )

    return response
  } catch (err) {
    console.error('[Logout]', err.message)
    return errorResponse('Logout failed', 'SERVER_ERROR', 500)
  }
}