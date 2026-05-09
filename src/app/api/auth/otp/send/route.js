import { NextResponse }  from 'next/server'
import { withRateLimit } from '@/lib/middleware/rateLimit.middleware'
import { validatePhone } from '@/lib/utils/validators'

export async function POST(request) {
  return withRateLimit(request, 'otp', async () => {
    try {
      const { phone } = await request.json()

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

      const { sendOtp } = await import('@/lib/utils/msg91')
      const result = await sendOtp(String(phone).trim())

      if (!result?.success) {
        return NextResponse.json(
          { success: false, error: result?.error || 'Failed to send OTP' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `OTP sent to ${phone}`,
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