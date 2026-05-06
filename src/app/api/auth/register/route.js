// src/app/api/auth/register/route.js

import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { hashPassword } from '@/lib/utils/encryption'
import { generateAccessToken, generateRefreshToken } from '@/lib/utils/jwt'
import { cache } from '@/lib/cache'
import prisma from '@/lib/prisma'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    // ── Validate required ─────────────────────────────────────────────────
    if (!name?.trim() || name.trim().length < 2) {
      return errorResponse('Full name is required (min 2 chars)', 'MISSING_NAME', 400)
    }

    const cleanPhone = phone ? phone.toString().replace(/\D/g, '') : null
    const cleanEmail = email ? email.trim().toLowerCase() : null

    if (!cleanPhone && !cleanEmail) {
      return errorResponse('Phone number or email is required', 'MISSING_CONTACT', 400)
    }

    if (cleanPhone && cleanPhone.length !== 10) {
      return errorResponse('Invalid 10-digit phone number', 'INVALID_PHONE', 400)
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return errorResponse('Invalid email address', 'INVALID_EMAIL', 400)
    }

    // ── Check OTP verification completed ──────────────────────────────────
    if (cleanPhone) {
      const phoneVerified = await cache.get(`verified:phone:${cleanPhone}`)
      if (!phoneVerified) {
        return errorResponse(
          'Phone not verified. Please complete OTP verification first.',
          'PHONE_NOT_VERIFIED',
          400
        )
      }
    }

    if (cleanEmail && !cleanPhone) {
      // Email-only registration requires email OTP
      const emailVerified = await cache.get(`verified:email:${cleanEmail}`)
      if (!emailVerified) {
        return errorResponse(
          'Email not verified. Please complete OTP verification first.',
          'EMAIL_NOT_VERIFIED',
          400
        )
      }
    }

    // ── Check duplicates ──────────────────────────────────────────────────
    const orConditions = []
    if (cleanEmail) orConditions.push({ email: cleanEmail })
    if (cleanPhone) orConditions.push({ phone: cleanPhone })

    const existing = await prisma.user.findFirst({
      where: { OR: orConditions },
    })

    if (existing) {
      if (cleanEmail && existing.email === cleanEmail) {
        return errorResponse('Email is already registered', 'EMAIL_EXISTS', 400)
      }
      if (cleanPhone && existing.phone === cleanPhone) {
        return errorResponse('Phone is already registered', 'PHONE_EXISTS', 400)
      }
    }

    // ── Hash password ─────────────────────────────────────────────────────
    let passwordHash = null
    if (password) {
      if (password.length < 6) {
        return errorResponse(
          'Password must be at least 6 characters',
          'WEAK_PASSWORD',
          400
        )
      }
      passwordHash = await hashPassword(password)
    }

    // ── Create user ───────────────────────────────────────────────────────
    const user = await prisma.user.create({
      data: {
        name:         name.trim(),
        email:        cleanEmail  || undefined,
        phone:        cleanPhone  || undefined,
        passwordHash: passwordHash || undefined,
        role:         'user',
        isVerified:   true,
        wallet:       { balance: 0 },
      },
      select: {
        id:         true,
        name:       true,
        email:      true,
        phone:      true,
        role:       true,
        avatar:     true,
        isVerified: true,
        isBlocked:  true,
        createdAt:  true,
      },
    })

    // Clean up verification flags
    if (cleanPhone) await cache.del(`verified:phone:${cleanPhone}`)
    if (cleanEmail) await cache.del(`verified:email:${cleanEmail}`)

    // ── Generate tokens ───────────────────────────────────────────────────
    const accessToken  = generateAccessToken(user)
    const refreshToken = generateRefreshToken({ id: user.id })

    const response = successResponse(
      { user, accessToken, refreshToken },
      'Account created successfully',
      201
    )

    response.headers.set(
      'Set-Cookie',
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax`
    )

    return response
  } catch (err) {
    console.error('Register error:', err)
    return errorResponse(err.message, 'REGISTER_ERROR', 500)
  }
}