import { NextResponse }                              from 'next/server'
import { withRateLimit }                             from '@/lib/middleware/rateLimit.middleware'
import { prisma }                                    from '@/lib/prisma'
import { generateAccessToken, generateRefreshToken } from '@/lib/utils/jwt'
import { validatePhone }                             from '@/lib/utils/validators'

export async function POST(request) {
  return withRateLimit(request, 'otp', async () => {
    try {
      const { phone, otp } = await request.json()

      if (!phone || !otp) {
        return NextResponse.json(
          { success: false, error: 'Phone and OTP are required' },
          { status: 400 }
        )
      }
      if (!validatePhone(phone)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number' },
          { status: 400 }
        )
      }

      // Verify OTP
      const { verifyOtp } = await import('@/lib/utils/msg91')
      const valid = await verifyOtp(String(phone).trim(), String(otp).trim())

      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired OTP' },
          { status: 401 }
        )
      }

      // ── Find or create user ─────────────────────────────────────────
      let user = await prisma.user.findUnique({
        where:  { phone: String(phone).trim() },
        select: {
          id:         true,
          name:       true,
          phone:      true,
          email:      true,
          role:       true,
          isBlocked:  true,
          isVerified: true,
          avatar:     true,
        },
      })

      if (!user) {
        // Auto-create on first OTP login
        user = await prisma.user.create({
          data: {
            phone:         String(phone).trim(),
            name:          `User ${String(phone).slice(-4)}`,
            role:          'user',
            isVerified:    true,
            isBlocked:     false,
            familyMembers: [],
          },
          select: {
            id:         true,
            name:       true,
            phone:      true,
            email:      true,
            role:       true,
            isBlocked:  true,
            isVerified: true,
            avatar:     true,
          },
        })
      }

      if (user.isBlocked) {
        return NextResponse.json(
          { success: false, error: 'Account blocked. Contact support.' },
          { status: 403 }
        )
      }

      // ── Mark verified ───────────────────────────────────────────────
      if (!user.isVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { isVerified: true },
        })
      }

      // ── Generate tokens ─────────────────────────────────────────────
      const payload = {
        userId: user.id,
        role:   user.role,
        phone:  user.phone,
        email:  user.email,
      }

      const accessToken  = generateAccessToken(payload)
      const refreshToken = generateRefreshToken(payload)

      const response = NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        data:    { user, accessToken, refreshToken },
      })

      response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   15 * 60,
        path:     '/',
      })
      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   30 * 24 * 60 * 60,
        path:     '/',
      })

      return response

    } catch (error) {
      console.error('[POST /api/auth/otp/verify]', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}