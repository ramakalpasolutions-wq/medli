// C:\Users\ASUS\medli2\src\app\api\auth\login\route.js
// ✅ FIXED: hospital_admin, lab_admin, doctor cannot log in
//           if their linked entity is inactive or unapproved.

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

      // ── Find user ───────────────────────────────────────────────────
      const whereClause = []
      if (phone) whereClause.push({ phone: String(phone).trim() })
      if (email) whereClause.push({ email: email.toLowerCase().trim() })

      const user = await prisma.user.findFirst({
        where:  { OR: whereClause },
        select: {
          id:           true,
          name:         true,
          phone:        true,
          email:        true,
          role:         true,
          passwordHash: true,
          isVerified:   true,
          isBlocked:    true,
          avatar:       true,
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

      // ── ✅ Entity status check ───────────────────────────────────────
      // Prevent login if the linked hospital / lab / doctor is disabled.
      if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findFirst({
          where:  { adminUserId: user.id },
          select: { isActive: true, isApproved: true, name: true },
        })
        if (!hospital) {
          return NextResponse.json(
            { success: false, error: 'No hospital linked to this account. Contact support.' },
            { status: 403 }
          )
        }
        if (!hospital.isActive) {
          return NextResponse.json(
            { success: false, error: `Hospital "${hospital.name}" has been disabled. Contact support.` },
            { status: 403 }
          )
        }
        if (!hospital.isApproved) {
          return NextResponse.json(
            { success: false, error: `Hospital "${hospital.name}" is pending approval.` },
            { status: 403 }
          )
        }
      }

      if (user.role === 'lab_admin') {
        const lab = await prisma.lab.findFirst({
          where:  { adminUserId: user.id },
          select: { isActive: true, isApproved: true, name: true },
        })
        if (!lab) {
          return NextResponse.json(
            { success: false, error: 'No lab linked to this account. Contact support.' },
            { status: 403 }
          )
        }
        if (!lab.isActive) {
          return NextResponse.json(
            { success: false, error: `Lab "${lab.name}" has been disabled. Contact support.` },
            { status: 403 }
          )
        }
        if (!lab.isApproved) {
          return NextResponse.json(
            { success: false, error: `Lab "${lab.name}" is pending approval.` },
            { status: 403 }
          )
        }
      }

      if (user.role === 'doctor') {
        const doctor = await prisma.doctor.findFirst({
          where:  { userId: user.id },
          select: { isActive: true, isVerified: true, name: true },
        })
        if (!doctor) {
          return NextResponse.json(
            { success: false, error: 'No doctor profile linked to this account. Contact support.' },
            { status: 403 }
          )
        }
        if (!doctor.isActive) {
          return NextResponse.json(
            { success: false, error: `Doctor profile for "${doctor.name}" has been disabled. Contact support.` },
            { status: 403 }
          )
        }
        if (!doctor.isVerified) {
          return NextResponse.json(
            { success: false, error: `Doctor profile for "${doctor.name}" is pending verification.` },
            { status: 403 }
          )
        }
      }
      // ── End entity status check ─────────────────────────────────────

      // ── Generate tokens ─────────────────────────────────────────────
      const payload = {
        userId: user.id,
        role:   user.role,
        phone:  user.phone,
        email:  user.email,
      }

      const accessToken  = generateAccessToken(payload)
      const refreshToken = generateRefreshToken(payload)

      // ── Mark user verified ──────────────────────────────────────────
      if (!user.isVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { isVerified: true },
        })
      }

      // ── Audit log ───────────────────────────────────────────────────
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

      // ── Response ────────────────────────────────────────────────────
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
          refreshToken,
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