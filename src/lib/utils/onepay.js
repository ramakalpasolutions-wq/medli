// src/lib/utils/onepay.js

import crypto from 'crypto'
import axios from 'axios'

// ── Env ──────────────────────────────────────────────────────────────────────
const MERCHANT_ID = (process.env.ONE_PAY_MERCHANT_ID || '').trim()
const API_KEY     = (process.env.ONE_PAY_API_KEY || '').trim()
const SECRET_KEY  = (process.env.ONE_PAY_SECRET_KEY || '').trim()

// IV = first 16 chars of API KEY
const SECRET_IV = API_KEY.substring(0, 16)

// ─────────────────────────────────────────────────────────────────────────────
// API URLS
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE =
  process.env.ONE_PAY_API_BASE_UAT ||
  'https://pa-preprod.1pay.in'

const PAY_PAGE_URL =
  process.env.ONE_PAY_PAY_PAGE_UAT ||
  'https://pa-preprod.1pay.in/payment/payprocessorV2'

const APP_URL =
  (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    .replace(/\/+$/, '')

console.log('[1Pay] API_BASE:', API_BASE)
console.log('[1Pay] PAY_PAGE_URL:', PAY_PAGE_URL)
console.log('[1Pay] APP_URL:', APP_URL)

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE
// ─────────────────────────────────────────────────────────────────────────────
function validateKeys() {
  const issues = []

  if (!API_KEY) {
    issues.push('ONE_PAY_API_KEY missing')
  }

  if (!SECRET_KEY) {
    issues.push('ONE_PAY_SECRET_KEY missing')
  }

  if (SECRET_KEY.length !== 32) {
    issues.push(
      `ONE_PAY_SECRET_KEY must be 32 chars. Got ${SECRET_KEY.length}`
    )
  }

  if (!MERCHANT_ID) {
    issues.push('ONE_PAY_MERCHANT_ID missing')
  }

  if (issues.length > 0) {
    throw new Error(issues.join('\n'))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCRYPT
// ─────────────────────────────────────────────────────────────────────────────
export function onePayEncrypt(data) {
  validateKeys()

  const keyBuf = Buffer.from(SECRET_KEY, 'utf8')
  const ivBuf  = Buffer.from(SECRET_IV, 'utf8')

  const text =
    typeof data === 'object'
      ? JSON.stringify(data)
      : String(data)

  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    keyBuf,
    ivBuf
  )

  cipher.setAutoPadding(true)

  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  console.log('[1Pay Encrypt] Success')

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

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  console.log('[1Pay Decrypt RAW]', decrypted)

  // Try JSON
  try {
    const json = JSON.parse(decrypted)

    console.log('[1Pay Decrypt JSON]', json)

    return json
  } catch {}

  // Try query parsing
  try {
    const qs = decrypted
      .replace(/\|/g, '&')
      .replace(/,\s*/g, '&')

    const params = new URLSearchParams(qs)

    const obj = Object.fromEntries(params.entries())

    console.log('[1Pay Decrypt Parsed]', obj)

    return obj
  } catch (err) {
    console.error('[1Pay Decrypt Parse Error]', err.message)

    return { raw: decrypted }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TXN ID
// ─────────────────────────────────────────────────────────────────────────────
export function generateTxnId(bookingId = '') {
  const short = bookingId.slice(-6).toUpperCase()

  const ts = Date.now().toString(36).toUpperCase()

  const rand = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()

  return `MED-${short}-${ts}-${rand}`
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE
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
    custMail: String(custMail || 'customer@test.com'),

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

  console.log('[1Pay Payload]', payload)

  return payload
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY TRANSACTION
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyTransaction(txnId) {
  console.log('[1Pay Verify] txnId:', txnId)

  const url = `${API_BASE}/payment/getTxnDetails`

  try {
    const body = new URLSearchParams({
      merchantId: MERCHANT_ID,
      txnId: String(txnId),
    }).toString()

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000,
    })

    console.log('[1Pay Verify RAW]', response.data)

    const raw =
      typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data)

    const qs = raw
      .replace(/\|/g, '&')
      .replace(/,\s*/g, '&')

    const params = new URLSearchParams(qs)

    const obj = Object.fromEntries(params.entries())

    console.log('[1Pay Verify Parsed]', obj)

    return obj

  } catch (err) {
    console.error('[1Pay Verify Error]', err.message)

    if (err.response) {
      console.error(err.response.data)
    }

    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP STATUS
// ─────────────────────────────────────────────────────────────────────────────
export function mapStatus(onePayStatus) {
  if (!onePayStatus) {
    console.log('[1Pay mapStatus] No status found')
    return 'pending'
  }

  const status =
    String(onePayStatus)
      .trim()
      .toUpperCase()

  console.log('[1Pay mapStatus] RAW:', onePayStatus)
  console.log('[1Pay mapStatus] NORMALIZED:', status)

  const map = {
    OK: 'success',
    SUCCESS: 'success',
    S: 'success',

    FAILED: 'failure',
    FAILURE: 'failure',
    F: 'failure',

    TIMEOUT: 'timeout',
    TO: 'timeout',

    PENDING: 'pending',
    P: 'pending',
  }

  return map[status] || 'pending'
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