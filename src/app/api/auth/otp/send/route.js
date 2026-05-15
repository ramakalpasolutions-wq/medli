import { NextResponse }     from 'next/server'
import { withRateLimit }    from '@/lib/middleware/rateLimit.middleware'
import { validatePhone, validateEmail } from '@/lib/utils/validators'
import { sendOtp }          from '@/lib/utils/msg91'
import { sendEmailOtp }     from '@/lib/utils/emailOtp'

export async function POST(request) {
  return withRateLimit(request, 'otp', async () => {
    try {
      const body  = await request.json()
      const phone = String(body?.phone || '').trim()
      const email = String(body?.email || '').trim().toLowerCase()

      // ── Must have phone or email ─────────────────────────────────
      if (!phone && !email) {
        return NextResponse.json(
          { success: false, error: 'Phone number or email is required' },
          { status: 400 }
        )
      }

      // ─────────────────────────────────────────────────────────────
      // EMAIL OTP
      // ─────────────────────────────────────────────────────────────
      if (email) {
        if (!validateEmail(email)) {
          return NextResponse.json(
            { success: false, error: 'Invalid email address' },
            { status: 400 }
          )
        }

        const result = await sendEmailOtp(email)
        if (!result?.success) {
          return NextResponse.json(
            { success: false, error: result?.error || 'Failed to send email OTP' },
            { status: result?.error?.includes('Too many') ? 429 : 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: `OTP sent to ${email}`,
          channel: 'email',
          ...(result.bypassMode && process.env.NODE_ENV !== 'production' && {
            devOtp: result.devOtp,
            note:   'Email OTP bypass mode active',
          }),
        })
      }

      // ─────────────────────────────────────────────────────────────
      // PHONE OTP
      // ─────────────────────────────────────────────────────────────
      if (!validatePhone(phone)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number. Must be 10 digits starting with 6-9' },
          { status: 400 }
        )
      }

      const result = await sendOtp(phone)
      if (!result?.success) {
        return NextResponse.json(
          { success: false, error: result?.error || 'Failed to send OTP' },
          { status: result?.error?.includes('Too many') ? 429 : 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `OTP sent to ${phone}`,
        channel: 'sms',
        ...(result.bypassMode && process.env.NODE_ENV !== 'production' && {
          devOtp: result.devOtp,
          note:   'MSG91 bypass mode active',
        }),
      })

    } catch (error) {
      console.error('[POST /api/auth/otp/send]', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}