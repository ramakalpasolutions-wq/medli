import { NextResponse }                              from 'next/server'
import { verifyRefreshToken, generateAccessToken,
         generateRefreshToken }                      from '@/lib/utils/jwt'

// NOTE: refreshToken is NOT stored in DB (no field on User model).
// We use stateless JWT verification only.
export async function POST(request) {
  try {
    const cookieToken = request.cookies.get('refreshToken')?.value
    const bodyToken   = await request.json()
                          .then((b) => b?.refreshToken)
                          .catch(() => null)

    const token = cookieToken || bodyToken

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Refresh token required' },
        { status: 401 }
      )
    }

    let decoded
    try {
      decoded = verifyRefreshToken(token)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Generate new tokens
    const payload = {
      userId: decoded.userId,
      role:   decoded.role,
      phone:  decoded.phone,
      email:  decoded.email,
    }

    const newAccessToken  = generateAccessToken(payload)
    const newRefreshToken = generateRefreshToken(payload)

    const response = NextResponse.json({
      success:      true,
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
    })

    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   15 * 60,
      path:     '/',
    })
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60,
      path:     '/',
    })

    return response

  } catch (error) {
    console.error('[POST /api/auth/refresh-token]', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}