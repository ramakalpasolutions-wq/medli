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
      const { name, phone, email, password } = body

      // ── Validate ────────────────────────────────────────────────────
      if (!name?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Name is required' },
          { status: 400 }
        )
      }
      if (!phone && !email) {
        return NextResponse.json(
          { success: false, error: 'Phone or email is required' },
          { status: 400 }
        )
      }
      if (phone && !validatePhone(phone)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number (10 digits, starts with 6-9)' },
          { status: 400 }
        )
      }

      // ── Check duplicate ─────────────────────────────────────────────
      const orClause = []
      if (phone) orClause.push({ phone: String(phone).trim() })
      if (email) orClause.push({ email: email.toLowerCase().trim() })

      const existing = await prisma.user.findFirst({
        where:  { OR: orClause },
        select: { id: true, phone: true, email: true },
      })

      if (existing) {
        const field = existing.phone === String(phone || '').trim()
          ? 'phone number'
          : 'email'
        return NextResponse.json(
          { success: false, error: `Account with this ${field} already exists` },
          { status: 409 }
        )
      }

      // ── Hash password ───────────────────────────────────────────────
      const passwordHash = password ? await hashPassword(password) : null

      // ── Create user — exact schema fields ───────────────────────────
      const user = await prisma.user.create({
        data: {
          name:         name.trim(),
          phone:        phone ? String(phone).trim() : undefined,
          email:        email ? email.toLowerCase().trim() : undefined,
          passwordHash,           // ✅ correct field
          role:         'user',
          isVerified:   false,
          isBlocked:    false,
          familyMembers: [],      // ✅ initialize empty array
        },
        select: {
          id:         true,
          name:       true,
          phone:      true,
          email:      true,
          role:       true,
          isVerified: true,
          avatar:     true,
        },
      })

      // ── Generate tokens ─────────────────────────────────────────────
      const payload = {
        userId: user.id,
        role:   user.role,
        phone:  user.phone,
        email:  user.email,
      }

      const accessToken  = generateAccessToken(payload)
      const refreshToken = generateRefreshToken(payload)

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
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}