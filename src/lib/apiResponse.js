export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
}

export function successResponse(data, message = '', status = 200) {
  return Response.json(
    {
      success: true,
      data,
      message,
    },
    {
      status,
      headers: corsHeaders,
    }
  )
}

export function errorResponse(error, code = '', status = 400) {
  return Response.json(
    {
      success: false,
      error,
      code,
    },
    {
      status,
      headers: corsHeaders,
    }
  )
}

export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}