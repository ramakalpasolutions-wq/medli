// src/lib/utils/onepay.js

import crypto from 'crypto'
import axios from 'axios'

// ─────────────────────────────────────────────────────────────────────────────
// ENV
// ─────────────────────────────────────────────────────────────────────────────

const MERCHANT_ID = (process.env.ONE_PAY_MERCHANT_ID || '').trim()
const API_KEY     = (process.env.ONE_PAY_API_KEY || '').trim()
const SECRET_KEY  = (process.env.ONE_PAY_SECRET_KEY || '').trim()

// IV = first 16 chars of API_KEY
const SECRET_IV = API_KEY.substring(0, 16)

const API_BASE =
  process.env.ONE_PAY_API_BASE_UAT ||
  'https://pa-preprod.1pay.in'

const PAY_PAGE_URL =
  process.env.ONE_PAY_PAY_PAGE_UAT ||
  'https://pa-preprod.1pay.in/payment/payprocessorV2'

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'
).replace(/\/+$/, '')

console.log('[1Pay] API_BASE:', API_BASE)
console.log('[1Pay] PAY_PAGE_URL:', PAY_PAGE_URL)
console.log('[1Pay] APP_URL:', APP_URL)

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE KEYS
// ─────────────────────────────────────────────────────────────────────────────

