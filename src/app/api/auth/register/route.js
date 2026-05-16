// C:\Users\ASUS\medli2\src\app\api\auth\register\route.js

import { NextResponse }                              from 'next/server'
import { prisma }                                    from '@/lib/prisma'
import { hashPassword }                              from '@/lib/utils/encryption'
import { generateAccessToken, generateRefreshToken } from '@/lib/utils/jwt'
import { withRateLimit }                             from '@/lib/middleware/rateLimit.middleware'
import { validatePhone }                             from '@/lib/utils/validators'

export async function POST(request) {
  return withRateLimit(request, 'auth', async () => {
    try {
      const body = await request.json()

      const {
        name,
        phone,
        email,
        password,
        agreedToTerms,           // ✅ boolean from frontend checkbox
        termsVersion = '1.0',    // ✅ version string (default '1.0')
      } = body

      /* ─────────────────────────────────────────────────────────────────
         1. VALIDATE — All fields are now mandatory
      ───────────────────────────────────────────────────────────────── */

      // Name
      if (!name?.trim() || name.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: 'Full name is required (minimum 2 characters)' },
          { status: 400 }
        )
      }

      // Phone — required
      if (!phone) {
        return NextResponse.json(
          { success: false, error: 'Phone number is required' },
          { status: 400 }
        )
      }
      if (!validatePhone(phone)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid phone number — must be 10 digits starting with 6–9',
          },
          { status: 400 }
        )
      }

      // Email — required
      if (!email?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Email address is required' },
          { status: 400 }
        )
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { success: false, error: 'Invalid email address' },
          { status: 400 }
        )
      }

      // Password — required
      if (!password || password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters' },
          { status: 400 }
        )
      }

      // Terms — required
      if (!agreedToTerms) {
        return NextResponse.json(
          {
            success: false,
            error: 'You must agree to the Terms of Service and Privacy Policy',
          },
          { status: 400 }
        )
      }

      /* ─────────────────────────────────────────────────────────────────
         2. Get client IP for audit trail
      ───────────────────────────────────────────────────────────────── */
      const forwarded = request.headers.get('x-forwarded-for')
      const realIp    = request.headers.get('x-real-ip')
      const clientIp  =
        forwarded?.split(',')[0]?.trim() || realIp || 'unknown'

      /* ─────────────────────────────────────────────────────────────────
         3. Check duplicates — phone AND email both must be unique
      ───────────────────────────────────────────────────────────────── */
      const normalizedPhone = String(phone).trim()
      const normalizedEmail = email.toLowerCase().trim()

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { email: normalizedEmail },
          ],
        },
        select: {
          id:    true,
          phone: true,
          email: true,
        },
      })

      if (existing) {
        // Tell the user exactly which field is duplicated
        const isDuplicatePhone = existing.phone === normalizedPhone
        const isDuplicateEmail = existing.email === normalizedEmail

        let errorMsg = 'Account already exists'
        if (isDuplicatePhone && isDuplicateEmail) {
          errorMsg = 'An account with this phone number and email already exists'
        } else if (isDuplicatePhone) {
          errorMsg = 'An account with this phone number already exists'
        } else if (isDuplicateEmail) {
          errorMsg = 'An account with this email address already exists'
        }

        return NextResponse.json(
          { success: false, error: errorMsg },
          { status: 409 }
        )
      }

      /* ─────────────────────────────────────────────────────────────────
         4. Hash password
      ───────────────────────────────────────────────────────────────── */
      const passwordHash = await hashPassword(password)

      /* ─────────────────────────────────────────────────────────────────
         5. Create user — includes terms acceptance fields
      ───────────────────────────────────────────────────────────────── */
      const user = await prisma.user.create({
        data: {
          // ── Core fields ──────────────────────────────────────────────
          name:          name.trim(),
          phone:         normalizedPhone,
          email:         normalizedEmail,
          passwordHash,
          role:          'user',
          isVerified:    true,    // both phone + email verified via OTP before this call
          isBlocked:     false,
          familyMembers: [],

          // ── Terms acceptance — saved permanently for compliance ───────
          agreedToTerms:   true,           // ✅ the boolean
          agreedToTermsAt: new Date(),     // ✅ exact timestamp
          termsVersion:    termsVersion,   // ✅ which version they agreed to
          agreedFromIp:    clientIp,       // ✅ IP address for audit
        },
        select: {
          id:              true,
          name:            true,
          phone:           true,
          email:           true,
          role:            true,
          isVerified:      true,
          avatar:          true,
          agreedToTerms:   true,    // ✅ return so frontend can confirm
          agreedToTermsAt: true,    // ✅ return timestamp
          termsVersion:    true,    // ✅ return version
          createdAt:       true,
        },
      })

      /* ─────────────────────────────────────────────────────────────────
         6. Generate tokens — same pattern as your existing code
      ───────────────────────────────────────────────────────────────── */
      const payload = {
        userId: user.id,
        role:   user.role,
        phone:  user.phone,
        email:  user.email,
      }

      const accessToken  = generateAccessToken(payload)
      const refreshToken = generateRefreshToken(payload)

      /* ─────────────────────────────────────────────────────────────────
         7. Build response — same cookie pattern as your existing code
      ───────────────────────────────────────────────────────────────── */
      const response = NextResponse.json(
        {
          success: true,
          message: 'Registration successful',
          data:    { user, accessToken, refreshToken },
        },
        { status: 201 }
      )

      // HttpOnly cookies — same as your existing pattern
      response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   15 * 60,          // 15 minutes
        path:     '/',
      })
      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   30 * 24 * 60 * 60, // 30 days
        path:     '/',
      })

      return response

    } catch (error) {
      console.error('[POST /api/auth/register]', error)

      // Handle Prisma unique constraint violation (race condition safety net)
      if (error.code === 'P2002') {
        const field = error.meta?.target?.includes('phone')
          ? 'phone number'
          : error.meta?.target?.includes('email')
            ? 'email address'
            : 'details'
        return NextResponse.json(
          {
            success: false,
            error:   `An account with this ${field} already exists`,
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}