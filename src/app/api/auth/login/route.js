import { NextResponse }                              from 'next/server'
import { prisma }                                    from '@/lib/prisma'
import { comparePassword }                           from '@/lib/utils/encryption'
import { generateAccessToken, generateRefreshToken } from '@/lib/utils/jwt'
import { withRateLimit }                             from '@/lib/middleware/rateLimit.middleware'
import { createAuditLog }                            from '@/lib/middleware/audit.middleware'

export async function POST(request) {
  return withRateLimit(request, 'auth', async () => {
    try {
      const body = await request.json()
      const { phone, email, password, otp } = body

      // ── Validate ────────────────────────────────────────────────────
      if (!phone && !email) {
        return NextResponse.json(
          { success: false, error: 'Phone or email is required' },
          { status: 400 }
        )
      }
      if (!password && !otp) {
        return NextResponse.json(
          { success: false, error: 'Password or OTP is required' },
          { status: 400 }
        )
      }

      // ── Build where clause ──────────────────────────────────────────
      const whereClause = []
      if (phone) whereClause.push({ phone: String(phone).trim() })
      if (email) whereClause.push({ email: email.toLowerCase().trim() })

      // ── Find user — exact schema fields only ────────────────────────
      const user = await prisma.user.findFirst({
        where:  { OR: whereClause },
        select: {
          id:           true,
          name:         true,
          phone:        true,
          email:        true,
          role:         true,
          passwordHash: true,   // ✅ correct
          isVerified:   true,
          isBlocked:    true,
          avatar:       true,
          // devices is UserDevice[] embedded — select it to update FCM
          devices:      true,
        },
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      if (user.isBlocked) {
        return NextResponse.json(
          { success: false, error: 'Account blocked. Contact support.' },
          { status: 403 }
        )
      }

      // ── Verify credentials ──────────────────────────────────────────
      if (otp) {
        try {
          const { verifyOtp } = await import('@/lib/utils/msg91')
          const valid = await verifyOtp(user.phone, otp)
          if (!valid) {
            return NextResponse.json(
              { success: false, error: 'Invalid or expired OTP' },
              { status: 401 }
            )
          }
        } catch (e) {
          console.error('[login] OTP error:', e?.message)
          return NextResponse.json(
            { success: false, error: 'OTP verification failed' },
            { status: 500 }
          )
        }
      } else {
        if (!user.passwordHash) {
          return NextResponse.json(
            { success: false, error: 'No password set. Use OTP login.' },
            { status: 400 }
          )
        }
        const valid = await comparePassword(password, user.passwordHash)
        if (!valid) {
          return NextResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 }
          )
        }
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

      // ── Mark user verified (no lastLoginAt in schema) ───────────────
      if (!user.isVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { isVerified: true },
        })
      }

      // ── Audit log — fire and forget ─────────────────────────────────
      createAuditLog({
        actorId:    user.id,
        actorRole:  user.role,
        action:     'LOGIN',
        targetType: 'USER',
        targetId:   user.id,
        ipAddress:  request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') || 'unknown',
        details: {
          method:    otp ? 'otp' : 'password',
          userAgent: request.headers.get('user-agent') || '',
        },
      }).catch((e) => console.warn('[login] audit skipped:', e?.message))

      // ── Build response ──────────────────────────────────────────────
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id:         user.id,
            name:       user.name,
            phone:      user.phone,
            email:      user.email,
            role:       user.role,
            isVerified: user.isVerified,
            avatar:     user.avatar,
          },
          accessToken,
          refreshToken, // client stores this for token refresh
        },
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
      console.error('[POST /api/auth/login]', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}