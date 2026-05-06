// src/app/api/auth/otp/verify/route.js

import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { cache } from '@/lib/cache'
import { generateAccessToken, generateRefreshToken } from '@/lib/utils/jwt'
import prisma from '@/lib/prisma'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { phone, email, otp, purpose } = body

    if (!otp || otp.toString().length !== 6) {
      return errorResponse('OTP must be 6 digits', 'INVALID_OTP', 400)
    }

    if (!phone && !email) {
      return errorResponse('Phone or email is required', 'MISSING_FIELD', 400)
    }

    // ── Phone OTP verify ──────────────────────────────────────────────────
    if (phone) {
      const cleaned   = phone.toString().replace(/\D/g, '')
      const cacheKey  = `otp:phone:${cleaned}`
      const storedOtp = await cache.get(cacheKey)

      if (!storedOtp) {
        return errorResponse(
          'OTP expired or not found. Please request a new one.',
          'OTP_EXPIRED',
          400
        )
      }

      if (storedOtp.toString() !== otp.toString()) {
        return errorResponse('Incorrect OTP. Please try again.', 'INVALID_OTP', 400)
      }

      // Delete used OTP
      await cache.del(cacheKey)

      // ── purpose = verify_only → registration flow ──────────────────────
      if (purpose === 'verify_only') {
        await cache.set(`verified:phone:${cleaned}`, '1', 600) // 10 min
        return successResponse(
          { verified: true, phone: cleaned },
          'Phone number verified'
        )
      }

      // ── Full login flow ────────────────────────────────────────────────
      let user = await prisma.user.findUnique({
        where: { phone: cleaned },
      })

      if (!user) {
        // Auto-create account for new users
        user = await prisma.user.create({
          data: {
            name:       `User ${cleaned.slice(-4)}`,
            phone:      cleaned,
            role:       'user',
            isVerified: true,
            wallet:     { balance: 0 },
          },
        })
      } else if (!user.isVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data:  { isVerified: true },
        })
      }

      if (user.isBlocked) {
        return errorResponse('Account is blocked. Contact support.', 'BLOCKED', 403)
      }

      const safeUser = {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        phone:      user.phone,
        role:       user.role,
        avatar:     user.avatar,
        isVerified: user.isVerified,
        isBlocked:  user.isBlocked,
      }

      const accessToken  = generateAccessToken(safeUser)
      const refreshToken = generateRefreshToken({ id: user.id })

      const response = successResponse(
        { user: safeUser, accessToken, refreshToken },
        'Login successful'
      )

      response.headers.set(
        'Set-Cookie',
        `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax`
      )

      return response
    }

    // ── Email OTP verify ──────────────────────────────────────────────────
    if (email) {
      const cleaned   = email.trim().toLowerCase()
      const cacheKey  = `otp:email:${cleaned}`
      const storedOtp = await cache.get(cacheKey)

      if (!storedOtp) {
        return errorResponse(
          'OTP expired or not found. Please request a new one.',
          'OTP_EXPIRED',
          400
        )
      }

      if (storedOtp.toString() !== otp.toString()) {
        return errorResponse('Incorrect OTP. Please try again.', 'INVALID_OTP', 400)
      }

      // Delete used OTP
      await cache.del(cacheKey)

      // ── purpose = verify_only → registration flow ──────────────────────
      if (purpose === 'verify_only') {
        await cache.set(`verified:email:${cleaned}`, '1', 600)
        return successResponse(
          { verified: true, email: cleaned },
          'Email address verified'
        )
      }

      // ── Full login flow ────────────────────────────────────────────────
      let user = await prisma.user.findUnique({
        where: { email: cleaned },
      })

      if (!user) {
        // Auto-create account
        user = await prisma.user.create({
          data: {
            name:       cleaned.split('@')[0],
            email:      cleaned,
            role:       'user',
            isVerified: true,
            wallet:     { balance: 0 },
          },
        })
      } else if (!user.isVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data:  { isVerified: true },
        })
      }

      if (user.isBlocked) {
        return errorResponse('Account is blocked. Contact support.', 'BLOCKED', 403)
      }

      const safeUser = {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        phone:      user.phone,
        role:       user.role,
        avatar:     user.avatar,
        isVerified: user.isVerified,
        isBlocked:  user.isBlocked,
      }

      const accessToken  = generateAccessToken(safeUser)
      const refreshToken = generateRefreshToken({ id: user.id })

      const response = successResponse(
        { user: safeUser, accessToken, refreshToken },
        'Login successful'
      )

      response.headers.set(
        'Set-Cookie',
        `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax`
      )

      return response
    }
  } catch (err) {
    console.error('OTP verify error:', err)
    return errorResponse(err.message, 'OTP_ERROR', 500)
  }
}