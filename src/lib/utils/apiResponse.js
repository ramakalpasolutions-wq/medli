import { NextResponse } from 'next/server'

export const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age':       '86400',
}

export function successResponse(data, message, status) {
  const msg    = (typeof message === 'string') ? message : 'Success'
  const st     = (typeof message === 'number') ? message
               : (typeof status  === 'number') ? status
               : 200
  const safeSt = (st >= 200 && st <= 599) ? st : 200
  return NextResponse.json(
    { success: true, message: msg, data },
    { status: safeSt, headers: corsHeaders }
  )
}

export function errorResponse(error, codeOrStatus, statusOverride) {
  const message = typeof error === 'string'
    ? error
    : error?.message || 'An error occurred'
  const code    = typeof codeOrStatus === 'string' ? codeOrStatus : ''
  let status    = 400
  if (typeof codeOrStatus  === 'number') status = codeOrStatus
  else if (typeof statusOverride === 'number') status = statusOverride
  const safeSt  = (status >= 200 && status <= 599) ? status : 500
  return NextResponse.json(
    { success: false, error: message, code },
    { status: safeSt, headers: corsHeaders }
  )
}

export function paginatedResponse(data, pagination, entityKey) {
  const key        = (typeof entityKey === 'string' && entityKey) ? entityKey : 'items'
  const total      = pagination?.total      || 0
  const page       = pagination?.page       || 1
  const limit      = pagination?.limit      || 20
  const totalPages = pagination?.totalPages || Math.ceil(total / limit) || 1
  return NextResponse.json(
    {
      success: true,
      message: 'Success',
      data: {
        [key]: Array.isArray(data) ? data : [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    },
    { status: 200, headers: corsHeaders }
  )
}

export function handleOptions() {
  return new NextResponse(null, {
    status:  204,
    headers: corsHeaders,
  })
}

export function serverError(error) {
  console.error('[ServerError]', error)
  return NextResponse.json(
    {
      success: false,
      error:   'Internal server error',
      code:    'SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { detail: error?.message }),
    },
    { status: 500, headers: corsHeaders }
  )
}

export function notFound(message) {
  return NextResponse.json(
    { success: false, error: message || 'Resource not found', code: 'NOT_FOUND' },
    { status: 404, headers: corsHeaders }
  )
}

export function unauthorized(message) {
  return NextResponse.json(
    { success: false, error: message || 'Authentication required', code: 'UNAUTHORIZED' },
    { status: 401, headers: corsHeaders }
  )
}

export function forbidden(message) {
  return NextResponse.json(
    { success: false, error: message || 'Access denied', code: 'FORBIDDEN' },
    { status: 403, headers: corsHeaders }
  )
}

export default {
  successResponse,
  errorResponse,
  paginatedResponse,
  handleOptions,
  serverError,
  notFound,
  unauthorized,
  forbidden,
  corsHeaders,
}