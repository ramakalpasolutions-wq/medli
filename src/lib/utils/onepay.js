// src/lib/utils/onepay.js
// Built from official 1Pay sample code
// Key insight: key and IV are HEX strings from 1Pay
// crypto.createCipheriv('aes-256-cbc', Buffer.from(key,'hex'), Buffer.from(iv,'hex'))

import crypto from 'crypto'
import axios  from 'axios'

// ── Base URL ──────────────────────────────────────────────────────────────────
const API_BASE =
  process.env.NODE_ENV === 'production'
    ? process.env.ONE_PAY_API_BASE_PROD
    : process.env.ONE_PAY_API_BASE_UAT

// ── Read env vars ─────────────────────────────────────────────────────────────
// ONE_PAY_SECRET_KEY = hex string (64 hex chars = 32 bytes = AES-256)
// ONE_PAY_SECRET_IV  = hex string (32 hex chars = 16 bytes = AES block size)
// If 1Pay gave you a single key (not separate IV), set IV = first 32 hex chars of key
const SECRET_KEY = process.env.ONE_PAY_SECRET_KEY || ''
const SECRET_IV  = process.env.ONE_PAY_SECRET_IV  || SECRET_KEY.substring(0, 32)

/**
 * Encrypt using AES-256-CBC
 * Exactly matching official 1Pay sample:
 *   crypto.createCipheriv('aes-256-cbc', Buffer.from(key,'hex'), Buffer.from(iv,'hex'))
 *
 * @param {object|string} data
 * @returns {string} Base64 encrypted string (reqData)
 */
export function onePayEncrypt(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data)

  const keyBuf = Buffer.from(SECRET_KEY, 'hex')
  const ivBuf  = Buffer.from(SECRET_IV,  'hex')

  const cipher    = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf)
  let encrypted   = cipher.update(text, 'utf8', 'base64')
  encrypted      += cipher.final('base64')

  return encrypted
}

/**
 * Decrypt using AES-256-CBC
 * Exactly matching official 1Pay sample:
 *   crypto.createDecipheriv('aes-256-cbc', Buffer.from(key,'hex'), Buffer.from(iv,'hex'))
 *
 * @param {string} ciphertext - Base64 encrypted respData from 1Pay
 * @returns {object|string} Decrypted response
 */
export function onePayDecrypt(ciphertext) {
  const keyBuf = Buffer.from(SECRET_KEY, 'hex')
  const ivBuf  = Buffer.from(SECRET_IV,  'hex')

  const decipher  = crypto.createDecipheriv('aes-256-cbc', keyBuf, ivBuf)
  let decrypted   = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted      += decipher.final('utf8')

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
  const url = `${API_BASE}${endpoint}`

  console.log(`[1Pay POST] ${url}`, JSON.stringify(payload))

  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  })

  console.log(`[1Pay POST] Response:`, JSON.stringify(response.data))

  return response.data
}

/**
 * GET from 1Pay API (transaction status, refund status)
 * Per docs: GET /payment/getTxnDetails?merchantId=X&txnId=Y
 */
export async function onePayGet(endpoint, params = {}) {
  const url = `${API_BASE}${endpoint}`

  console.log(`[1Pay GET] ${url}`, params)

  const response = await axios.get(url, {
    params,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  })

  console.log(`[1Pay GET] Response:`, JSON.stringify(response.data))

  return response.data
}

/**
 * Transaction status values per 1Pay docs
 */
export const TXN_STATUS = {
  SUCCESS: 'Ok',      // payment successful
  FAILED:  'F',       // payment failed
  TIMEOUT: 'To',      // timeout
  PENDING: 'Pending', // pending
}

/**
 * Refund status codes
 */
export const REFUND_CODES = {
  RF000: 'Refund initiated successfully',
  RF001: 'Transaction not found',
  RF002: 'Transaction was not successful',
  RF003: 'Already refunded',
  RF004: 'Pending settlement - try after 24 hours',
  RF005: 'Invalid refund amount',
}

export { API_BASE as ONE_PAY_API_BASE }