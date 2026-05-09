import { NextResponse } from 'next/server'

// No DB update needed — no refreshToken stored on User model
export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    // Clear both cookies
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   0,
      path:     '/',
    })
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   0,
      path:     '/',
    })

    return response

  } catch (error) {
    console.error('[POST /api/auth/logout]', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}