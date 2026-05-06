// src/app/api/payments/onepay-callback/route.js
// PUBLIC — No auth required
// 1Pay POSTs encrypted respData here after payment

import { processCallback } from '@/lib/services/payment.service'
import { errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  console.log('[1Pay Callback] POST received')

  try {
    const contentType = request.headers.get('content-type') || ''
    let respData = null

    // 1Pay may send as form-urlencoded or JSON
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text   = await request.text()
      const params = new URLSearchParams(text)
      respData     = params.get('respData') || params.get('encRespData')
      console.log('[1Pay Callback] Form-urlencoded, params:', [...params.keys()])
    } else if (contentType.includes('application/json')) {
      const body = await request.json()
      respData   = body.respData || body.encRespData
      console.log('[1Pay Callback] JSON body keys:', Object.keys(body))
    } else {
      const text = await request.text()
      console.log('[1Pay Callback] Raw body:', text.substring(0, 200))
      try {
        const body = JSON.parse(text)
        respData   = body.respData || body.encRespData
      } catch {
        const params = new URLSearchParams(text)
        respData     = params.get('respData') || params.get('encRespData')
      }
    }

    if (!respData) {
      console.error('[1Pay Callback] No respData found in request')
      return errorResponse('Missing respData', 'MISSING_RESP_DATA', 400)
    }

    console.log('[1Pay Callback] respData length:', respData.length)

    const result = await processCallback(respData)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // Flutter/mobile: return JSON
    const platform = request.headers.get('x-platform')
    if (platform === 'flutter') {
      return Response.json({ success: result.success, ...result })
    }

    // Web: redirect to result page
    if (result.success) {
      console.log('[1Pay Callback] SUCCESS → redirecting to success page')
      return Response.redirect(
        `${appUrl}/user/bookings/${result.bookingId}/success`, 302
      )
    }

    if (result.reason === 'pending') {
      console.log('[1Pay Callback] PENDING → redirecting to pending page')
      return Response.redirect(
        `${appUrl}/user/bookings/${result.bookingId}/pending`, 302
      )
    }

    console.log('[1Pay Callback] FAILED → redirecting to failed page')
    return Response.redirect(
      `${appUrl}/user/bookings/${result.bookingId}/failed`, 302
    )
  } catch (err) {
    console.error('[1Pay Callback] Processing error:', err.message)
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/error`, 302
    )
  }
}

// Handle GET callback (some gateways use GET)
export async function GET(request) {
  console.log('[1Pay Callback] GET received')

  const { searchParams } = new URL(request.url)
  const respData = searchParams.get('respData') || searchParams.get('encRespData')
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL

  if (!respData) {
    return Response.redirect(`${appUrl}/payment/error`, 302)
  }

  try {
    const result = await processCallback(respData)

    if (result.success) {
      return Response.redirect(
        `${appUrl}/user/bookings/${result.bookingId}/success`, 302
      )
    }
    if (result.reason === 'pending') {
      return Response.redirect(
        `${appUrl}/user/bookings/${result.bookingId}/pending`, 302
      )
    }
    return Response.redirect(
      `${appUrl}/user/bookings/${result.bookingId}/failed`, 302
    )
  } catch (err) {
    console.error('[1Pay Callback] GET error:', err.message)
    return Response.redirect(`${appUrl}/payment/error`, 302)
  }
}