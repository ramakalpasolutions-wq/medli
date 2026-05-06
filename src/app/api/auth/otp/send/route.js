// src/app/api/auth/otp/send/route.js

import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { cache } from '@/lib/cache'
import { generateOTP } from '@/lib/utils/helpers'
import { smsQueue, emailQueue } from '@/lib/queues/setup'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    const body  = await request.json()
    const { phone, email } = body

    if (!phone && !email) {
      return errorResponse('Phone or email is required', 'MISSING_FIELD', 400)
    }

    const otp = generateOTP()

    // ── Phone OTP ─────────────────────────────────────────────────────────
    if (phone) {
      const cleaned = phone.toString().replace(/\D/g, '')
      if (cleaned.length !== 10) {
        return errorResponse('Invalid 10-digit phone number', 'INVALID_PHONE', 400)
      }

      // Rate limit: max 3 per 10 min
      const rateKey  = `otp_rate:phone:${cleaned}`
      const attempts = await cache.get(rateKey)
      if (attempts && parseInt(attempts) >= 3) {
        return errorResponse(
          'Too many OTP requests. Please wait 10 minutes.',
          'RATE_LIMIT',
          429
        )
      }

      await cache.set(`otp:phone:${cleaned}`, otp, 300)              // 5 min
      await cache.set(rateKey, String(parseInt(attempts || 0) + 1), 600) // 10 min

      await smsQueue.add('send_otp', {
        phone:      cleaned,
        otp,
        templateId: process.env.MSG91_TEMPLATE_ID_OTP,
      })

      // Dev only — remove in production
      console.log(`[OTP] Phone +91${cleaned} → ${otp}`)

      return successResponse({ channel: 'phone' }, 'OTP sent to your mobile number')
    }

    // ── Email OTP ─────────────────────────────────────────────────────────
    if (email) {
      const cleaned = email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
        return errorResponse('Invalid email address', 'INVALID_EMAIL', 400)
      }

      // Rate limit: max 3 per 10 min
      const rateKey  = `otp_rate:email:${cleaned}`
      const attempts = await cache.get(rateKey)
      if (attempts && parseInt(attempts) >= 3) {
        return errorResponse(
          'Too many OTP requests. Please wait 10 minutes.',
          'RATE_LIMIT',
          429
        )
      }

      await cache.set(`otp:email:${cleaned}`, otp, 300)
      await cache.set(rateKey, String(parseInt(attempts || 0) + 1), 600)

      await emailQueue.add('send_otp_email', { email: cleaned, otp })

      // Dev only — remove in production
      console.log(`[OTP] Email ${cleaned} → ${otp}`)

      return successResponse({ channel: 'email' }, 'OTP sent to your email address')
    }
  } catch (err) {
    console.error('OTP send error:', err)
    return errorResponse(err.message, 'OTP_ERROR', 500)
  }
}