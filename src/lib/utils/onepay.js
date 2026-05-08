// src/lib/utils/onepay.js

import crypto from 'crypto'
import axios from 'axios'

// ── Env — trim all whitespace ─────────────────────────────────────────────────
const MERCHANT_ID = (process.env.ONE_PAY_MERCHANT_ID || '').trim()
const API_KEY     = (process.env.ONE_PAY_API_KEY     || '').trim()
const SECRET_KEY  = (process.env.ONE_PAY_SECRET_KEY  || '').trim()

// ── IV = first 16 characters of API_KEY ──────────────────────────────────────
const SECRET_IV = API_KEY.substring(0, 16)

const IS_PROD = process.env.NODE_ENV === 'production'

// ── API base (server-to-server) ───────────────────────────────────────────────
// As per 1Pay docs: baseurl = https://pa-preprod.1pay.in (UAT) or https://pay.1pay.in (live) [file:36]
const API_BASE =
  process.env.ONE_PAY_API_BASE_UAT ||
  'https://pa-preprod.1pay.in'

// ── Payment PAGE (where user is sent to enter card/UPI details) ───────────────
// As per docs: baseurl/payment/payprocessorV2 [file:36]
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
// ─────────────────────────────────────────────────────────────────────────────
export function onePayEncrypt(data) {
  validateKeys()

  const keyBuf = Buffer.from(SECRET_KEY, 'utf8') // 32 bytes
  const ivBuf  = Buffer.from(SECRET_IV,  'utf8') // 16 bytes

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
  console.log('[1Pay][Decrypt] Raw decrypted:', dec)

  // 1) Try JSON
  try {
    const obj = JSON.parse(dec)
    console.log('[1Pay][Decrypt] Parsed as JSON, keys:', Object.keys(obj))
    return obj
  } catch {
    // 2) Try querystring → object (1Pay sample looks like k=v,k=v,...) [file:36]
    try {
      const qs = dec.replace(/,\s*/g, '&')
      const params = new URLSearchParams(qs)
      const obj = Object.fromEntries(params.entries())
      console.log('[1Pay][Decrypt] Parsed as querystring, keys:', Object.keys(obj))
      return obj
    } catch {
      console.warn('[1Pay][Decrypt] Could not parse JSON or querystring')
      return { raw: dec }
    }
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
// GET DATE TIME — dd-MM-yyyy HH:mm:ss  (for logs / internal)
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
// BUILD PAYLOAD — 1Pay PaymentAuthorization [file:36]
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
    // Merchant
    merchantId: MERCHANT_ID,
    apiKey:     API_KEY,

    // Transaction
    txnId:      String(txnId),
    amount:     parseFloat(amount).toFixed(2),
    // Doc sample uses yyyy-MM-dd HHmmss, but they say "Date time of the originator". [file:36]
    // We can keep our dd-MM-yyyy HH:mm:ss; gateway usually only uses reference + amount.
    dateTime:   getDateTime(),

    // Customer
    custMobile: String(custMobile || '9999999999'),
    custMail:   String(custMail   || 'customer@medli.in'),

    channelId: '0',        // 0 = Internet [file:36]
    txnType:   'DIRECT',   // DIRECT flow [file:36]

    // Callback
    returnURL: String(returnURL),

    // Product & settlement
    productId:       'DEFAULT',
    isMultiSettlement: '0',

    // UDFs
    udf1: String(udf1 || 'NA'),
    udf2: String(udf2 || 'NA'),
    udf3: 'NA',
    udf4: 'NA',
    udf5: 'NA',
    udf6: 'NA',

    // DIRECT mode requires these as "NA" [file:36]
    instrumentId: 'NA',
    cardDetails:  'NA',
    cardType:     'NA',
  }

  console.log('[1Pay][Payload]', JSON.stringify(payload, null, 2))
  return payload
}

// ─────────────────────────────────────────────────────────────────────────────
// POST helper (JSON) — used for PaymentAuth (if needed)
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
// VERIFY TRANSACTION — 1Pay Transaction Status Query [file:36]
// URL: baseurl/payment/getTxnDetails
// Request: merchantId & txnId (form / query)
// Response: k=v,k=v,... with transstatus: Ok/F/To/Pending [file:36]
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyTransaction(txnId) {
  console.log('[1Pay][Verify] txnId:', txnId)

  const url = `${API_BASE}/payment/getTxnDetails`
  console.log('[1Pay][Verify] URL:', url)

  try {
    const body = new URLSearchParams({
      merchantId: MERCHANT_ID,
      txnId:      String(txnId),
    }).toString()

    const res = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000,
    })

    console.log('[1Pay][Verify] HTTP:', res.status, res.data)

    const raw = typeof res.data === 'string' ? res.data : String(res.data)

    // Sample from doc:
    // "txnid=...,paymentmode=CC,...,transstatus=Ok,...,respcode=00000,..." [file:36]
    const qs = raw.replace(/,\s*/g, '&')
    const params = new URLSearchParams(qs)
    const obj = Object.fromEntries(params.entries())

    console.log('[1Pay][Verify] Parsed:', obj)
    return obj
  } catch (err) {
    console.error('[1Pay][Verify] Error:', err.message)
    if (err.code === 'ECONNABORTED') throw new Error('GATEWAY_TIMEOUT')
    if (err.code === 'ECONNREFUSED') throw new Error('GATEWAY_UNREACHABLE')
    if (err.response) {
      console.error('[1Pay][Verify] HTTP Error:', err.response.status, err.response.data)
      throw new Error(`Gateway HTTP ${err.response.status}`)
    }
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP STATUS — 1Pay → internal
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