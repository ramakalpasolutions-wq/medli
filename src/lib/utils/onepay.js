// src/lib/utils/onepay.js
// ─────────────────────────────────────────────────────────────────────────────
// 1Pay Payment Gateway Utility
//
// CONFIRMED ENCRYPTION:
//   Algorithm : AES-256-CBC
//   Key       : ONE_PAY_SECRET_KEY as hex → 32 bytes (64 hex chars)
//   IV        : First 16 chars of ONE_PAY_API_KEY as hex → 16 bytes (32 hex chars)
//   Output    : Base64
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto'
import axios  from 'axios'

// ── Env ───────────────────────────────────────────────────────────────────────
const MERCHANT_ID = process.env.ONE_PAY_MERCHANT_ID  || ''
const API_KEY     = process.env.ONE_PAY_API_KEY       || ''
const SECRET_KEY  = process.env.ONE_PAY_SECRET_KEY    || ''

// IV = first 16 chars of API_KEY (as confirmed by 1Pay docs)
// We also support ONE_PAY_SECRET_IV as override
const SECRET_IV   = process.env.ONE_PAY_SECRET_IV
  ? process.env.ONE_PAY_SECRET_IV.trim()
  : API_KEY.trim().substring(0, 32) // first 32 hex chars = 16 bytes

const IS_PROD  = process.env.NODE_ENV === 'production'
const API_BASE = IS_PROD
  ? (process.env.ONE_PAY_API_BASE_PROD || 'https://pay.1pay.in')
  : (process.env.ONE_PAY_API_BASE_UAT  || 'https://pa-preprod.1pay.in')

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  .replace(/\/+$/, '')

// ─────────────────────────────────────────────────────────────────────────────
// ENCRYPT — AES-256-CBC
// ─────────────────────────────────────────────────────────────────────────────
export function onePayEncrypt(data) {
  const keyStr = SECRET_KEY.trim()
  const ivStr  = SECRET_IV.trim()

  // Validate lengths before converting
  if (keyStr.length !== 64) {
    throw new Error(
      `[1Pay] SECRET_KEY must be 64 hex chars (got ${keyStr.length}). ` +
      `Each hex char = 4 bits, 64 hex = 32 bytes = AES-256`
    )
  }
  if (ivStr.length !== 32) {
    throw new Error(
      `[1Pay] IV must be 32 hex chars (got ${ivStr.length}). ` +
      `First 32 hex chars of API_KEY = 16 bytes = AES block size`
    )
  }

  const keyBuf = Buffer.from(keyStr, 'hex') // 64 hex → 32 bytes
  const ivBuf  = Buffer.from(ivStr,  'hex') // 32 hex → 16 bytes

  console.log('[1Pay][Encrypt] Key length:', keyBuf.length, 'bytes (must be 32)')
  console.log('[1Pay][Encrypt] IV  length:', ivBuf.length,  'bytes (must be 16)')
  console.log('[1Pay][Encrypt] IV  source: first 32 hex chars of API_KEY')

  const text   = typeof data === 'object' ? JSON.stringify(data) : String(data)
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf)
  cipher.setAutoPadding(true)

  let enc  = cipher.update(text, 'utf8', 'base64')
  enc     += cipher.final('base64')

  console.log('[1Pay][Encrypt] Input length:', text.length)
  console.log('[1Pay][Encrypt] Output (base64) length:', enc.length)

  return enc
}

