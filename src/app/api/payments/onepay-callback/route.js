// src/app/api/payments/onepay-callback/route.js
// PUBLIC — No auth required
// 1Pay POSTs encrypted respData here after payment

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { processCallback } from '@/lib/services/payment.service'

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// ── GET: browser test / 1Pay redirect ────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const respData = searchParams.get('respData') || searchParams.get('encRespData')
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL

  // No respData → simple JSON ping
  if (!respData) {
    return Response.json({
      success: true,
      message: '1Pay callback endpoint is active',
      method:  'GET',
      info:    '1Pay will POST to this URL after payment',
      url:     `${appUrl}/api/payments/onepay-callback`,
    })
  }

  // Has respData — process it
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
    console.error('[1Pay Callback GET Error]', err)
    return Response.redirect(`${appUrl}/payment/error`, 302)
  }
}

// ── POST: 1Pay sends payment result here ─────────────────────────────────────
export async function POST(request) {
  console.log('[1Pay Callback] POST received')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  try {
    const contentType = request.headers.get('content-type') || ''
    let respData = null

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text   = await request.text()
      const params = new URLSearchParams(text)
      respData     = params.get('respData') || params.get('encRespData')
      console.log('[1Pay Callback] Form keys:', [...params.keys()])

    } else if (contentType.includes('application/json')) {
      const body = await request.json()
      respData   = body.respData || body.encRespData
      console.log('[1Pay Callback] JSON keys:', Object.keys(body))

    } else {
      const text = await request.text()
      console.log('[1Pay Callback] Raw body (first 200):', text.substring(0, 200))
      try {
        const body = JSON.parse(text)
        respData   = body.respData || body.encRespData
      } catch {
        const params = new URLSearchParams(text)
        respData     = params.get('respData') || params.get('encRespData')
      }
    }

    if (!respData) {
      console.error('[1Pay Callback] No respData in POST body')
      return Response.json({
        success: false,
        error:   'Missing respData',
      }, { status: 200 })
    }

    console.log('[1Pay Callback] respData length:', respData.length)

    const result = await processCallback(respData)

    const platform = request.headers.get('x-platform')
    if (platform === 'flutter') {
      return Response.json({ success: result.success, ...result })
    }

    if (result.success) {
      console.log('[1Pay] SUCCESS → bookingId:', result.bookingId)
      return Response.redirect(
        `${appUrl}/user/bookings/${result.bookingId}/success`, 302
      )
    }

    if (result.reason === 'pending') {
      console.log('[1Pay] PENDING → bookingId:', result.bookingId)
      return Response.redirect(
        `${appUrl}/user/bookings/${result.bookingId}/pending`, 302
      )
    }

    console.log('[1Pay] FAILED → bookingId:', result.bookingId)
    return Response.redirect(
      `${appUrl}/user/bookings/${result.bookingId}/failed`, 302
    )

  } catch (err) {
    console.error('[1Pay Callback POST Error]', err.message)
    return Response.json({
      success: false,
      error:   err.message,
    }, { status: 200 })
  }
}