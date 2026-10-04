// src/lib/utils/cashfree.js

const DEFAULT_CASHFREE_API_VERSION =
  '2025-01-01'


// ============================================================
// ENVIRONMENT
// ============================================================

export function getCashfreeEnvironment() {
  return process.env.CASHFREE_ENV ===
    'production'
    ? 'production'
    : 'sandbox'
}


// ============================================================
// API BASE URL
// ============================================================

export function getCashfreeBaseUrl() {
  return getCashfreeEnvironment() ===
    'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'
}


// ============================================================
// API VERSION
// ============================================================

export function getCashfreeApiVersion() {
  return (
    process.env
      .CASHFREE_API_VERSION ||
    DEFAULT_CASHFREE_API_VERSION
  )
}


// ============================================================
// VALIDATE CONFIG
// ============================================================

export function validateCashfreeConfig() {
  const appId =
    process.env
      .CASHFREE_APP_ID
      ?.trim()

  const secretKey =
    process.env
      .CASHFREE_SECRET_KEY
      ?.trim()


  if (!appId) {
    throw new Error(
      'CASHFREE_APP_ID is not configured'
    )
  }


  if (!secretKey) {
    throw new Error(
      'CASHFREE_SECRET_KEY is not configured'
    )
  }


  return {
    appId,
    secretKey,
  }
}


// ============================================================
// HEADERS
// ============================================================

export function getCashfreeHeaders(
  extraHeaders = {}
) {
  const {
    appId,
    secretKey,
  } =
    validateCashfreeConfig()


  return {
    'Content-Type':
      'application/json',

    Accept:
      'application/json',

    'x-client-id':
      appId,

    'x-client-secret':
      secretKey,

    'x-api-version':
      getCashfreeApiVersion(),

    ...extraHeaders,
  }
}


// ============================================================
// ORDER ID
// ============================================================

export function generateCashfreeOrderId(
  bookingId
) {
  const cleanBookingId =
    String(
      bookingId || ''
    )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        ''
      )
      .slice(-25)


  if (!cleanBookingId) {
    throw new Error(
      'Booking ID is required to generate Cashfree order ID'
    )
  }


  return (
    `MEDLI_${cleanBookingId}_` +
    `${Date.now()}`
  )
}


// ============================================================
// REQUEST ID
// ============================================================

export function generateCashfreeRequestId(
  prefix = 'medli'
) {
  const cleanPrefix =
    String(
      prefix || 'medli'
    )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        ''
      )
      .slice(-30)


  const randomPart =
    Math.random()
      .toString(36)
      .slice(2, 10)


  return (
    `${cleanPrefix}_` +
    `${Date.now()}_` +
    `${randomPart}`
  )
}


// ============================================================
// PHONE
// ============================================================

export function normalizeCashfreePhone(
  phone
) {
  const digits =
    String(
      phone || ''
    )
      .replace(
        /\D/g,
        ''
      )


  if (
    digits.length >= 10
  ) {
    return digits.slice(-10)
  }


  return digits
}


// ============================================================
// GENERIC CASHFREE REQUEST
// ============================================================

export async function cashfreeRequest(
  endpoint,
  {
    method = 'GET',
    body = null,
    headers = {},
  } = {}
) {
  const baseUrl =
    getCashfreeBaseUrl()


  const cleanEndpoint =
    String(
      endpoint || ''
    ).startsWith('/')
      ? endpoint
      : `/${endpoint}`


  const requestId =
    generateCashfreeRequestId()


  const requestOptions = {
    method,

    headers:
      getCashfreeHeaders({
        'x-request-id':
          requestId,

        ...headers,
      }),

    cache:
      'no-store',
  }


  if (
    body !== null &&
    body !== undefined
  ) {
    requestOptions.body =
      JSON.stringify(
        body
      )
  }


  const response =
    await fetch(
      `${baseUrl}${cleanEndpoint}`,
      requestOptions
    )


  let data = null


  try {
    data =
      await response.json()
  } catch {
    data = null
  }


  if (!response.ok) {
    const error =
      new Error(
        data?.message ||
        data?.type ||
        `Cashfree API request failed with status ${response.status}`
      )


    error.status =
      response.status

    error.cashfreeResponse =
      data

    error.requestId =
      requestId


    throw error
  }


  return data
}