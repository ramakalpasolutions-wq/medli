// src/lib/utils/onepay.js
// CONFIRMED: AES-256-CBC + HEX key (64 chars) + HEX IV (32 chars)
// From debug: KEY=417492e3... (64 hex) IV=1b74d07f... (32 hex)

import crypto from 'crypto'
import axios  from 'axios'

const API_BASE =
  process.env.NODE_ENV === 'production'
    ? process.env.ONE_PAY_API_BASE_PROD
    : process.env.ONE_PAY_API_BASE_UAT

// Clean app URL — remove trailing slash
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '')

/**
 * Encrypt using AES-256-CBC
 * Key: 64 hex chars → 32 bytes
 * IV:  32 hex chars → 16 bytes
 * Confirmed by debug endpoint test1_hex_key_hex_iv
 */
export function onePayEncrypt(data) {
  const SECRET_KEY = (process.env.ONE_PAY_SECRET_KEY || '').trim()
  const SECRET_IV  = (process.env.ONE_PAY_SECRET_IV  || '').trim()

  // Convert hex strings to byte buffers
  const keyBuf = Buffer.from(SECRET_KEY, 'hex') // 64 hex → 32 bytes
  const ivBuf  = Buffer.from(SECRET_IV,  'hex') // 32 hex → 16 bytes

  console.log('[1Pay Encrypt] Key bytes:', keyBuf.length, '(must be 32)')
  console.log('[1Pay Encrypt] IV  bytes:', ivBuf.length,  '(must be 16)')

  if (keyBuf.length !== 32) {
    throw new Error(`Invalid key length: ${keyBuf.length} bytes (expected 32)`)
  }
  if (ivBuf.length !== 16) {
    throw new Error(`Invalid IV length: ${ivBuf.length} bytes (expected 16)`)
  }

  const text    = typeof data === 'string' ? data : JSON.stringify(data)
  const cipher  = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf)
  cipher.setAutoPadding(true)

  let encrypted  = cipher.update(text, 'utf8', 'base64')
  encrypted     += cipher.final('base64')

  console.log('[1Pay Encrypt] reqData length:', encrypted.length)
  return encrypted
}

/**
 * Decrypt AES-256-CBC response from 1Pay
 */
export function onePayDecrypt(ciphertext) {
  const SECRET_KEY = (process.env.ONE_PAY_SECRET_KEY || '').trim()
  const SECRET_IV  = (process.env.ONE_PAY_SECRET_IV  || '').trim()

  const keyBuf   = Buffer.from(SECRET_KEY, 'hex')
  const ivBuf    = Buffer.from(SECRET_IV,  'hex')

  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, ivBuf)
  decipher.setAutoPadding(true)

  let decrypted  = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted     += decipher.final('utf8')

  try {
    return JSON.parse(decrypted)
  } catch {
    return decrypted
  }
}

/**
 * POST to 1Pay API
 */
export async function onePayPost(endpoint, payload) {
  const url      = `${API_BASE}${endpoint}`
  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  })
  return response.data
}

/**
 * GET from 1Pay API
 */
export async function onePayGet(endpoint, params = {}) {
  const url      = `${API_BASE}${endpoint}`
  const response = await axios.get(url, {
    params,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  })
  return response.data
}

export const TXN_STATUS = {
  SUCCESS: 'Ok',
  FAILED:  'F',
  TIMEOUT: 'To',
  PENDING: 'Pending',
}

export const REFUND_CODES = {
  RF000: 'Refund initiated successfully',
  RF001: 'Transaction not found',
  RF002: 'Transaction was not successful',
  RF003: 'Already refunded',
  RF004: 'Pending settlement - try after 24 hours',
  RF005: 'Invalid refund amount',
}

export { API_BASE as ONE_PAY_API_BASE, APP_URL as ONE_PAY_APP_URL }