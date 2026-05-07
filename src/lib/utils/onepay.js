// src/lib/utils/onepay.js

import crypto from 'crypto'
import axios  from 'axios'

// ── Env — trim all whitespace ─────────────────────────────────────────────────
const MERCHANT_ID = (process.env.ONE_PAY_MERCHANT_ID || '').trim()
const API_KEY     = (process.env.ONE_PAY_API_KEY     || '').trim()
const SECRET_KEY  = (process.env.ONE_PAY_SECRET_KEY  || '').trim()

// ── IV = first 16 characters of API_KEY ──────────────────────────────────────
// ju8aQ9Oo8dH8UX2Nb4VG2sv9MN7lv3Xa
// ↑──────────────────↑
// first 16 chars = ju8aQ9Oo8dH8UX2N = IV
const SECRET_IV = API_KEY.substring(0, 16)

const IS_PROD = process.env.NODE_ENV === 'production'

// ── API base (server-to-server) ───────────────────────────────────────────────
const API_BASE =
  process.env.ONE_PAY_API_BASE_UAT ||
  'https://pa-preprod.1pay.in'

// ── Payment PAGE (where user is sent to enter card/UPI details) ───────────────
const PAY_PAGE_URL =
  process.env.ONE_PAY_PAY_PAGE_UAT ||
  'https://pa-preprod.1pay.in/payment/payprocessorV2'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  .replace(/\/+$/, '')
console.log('[1Pay] API_BASE:', API_BASE)

console.log('[1Pay] PAY_PAGE_URL:', PAY_PAGE_URL)

console.log('[1Pay] APP_URL:', APP_URL)
// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE KEYS
// ─────────────────────────────────────────────────────────────────────────────
function validateKeys() {
  const issues = []

  if (!API_KEY) {
    issues.push('ONE_PAY_API_KEY is not set')
  } else if (API_KEY.length < 16) {
    issues.push(
      `ONE_PAY_API_KEY must be at least 16 chars (got ${API_KEY.length}). ` +
      `First 16 chars are used as IV`
    )
  }

  if (!SECRET_KEY) {
    issues.push('ONE_PAY_SECRET_KEY is not set')
  } else if (SECRET_KEY.length !== 32) {
    issues.push(
      `ONE_PAY_SECRET_KEY must be exactly 32 chars (got ${SECRET_KEY.length}). ` +
      `32 UTF-8 chars = 32 bytes = AES-256`
    )
  }

  if (!MERCHANT_ID) {
    issues.push('ONE_PAY_MERCHANT_ID is not set')
  }

  if (issues.length > 0) {
    const msg = '[1Pay Config Error]\n' + issues.map(i => '  • ' + i).join('\n')
    console.error(msg)
    throw new Error(msg)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCRYPT — AES-256-CBC
// Key : Buffer.from(SECRET_KEY, 'utf8') → 32 bytes
// IV  : Buffer.from(API_KEY.substring(0,16), 'utf8') → 16 bytes
// Out : Base64
// ─────────────────────────────────────────────────────────────────────────────
export function onePayEncrypt(data) {
  validateKeys()

  const keyBuf = Buffer.from(SECRET_KEY, 'utf8') // 32 chars → 32 bytes
  const ivBuf  = Buffer.from(SECRET_IV,  'utf8') // 16 chars → 16 bytes

  console.log('[1Pay][Encrypt] Key:', keyBuf.length, 'bytes | IV:', ivBuf.length, 'bytes')
  console.log('[1Pay][Encrypt] IV source: first 16 chars of API_KEY =', SECRET_IV)

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

  console.log('[1Pay][Decrypt] Output length:', dec.length)

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
// GET DATE TIME — dd-MM-yyyy HH:mm:ss
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

  // ── IMPORTANT ─────────────────────────────────────────────
  // 1Pay is VERY strict about:
  // - exact field names
  // - exact datatypes
  // - mandatory NA fields
  // - DIRECT flow structure
  // ──────────────────────────────────────────────────────────

  const payload = {

    // Merchant Credentials
    merchantId: MERCHANT_ID,

    apiKey: API_KEY,

    // Transaction
    txnId: String(txnId),

    // IMPORTANT: Capital A
    amount: parseFloat(amount).toFixed(2),

    // Format: dd-MM-yyyy HH:mm:ss
    dateTime: getDateTime(),

    // Customer
    custMobile: String(custMobile || '9999999999'),

    custMail: String(
      custMail || 'customer@medli.in'
    ),

    // IMPORTANT:
    // Docs expect STRING values
    channelId: '0',

    // IMPORTANT:
    // Must be DIRECT
    txnType: 'DIRECT',

    // Callback URL
    returnURL: String(returnURL),

    // Product
    productId: 'DEFAULT',

    // IMPORTANT:
    // Docs expect STRING
    isMultiSettlement: '0',

    // User-defined fields
    udf1: String(udf1 || 'NA'),

    udf2: String(udf2 || 'NA'),

    // REQUIRED by 1Pay
    udf3: 'NA',

    udf4: 'NA',

    udf5: 'NA',

    udf6: 'NA',

    // REQUIRED for DIRECT flow
    instrumentId: 'NA',

    cardDetails: 'NA',

    cardType: 'NA',
  }

  console.log(
    '[1Pay][Payload]',
    JSON.stringify(payload, null, 2)
  )

  return payload
}

// ─────────────────────────────────────────────────────────────────────────────
// POST to 1Pay API (server-to-server)
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
    console.log('[1Pay][POST] Response:', JSON.stringify(response.data).substring(0, 300))
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
    throw new Error(
      `[1Pay][Verify] No respData: ${raw.message || JSON.stringify(raw)}`
    )
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

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  API_BASE     as ONE_PAY_API_BASE,
  PAY_PAGE_URL as ONE_PAY_PAY_PAGE_URL,
  APP_URL      as ONE_PAY_APP_URL,
  MERCHANT_ID,
  API_KEY,
}