function validateKeys() {
  const issues = []

  if (!MERCHANT_ID) {
    issues.push('ONE_PAY_MERCHANT_ID missing')
  }

  if (!API_KEY) {
    issues.push('ONE_PAY_API_KEY missing')
  }

  if (API_KEY.length < 16) {
    issues.push('ONE_PAY_API_KEY must be minimum 16 chars')
  }

  if (!SECRET_KEY) {
    issues.push('ONE_PAY_SECRET_KEY missing')
  }

  if (SECRET_KEY.length !== 32) {
    issues.push('ONE_PAY_SECRET_KEY must be exactly 32 chars')
  }

  if (issues.length) {
    const msg = issues.join('\n')
    console.error(msg)
    throw new Error(msg)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCRYPT
// ─────────────────────────────────────────────────────────────────────────────

export function onePayEncrypt(data) {
  validateKeys()

  const keyBuf = Buffer.from(SECRET_KEY, 'utf8')
  const ivBuf  = Buffer.from(SECRET_IV, 'utf8')

  const plainText =
    typeof data === 'object'
      ? JSON.stringify(data)
      : String(data)

  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    keyBuf,
    ivBuf
  )

  cipher.setAutoPadding(true)

  let encrypted = cipher.update(
    plainText,
    'utf8',
    'base64'
  )

  encrypted += cipher.final('base64')

  console.log('[1Pay][Encrypt] Success')

  return encrypted
}

// ─────────────────────────────────────────────────────────────────────────────
// DECRYPT
// ─────────────────────────────────────────────────────────────────────────────

export function onePayDecrypt(ciphertext) {
  validateKeys()

  const keyBuf = Buffer.from(SECRET_KEY, 'utf8')
  const ivBuf  = Buffer.from(SECRET_IV, 'utf8')

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    keyBuf,
    ivBuf
  )

  decipher.setAutoPadding(true)

  let decrypted = decipher.update(
    ciphertext,
    'base64',
    'utf8'
  )

  decrypted += decipher.final('utf8')

  console.log('[1Pay][Decrypt] Raw:', decrypted)

  // Try JSON
  try {
    return JSON.parse(decrypted)
  } catch {}

  // Try querystring
  try {
    const normalized = decrypted
      .replace(/,\s*/g, '&')
      .replace(/\r/g, '')
      .replace(/\n/g, '&')

    const params = new URLSearchParams(normalized)

    const obj = {}

    for (const [key, value] of params.entries()) {
      obj[key.trim()] = value.trim()
    }

    return obj
  } catch {}

  return { raw: decrypted }
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE TXN ID
// ─────────────────────────────────────────────────────────────────────────────

export function generateTxnId(bookingId = '') {
  const short = bookingId.slice(-6).toUpperCase()
  const ts    = Date.now().toString(36).toUpperCase()
  const rand  = Math.random().toString(36).substring(2, 6).toUpperCase()

  return `MED-${short}-${ts}-${rand}`
}

// ─────────────────────────────────────────────────────────────────────────────
// GET DATETIME
// ─────────────────────────────────────────────────────────────────────────────

export function getDateTime() {
  const now = new Date()

  const pad = (n) => String(n).padStart(2, '0')

  return (
    `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD PAYLOAD
// ─────────────────────────────────────────────────────────────────────────────

export function buildOnePayPayload({
  txnId,
  amount,
  custMobile,
  custMail,
  returnURL,
  udf1 = 'NA',
  udf2 = 'NA',
}) {
  const payload = {
    merchantId: MERCHANT_ID,
    apiKey: API_KEY,

    txnId: String(txnId),

    amount: parseFloat(amount).toFixed(2),

    dateTime: getDateTime(),

    custMobile: String(custMobile || '9999999999'),
    custMail: String(custMail || 'customer@medli.in'),

    channelId: '0',
    txnType: 'DIRECT',

    returnURL: String(returnURL),

    productId: 'DEFAULT',

    isMultiSettlement: '0',

    udf1: String(udf1),
    udf2: String(udf2),
    udf3: 'NA',
    udf4: 'NA',
    udf5: 'NA',
    udf6: 'NA',

    instrumentId: 'NA',
    cardDetails: 'NA',
    cardType: 'NA',
  }

  console.log('[1Pay][Payload]', payload)

  return payload
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY TRANSACTION
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyTransaction(txnId) {
  console.log('[1Pay][Verify] txnId:', txnId)

  const url = `${API_BASE}/payment/getTxnDetails`

  try {
    const body = new URLSearchParams({
      merchantId: MERCHANT_ID,
      txnId: String(txnId),
    }).toString()

    const res = await axios.post(url, body, {
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded',
      },
      timeout: 30000,
    })

    console.log('[1Pay][Verify] Raw:', res.data)

    const raw =
      typeof res.data === 'string'
        ? res.data
        : JSON.stringify(res.data)

    const normalized = raw
      .replace(/,\s*/g, '&')
      .replace(/\r/g, '')
      .replace(/\n/g, '&')

    const params = new URLSearchParams(normalized)

    const obj = {}

    for (const [key, value] of params.entries()) {
      obj[key.trim()] = value.trim()
    }

    console.log('[1Pay][Verify] Parsed:', obj)

    return obj

  } catch (err) {
    console.error('[1Pay][Verify] Error:', err.message)

    if (err.code === 'ECONNABORTED') {
      throw new Error('GATEWAY_TIMEOUT')
    }

    if (err.code === 'ECONNREFUSED') {
      throw new Error('GATEWAY_UNREACHABLE')
    }

    if (err.response) {
      console.error(
        '[1Pay][Verify] HTTP:',
        err.response.status,
        err.response.data
      )

      throw new Error(
        `Gateway HTTP ${err.response.status}`
      )
    }

    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP STATUS
// ─────────────────────────────────────────────────────────────────────────────

export function mapStatus(onePayStatus = '') {
  const status = String(onePayStatus)
    .trim()
    .toLowerCase()

  console.log('[1Pay][mapStatus] RAW:', onePayStatus)
  console.log('[1Pay][mapStatus] NORMALIZED:', status)

  // SUCCESS
  if (
    status === 'ok' ||
    status === 'success' ||
    status === 's' ||
    status === '0300' ||
    status === 'txn_success' ||
    status.includes('success')
  ) {
    return 'success'
  }

  // FAILURE
  if (
    status === 'f' ||
    status === 'failure' ||
    status === 'failed' ||
    status === '0399' ||
    status.includes('fail') ||
    status.includes('declined')
  ) {
    return 'failure'
  }

  // TIMEOUT
  if (
    status === 'to' ||
    status === 'timeout'
  ) {
    return 'timeout'
  }

  // PENDING
  if (
    status === 'pending' ||
    status === 'p'
  ) {
    return 'pending'
  }

  console.warn('[1Pay][mapStatus] Unknown:', onePayStatus)

  return 'pending'
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC POST
// ─────────────────────────────────────────────────────────────────────────────

export async function onePayPost(endpoint, payload) {
  const url = `${API_BASE}${endpoint}`

  try {
    const response = await axios.post(
      url,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    return response.data

  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      throw new Error('GATEWAY_TIMEOUT')
    }

    if (err.code === 'ECONNREFUSED') {
      throw new Error('GATEWAY_UNREACHABLE')
    }

    if (err.response) {
      throw new Error(
        `Gateway HTTP ${err.response.status}`
      )
    }

    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  API_BASE as ONE_PAY_API_BASE,
  PAY_PAGE_URL as ONE_PAY_PAY_PAGE_URL,
  APP_URL as ONE_PAY_APP_URL,
  MERCHANT_ID,
  API_KEY,
}