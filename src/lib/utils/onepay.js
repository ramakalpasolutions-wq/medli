// src/lib/utils/onepay.js
import crypto from 'crypto'
import axios  from 'axios'

// ── Env ───────────────────────────────────────────────────────────────────────
const MERCHANT_ID = (process.env.ONE_PAY_MERCHANT_ID  || '').trim()
const API_KEY     = (process.env.ONE_PAY_API_KEY       || '').trim()
const SECRET_KEY  = (process.env.ONE_PAY_SECRET_KEY    || '').trim()
const SECRET_IV   = (process.env.ONE_PAY_SECRET_IV     || '').trim()

const IS_PROD = process.env.NODE_ENV === 'production'

// ── Base URLs ─────────────────────────────────────────────────────────────────
const API_BASE = IS_PROD
  ? (process.env.ONE_PAY_API_BASE_PROD || 'https://pay.1pay.in')
  : (process.env.ONE_PAY_API_BASE_UAT  || 'https://pa-preprod.1pay.in')

// ── Payment PAGE URLs (where user is redirected to enter card/UPI details) ────
// UAT:  https://pa-preprod.1pay.in/payment/payprocessorV2
// PROD: https://pay.1pay.in/payment/payprocessorV2
const PAY_PAGE_URL = IS_PROD
  ? (process.env.ONE_PAY_PAY_PAGE_PROD || 'https://pay.1pay.in/payment/payprocessorV2')
  : (process.env.ONE_PAY_PAY_PAGE_UAT  || 'https://pa-preprod.1pay.in/payment/payprocessorV2')

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  .replace(/\/+$/, '')

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE KEYS
// KEY : 32 UTF-8 chars = 32 bytes = AES-256
// IV  : 16 UTF-8 chars = 16 bytes = AES block size
// ─────────────────────────────────────────────────────────────────────────────
function validateKeys() {
  const issues = []

  if (!SECRET_KEY) {
    issues.push('ONE_PAY_SECRET_KEY is not set')
  } else if (SECRET_KEY.length !== 32) {
    issues.push(
      `ONE_PAY_SECRET_KEY must be exactly 32 chars (got ${SECRET_KEY.length})`
    )
  }

  if (!SECRET_IV) {
    issues.push('ONE_PAY_SECRET_IV is not set')
  } else if (SECRET_IV.length !== 16) {
    issues.push(
      `ONE_PAY_SECRET_IV must be exactly 16 chars (got ${SECRET_IV.length})`
    )
  }

  if (!MERCHANT_ID) issues.push('ONE_PAY_MERCHANT_ID is not set')
  if (!API_KEY)     issues.push('ONE_PAY_API_KEY is not set')

  if (issues.length > 0) {
    const msg = '[1Pay Config Error]\n' + issues.map(i => '  • ' + i).join('\n')
    console.error(msg)
    throw new Error(msg)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCRYPT — AES-256-CBC
// Key : Buffer.from(SECRET_KEY, 'utf8') → 32 bytes
// IV  : Buffer.from(SECRET_IV,  'utf8') → 16 bytes
// Out : Base64
// ─────────────────────────────────────────────────────────────────────────────
export function onePayEncrypt(data) {
  validateKeys()

  const keyBuf = Buffer.from(SECRET_KEY, 'utf8')
  const ivBuf  = Buffer.from(SECRET_IV,  'utf8')

  console.log('[1Pay][Encrypt] Key:', keyBuf.length, 'bytes | IV:', ivBuf.length, 'bytes')

  const text   = typeof data === 'object' ? JSON.stringify(data) : String(data)
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf)
  cipher.setAutoPadding(true)

  let enc  = cipher.update(text, 'utf8', 'base64')
  enc     += cipher.final('base64')

  console.log('[1Pay][Encrypt] Output length:', enc.length)
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
// GENERATE TRANSACTION ID
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
// POST to 1Pay API (server-to-server)
// ─────────────────────────────────────────────────────────────────────────────
export async function onePayPost(endpoint, payload) {
  const url = `${API_BASE}${endpoint}`
  console.log('[1Pay][POST]', url)

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })
    console.log('[1Pay][POST] Status:', response.status)
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

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  API_BASE    as ONE_PAY_API_BASE,
  PAY_PAGE_URL as ONE_PAY_PAY_PAGE_URL,   // ← form action URL
  APP_URL     as ONE_PAY_APP_URL,
  MERCHANT_ID,
  API_KEY,
}