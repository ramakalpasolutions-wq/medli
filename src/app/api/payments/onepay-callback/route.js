export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { processCallback } from '@/lib/services/payment.service'

// ======================================================
// REDIRECT URL BUILDER
// ======================================================

function getRedirectUrl(
  status,
  bookingId,
  txnId
) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'

  // your actual pages
  if (status === 'success') {
    return `${base}/user/bookings/${bookingId}/success?txnId=${txnId}`
  }

  if (status === 'failure') {
    return `${base}/user/bookings/${bookingId}/failed?txnId=${txnId}`
  }

  return `${base}/user/bookings/${bookingId}/pending?txnId=${txnId}`
}

// ======================================================
// OPTIONS
// ======================================================

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':
        'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type',
    },
  })
}

// ======================================================
// POST CALLBACK
// ======================================================

export async function POST(request) {
  console.log(
    '[1Pay Callback] POST received'
  )

  try {
    const contentType =
      request.headers.get(
        'content-type'
      ) || ''

    let respData = null

    // ======================================================
    // FORM DATA
    // ======================================================

    if (
      contentType.includes(
        'application/x-www-form-urlencoded'
      )
    ) {
      const text =
        await request.text()

      console.log(
        '[1Pay Callback RAW]',
        text
      )

      const params =
        new URLSearchParams(text)

      respData =
        params.get('respData') ||
        params.get('encRespData')
    }

    // ======================================================
    // JSON
    // ======================================================

    else {
      const body =
        await request.json()

      console.log(
        '[1Pay Callback JSON]',
        body
      )

      respData =
        body.respData ||
        body.encRespData
    }

    // ======================================================
    // VALIDATE
    // ======================================================

    if (!respData) {
      console.error(
        '[1Pay Callback] No respData'
      )

      return Response.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment-error`,
        302
      )
    }

    console.log(
      '[1Pay Callback] respData length:',
      respData.length
    )

    // ======================================================
    // PROCESS CALLBACK
    // ======================================================

    const result =
      await processCallback(
        respData
      )

    console.log(
      '[1Pay Callback Result]',
      result
    )

    // ======================================================
    // REDIRECT USER
    // ======================================================

    const redirectUrl =
      getRedirectUrl(
        result.status,
        result.bookingId,
        result.txnId
      )

    console.log(
      '[1Pay Callback Redirect]',
      redirectUrl
    )

    return Response.redirect(
      redirectUrl,
      302
    )

  } catch (error) {
    console.error(
      '[1Pay Callback ERROR]',
      error
    )

    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment-error`,
      302
    )
  }
}

// ======================================================
// GET
// ======================================================

export async function GET() {
  return Response.json({
    success: true,
    message:
      '1Pay callback working',
  })
}