// C:\projects\medli2\src\app\api\auth\register\route.js

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
        email,                   // ✅ optional — may be undefined or empty string
        password,
        agreedToTerms,
        termsVersion = '1.0',
      } = body

      /* ─────────────────────────────────────────────────────────────────
         1. VALIDATE
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
          { success: false, error: 'Invalid phone number — must be 10 digits starting with 6–9' },
          { status: 400 }
        )
      }

      // Email — OPTIONAL: only validate format if the user actually provided one
      const normalizedEmail = email?.trim() ? email.trim().toLowerCase() : null
      if (normalizedEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(normalizedEmail)) {
          return NextResponse.json(
            { success: false, error: 'Invalid email address' },
            { status: 400 }
          )
        }
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
          { success: false, error: 'You must agree to the Terms of Service and Privacy Policy' },
          { status: 400 }
        )
      }

      /* ─────────────────────────────────────────────────────────────────
         2. Get client IP for audit trail
      ───────────────────────────────────────────────────────────────── */
      const forwarded = request.headers.get('x-forwarded-for')
      const realIp    = request.headers.get('x-real-ip')
      const clientIp  = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'

      /* ─────────────────────────────────────────────────────────────────
         3. Check duplicates
         - Phone is always checked
         - Email only checked if provided (to avoid matching null vs null)
      ───────────────────────────────────────────────────────────────── */
      const normalizedPhone = String(phone).trim()

      // Build OR conditions — always check phone, only check email if provided
      const orConditions = [{ phone: normalizedPhone }]
      if (normalizedEmail) {
        orConditions.push({ email: normalizedEmail })
      }

      const existing = await prisma.user.findFirst({
        where: { OR: orConditions },
        select: { id: true, phone: true, email: true },
      })

      if (existing) {
        const isDuplicatePhone = existing.phone === normalizedPhone
        const isDuplicateEmail = normalizedEmail && existing.email === normalizedEmail

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
         5. Create user
         - email is stored as null when not provided (not empty string)
      ───────────────────────────────────────────────────────────────── */
      const user = await prisma.user.create({
        data: {
          name:          name.trim(),
          phone:         normalizedPhone,
          email:         normalizedEmail,   // null when not provided ✅
          passwordHash,
          role:          'user',
          isVerified:    true,
          isBlocked:     false,
          familyMembers: [],

          agreedToTerms:   true,
          agreedToTermsAt: new Date(),
          termsVersion:    termsVersion,
          agreedFromIp:    clientIp,
        },
        select: {
          id:              true,
          name:            true,
          phone:           true,
          email:           true,
          role:            true,
          isVerified:      true,
          avatar:          true,
          agreedToTerms:   true,
          agreedToTermsAt: true,
          termsVersion:    true,
          createdAt:       true,
        },
      })

      /* ─────────────────────────────────────────────────────────────────
         6. Generate tokens
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
         7. Build response
      ───────────────────────────────────────────────────────────────── */
      const response = NextResponse.json(
        {
          success: true,
          message: 'Registration successful',
          data:    { user, accessToken, refreshToken },
        },
        { status: 201 }
      )

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
      console.error('[POST /api/auth/register]', error)

      if (error.code === 'P2002') {
        const field = error.meta?.target?.includes('phone')
          ? 'phone number'
          : error.meta?.target?.includes('email')
            ? 'email address'
            : 'details'
        return NextResponse.json(
          { success: false, error: `An account with this ${field} already exists` },
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