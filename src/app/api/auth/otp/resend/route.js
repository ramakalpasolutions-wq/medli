import { NextResponse }  from 'next/server'
import { withRateLimit } from '@/lib/middleware/rateLimit.middleware'
import { validatePhone } from '@/lib/utils/validators'
import { resendOtp }     from '@/lib/utils/msg91'

export async function POST(request) {
  return withRateLimit(request, 'otp', async () => {
    try {
      const body       = await request.json()
      const phone      = String(body?.phone      || '').trim()
      const retryType  = body?.retryType === 'voice' ? 'voice' : 'text'

      if (!phone) {
        return NextResponse.json(
          { success: false, error: 'Phone number is required' },
          { status: 400 }
        )
      }
      if (!validatePhone(phone)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number' },
          { status: 400 }
        )
      }

      const result = await resendOtp(phone, retryType)

      if (!result?.success) {
        return NextResponse.json(
          { success: false, error: result?.error || 'Failed to resend OTP' },
          { status: result?.error?.includes('Too many') ? 429 : 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `OTP resent to ${phone}`,
      })

    } catch (error) {
      console.error('[POST /api/auth/otp/resend]', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}