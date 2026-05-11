export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { processCallback } from '@/lib/services/payment.service'

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request) {
  console.log('[1Pay Callback] POST received')

  try {
    const contentType = request.headers.get('content-type') || ''
    let respData = null

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text()

      console.log('[1Pay Callback RAW]', text)

      const params = new URLSearchParams(text)

      respData =
        params.get('respData') ||
        params.get('encRespData')

    } else {
      const body = await request.json()

      console.log('[1Pay Callback JSON]', body)

      respData =
        body.respData ||
        body.encRespData
    }

    if (!respData) {
      console.error('[1Pay Callback] No respData')

      return Response.json(
        {
          success: false,
          error: 'No respData',
        },
        { status: 200 }
      )
    }

    console.log(
      '[1Pay Callback] respData length:',
      respData.length
    )

    const result = await processCallback(respData)

    console.log('[1Pay Callback Result]', result)

    return Response.json(
      {
        success: true,
        result,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('[1Pay Callback ERROR]', error)

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 200 }
    )
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: '1Pay callback working',
  })
}