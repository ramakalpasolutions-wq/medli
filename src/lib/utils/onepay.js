// src/lib/utils/onepay.js
// ─────────────────────────────────────────────────────────────────────────────
// 1Pay Payment Gateway Utility
//
// CONFIRMED KEY FORMAT:
//   SECRET_KEY : 32 UTF-8 chars  → 32 bytes → AES-256
//   SECRET_IV  : 16 UTF-8 chars  → 16 bytes → AES-CBC IV
//   Encoding   : NOT hex — plain alphanumeric strings
//   Algorithm  : AES-256-CBC
//   Output     : Base64
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto'
import axios  from 'axios'

// ── Read env vars — trim whitespace/newlines ──────────────────────────────────
const MERCHANT_ID = (process.env.ONE_PAY_MERCHANT_ID  || '').trim()
const API_KEY     = (process.env.ONE_PAY_API_KEY       || '').trim()
const SECRET_KEY  = (process.env.ONE_PAY_SECRET_KEY    || '').trim()
const SECRET_IV   = (process.env.ONE_PAY_SECRET_IV     || '').trim()

const IS_PROD  = process.env.NODE_ENV === 'production'
const API_BASE = IS_PROD
  ? (process.env.ONE_PAY_API_BASE_PROD || 'https://pay.1pay.in')
  : (process.env.ONE_PAY_API_BASE_UAT  || 'https://pa-preprod.1pay.in')

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  .replace(/\/+$/, '')

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE KEYS
// KEY  must be exactly 32 UTF-8 chars (= 32 bytes for AES-256)
// IV   must be exactly 16 UTF-8 chars (= 16 bytes for AES block size)
// ─────────────────────────────────────────────────────────────────────────────
function validateKeys() {
  const issues = []

  if (!SECRET_KEY) {
    issues.push('ONE_PAY_SECRET_KEY is not set')
  } else if (SECRET_KEY.length !== 32) {
    issues.push(
      `ONE_PAY_SECRET_KEY must be exactly 32 chars (got ${SECRET_KEY.length}). ` +
      `32 UTF-8 chars = 32 bytes = AES-256`
    )
  }

  if (!SECRET_IV) {
    issues.push('ONE_PAY_SECRET_IV is not set')
  } else if (SECRET_IV.length !== 16) {
    issues.push(
      `ONE_PAY_SECRET_IV must be exactly 16 chars (got ${SECRET_IV.length}). ` +
      `16 UTF-8 chars = 16 bytes = AES block size`
    )
  }

  if (!MERCHANT_ID) {
    issues.push('ONE_PAY_MERCHANT_ID is not set')
  }

  if (!API_KEY) {
    issues.push('ONE_PAY_API_KEY is not set')
  }

  if (issues.length > 0) {
    const msg = '[1Pay Config]\n' + issues.map(i => '  • ' + i).join('\n')
    console.error(msg)
    throw new Error(msg)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCRYPT — AES-256-CBC
// Key : Buffer.from(SECRET_KEY, 'utf8')  → 32 bytes
// IV  : Buffer.from(SECRET_IV,  'utf8')  → 16 bytes
// Out : Base64 string
// ─────────────────────────────────────────────────────────────────────────────
export function onePayEncrypt(data) {
  validateKeys()

  // ✅ UTF-8 encoding — NOT hex
  const keyBuf = Buffer.from(SECRET_KEY, 'utf8')  // 32 chars → 32 bytes
  const ivBuf  = Buffer.from(SECRET_IV,  'utf8')  // 16 chars → 16 bytes

  console.log('[1Pay][Encrypt] Key:', keyBuf.length, 'bytes | IV:', ivBuf.length, 'bytes')

  const text   = typeof data === 'object' ? JSON.stringify(data) : String(data)
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf)
  cipher.setAutoPadding(true)

  let enc  = cipher.update(text, 'utf8', 'base64')
  enc     += cipher.final('base64')

  console.log('[1Pay][Encrypt] Input length:', text.length, '| Output length:', enc.length)
  return enc
}

// ─────────────────────────────────────────────────────────────────────────────
// DECRYPT — AES-256-CBC
// ─────────────────────────────────────────────────────────────────────────────
export function onePayDecrypt(ciphertext) {
  validateKeys()

  const keyBuf   = Buffer.from(SECRET_KEY, 'utf8')
  const ivBuf    = Buffer.from(SECRET_IV,  'utf8')
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, ivBuf)
  decipher.setAutoPadding(true)

  let dec  = decipher.update(ciphertext, 'base64', 'utf8')
  dec     += decipher.final('utf8')

  console.log('[1Pay][Decrypt] Success, output length:', dec.length)

  try {
    return JSON.parse(dec)
  } catch {
    return dec
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE TRANSACTION ID — unique per attempt
// ─────────────────────────────────────────────────────────────────────────────
export function generateTxnId(bookingId = '') {
  const short = bookingId.slice(-6).toUpperCase()
  const ts    = Date.now().toString(36).toUpperCase()
  const rand  = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `MED-${short}-${ts}-${rand}`
}

// ─────────────────────────────────────────────────────────────────────────────
// GET DATE TIME — format: dd-MM-yyyy HH:mm:ss
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
// BUILD PAYLOAD — exact 1Pay official structure
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
  return {
    merchantId:        MERCHANT_ID,
    apiKey:            API_KEY,
    txnId,
    Amount:            parseFloat(amount).toFixed(2), // Capital A
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
  console.log('[1Pay][POST] Payload keys:', Object.keys(payload))

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })
    console.log('[1Pay][POST] Status:', response.status)
    console.log('[1Pay][POST] Response:', JSON.stringify(response.data).substring(0, 200))
    return response.data
  } catch (err) {
    if (err.code === 'ECONNABORTED') throw new Error('GATEWAY_TIMEOUT')
    if (err.code === 'ECONNREFUSED') throw new Error('GATEWAY_UNREACHABLE')
    if (err.response) {
      console.error('[1Pay][POST] HTTP Error:', err.response.status, err.response.data)
      throw new Error(`Gateway HTTP ${err.response.status}`)
    }
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY TRANSACTION
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyTransaction(txnId) {
  console.log('[1Pay][Verify] txnId:', txnId)

  const verifyPayload = {
    merchantId: MERCHANT_ID,
    apiKey:     API_KEY,
    txnId,
    dateTime:   getDateTime(),
  }

  const reqData = onePayEncrypt(verifyPayload)
  const raw     = await onePayPost('/api/v1/txnStatus', {
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
// MAP STATUS
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
  API_BASE   as ONE_PAY_API_BASE,
  APP_URL    as ONE_PAY_APP_URL,
  MERCHANT_ID,
  API_KEY,
}