// ─────────────────────────────────────────────────────────────────────────────
// DECRYPT — AES-256-CBC
// ─────────────────────────────────────────────────────────────────────────────
export function onePayDecrypt(ciphertext) {
  const keyStr = SECRET_KEY.trim()
  const ivStr  = SECRET_IV.trim()

  const keyBuf   = Buffer.from(keyStr, 'hex')
  const ivBuf    = Buffer.from(ivStr,  'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, ivBuf)
  decipher.setAutoPadding(true)

  let dec  = decipher.update(ciphertext, 'base64', 'utf8')
  dec     += decipher.final('utf8')

  console.log('[1Pay][Decrypt] Decrypted:', dec.substring(0, 200))

  try {
    return JSON.parse(dec)
  } catch {
    return dec
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE TRANSACTION ID
// Format: MED-{bookingShortId}-{timestamp}-{random}
// Must be unique per transaction — never reuse
// ─────────────────────────────────────────────────────────────────────────────
export function generateTxnId(bookingId = '') {
  const short  = bookingId.slice(-6).toUpperCase()     // last 6 chars of bookingId
  const ts     = Date.now().toString(36).toUpperCase() // base36 timestamp
  const rand   = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `MED-${short}-${ts}-${rand}`
}

// ─────────────────────────────────────────────────────────────────────────────
// GET DATE TIME — format: dd-MM-yyyy HH:mm:ss
// ─────────────────────────────────────────────────────────────────────────────
export function getDateTime() {
  const now  = new Date()
  const pad  = (n) => String(n).padStart(2, '0')
  return (
    `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD PAYLOAD — exact structure per 1Pay official sample
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
  if (!MERCHANT_ID) throw new Error('[1Pay] ONE_PAY_MERCHANT_ID is not set')
  if (!API_KEY)     throw new Error('[1Pay] ONE_PAY_API_KEY is not set')

  return {
    merchantId:        MERCHANT_ID,
    apiKey:            API_KEY,
    txnId,
    Amount:            parseFloat(amount).toFixed(2), // capital A, string
    dateTime:          getDateTime(),
    custMobile:        String(custMobile),
    custMail:          custMail || 'customer@medli.in',
    channelId:         0,
    txnType:           'DIRECT',
    returnURL,
    productId:         'DEFAULT',
    isMultiSettlement: 0,
    udf1,
    udf2,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST to 1Pay API
// ─────────────────────────────────────────────────────────────────────────────
export async function onePayPost(endpoint, payload) {
  const url = `${API_BASE}${endpoint}`
  console.log('[1Pay][POST]', url)
  console.log('[1Pay][POST] Payload:', JSON.stringify(payload, null, 2))

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })
    console.log('[1Pay][POST] Response:', JSON.stringify(response.data, null, 2))
    return response.data
  } catch (err) {
    if (err.code === 'ECONNABORTED') throw new Error('GATEWAY_TIMEOUT')
    if (err.code === 'ECONNREFUSED') throw new Error('GATEWAY_UNREACHABLE')
    if (err.response) {
      console.error('[1Pay][POST] HTTP Error:', err.response.status, err.response.data)
      throw new Error(`Gateway HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`)
    }
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY TRANSACTION — check status with 1Pay
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyTransaction(txnId) {
  console.log('[1Pay][Verify] txnId:', txnId)

  const verifyPayload = {
    merchantId: MERCHANT_ID,
    apiKey:     API_KEY,
    txnId,
    dateTime:   getDateTime(),
  }

  const reqData   = onePayEncrypt(verifyPayload)
  const raw       = await onePayPost('/api/v1/txnStatus', {
    merchantId: MERCHANT_ID,
    reqData,
  })

  if (!raw.respData) {
    throw new Error(`[1Pay][Verify] No respData: ${raw.message || JSON.stringify(raw)}`)
  }

  const result = onePayDecrypt(raw.respData)
  console.log('[1Pay][Verify] Result:', result)
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP STATUS — 1Pay status codes → internal
// ─────────────────────────────────────────────────────────────────────────────
export function mapStatus(onePayStatus) {
  const map = {
    Ok:      'success',
    ok:      'success',
    OK:      'success',
    S:       'success',
    success: 'success',
    SUCCESS: 'success',
    F:       'failure',
    failure: 'failure',
    FAILURE: 'failure',
    failed:  'failure',
    FAILED:  'failure',
    To:      'timeout',
    timeout: 'timeout',
    TIMEOUT: 'timeout',
    Pending: 'pending',
    PENDING: 'pending',
    pending: 'pending',
    P:       'pending',
  }
  return map[onePayStatus] || 'pending'
}

export {
  API_BASE  as ONE_PAY_API_BASE,
  APP_URL   as ONE_PAY_APP_URL,
  MERCHANT_ID,
  API_KEY,
}