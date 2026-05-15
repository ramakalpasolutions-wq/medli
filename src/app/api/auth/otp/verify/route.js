import { NextResponse }                              from 'next/server'
import { withRateLimit }                             from '@/lib/middleware/rateLimit.middleware'
import { prisma }                                    from '@/lib/prisma'
import { generateAccessToken, generateRefreshToken } from '@/lib/utils/jwt'
import { validatePhone, validateEmail }              from '@/lib/utils/validators'
import { verifyOtp }                                 from '@/lib/utils/msg91'
import { verifyEmailOtp }                            from '@/lib/utils/emailOtp'

export async function POST(request) {
  return withRateLimit(request, 'otp', async () => {
    try {
      const body    = await request.json()
      const phone   = String(body?.phone   || '').trim()
      const email   = String(body?.email   || '').trim().toLowerCase()
      const otp     = String(body?.otp     || '').trim()
      const purpose = body?.purpose || 'login'  // 'login' or 'verify_only'

      // ── Validate inputs ──────────────────────────────────────────────
      if (!phone && !email) {
        return NextResponse.json(
          { success: false, error: 'Phone or email is required' },
          { status: 400 }
        )
      }
      if (!otp) {
        return NextResponse.json(
          { success: false, error: 'OTP is required' },
          { status: 400 }
        )
      }
      if (!/^\d{6}$/.test(otp)) {
        return NextResponse.json(
          { success: false, error: 'OTP must be 6 digits' },
          { status: 400 }
        )
      }
      if (phone && !validatePhone(phone)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number' },
          { status: 400 }
        )
      }
      if (email && !validateEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email address' },
          { status: 400 }
        )
      }

      // ── Verify OTP via correct channel ───────────────────────────────
      let valid = false
      if (phone) {
        valid = await verifyOtp(phone, otp)
      } else if (email) {
        valid = await verifyEmailOtp(email, otp)
      }

      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired OTP' },
          { status: 401 }
        )
      }

      // ── verify_only: don't create user / session ─────────────────────
      // Used by registration to verify phone/email before account creation
      if (purpose === 'verify_only') {
        return NextResponse.json({
          success: true,
          message: 'OTP verified',
        })
      }

      // ── login: find or create user, return tokens ────────────────────
      let user = null

      if (phone) {
        user = await prisma.user.findUnique({
          where:  { phone },
          select: {
            id: true, name: true, phone: true,
            email: true, role: true,
            isBlocked: true, isVerified: true, avatar: true,
          },
        })
      } else if (email) {
        user = await prisma.user.findUnique({
          where:  { email },
          select: {
            id: true, name: true, phone: true,
            email: true, role: true,
            isBlocked: true, isVerified: true, avatar: true,
          },
        })
      }

      if (user?.isBlocked) {
        return NextResponse.json(
          { success: false, error: 'Account blocked. Contact support.' },
          { status: 403 }
        )
      }

      // Auto-create on first phone OTP login
      if (!user && phone) {
        user = await prisma.user.create({
          data: {
            phone,
            name:          `User ${phone.slice(-4)}`,
            role:          'user',
            isVerified:    true,
            isBlocked:     false,
            familyMembers: [],
          },
          select: {
            id: true, name: true, phone: true,
            email: true, role: true,
            isBlocked: true, isVerified: true, avatar: true,
          },
        })
      }

      // Email OTP login requires existing account
      if (!user && email) {
        return NextResponse.json(
          { success: false, error: 'No account found with this email. Please register first.' },
          { status: 404 }
        )
      }

      // Mark verified if not already
      if (!user.isVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { isVerified: true },
        })
        user = { ...user, isVerified: true }
      }

      // ── Generate tokens ──────────────────────────────────────────────
      const payload = {
        userId: user.id,
        role:   user.role,
        phone:  user.phone,
        email:  user.email,
      }

      const accessToken  = generateAccessToken(payload)
      const refreshToken = generateRefreshToken(payload)

      const isProd   = process.env.NODE_ENV === 'production'
      const response = NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        data:    { user, accessToken, refreshToken },
      })

      response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure:   isProd,
        sameSite: 'lax',
        maxAge:   15 * 60,
        path:     '/',
      })
      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   isProd,
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