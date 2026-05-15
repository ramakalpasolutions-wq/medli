/**
 * MSG91 — Production OTP & SMS (uses async cache)
 */

import axios from 'axios'
import cache from '@/lib/cache'

const BASE_URL        = 'https://control.msg91.com/api/v5'
const HTTP_TIMEOUT_MS = 12_000
const MAX_HTTP_RETRY  = 2
const RETRY_BACKOFF   = [400, 1200]

const OTP_EXPIRY_MIN  = 5
const OTP_EXPIRY_SEC  = OTP_EXPIRY_MIN * 60
const OTP_LENGTH      = 6
const RATE_LIMIT_MAX  = 3
const RATE_WINDOW_SEC = 5 * 60

const env = (k) => (process.env[k] || '').trim()
const AUTH_KEY    = () => env('MSG91_AUTH_KEY')
const TEMPLATE_ID = () => env('MSG91_TEMPLATE_ID_OTP')
const SENDER_ID   = () => env('MSG91_SENDER_ID')
const IS_BYPASS   = () => env('MSG91_BYPASS') === 'true'
const IS_PROD     = () => env('NODE_ENV')     === 'production'

function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 10) return `91${digits}`
  throw new Error(`Invalid phone: ${phone}`)
}

function raw10(phone) {
  const d = String(phone || '').replace(/\D/g, '')
  return d.length === 12 ? d.slice(2) : d.slice(-10)
}

const attemptKey  = (p) => `msg91:attempts:${raw10(p)}`
const bypassKey   = (p) => `msg91:bypass:${raw10(p)}`
const cooldownKey = (p) => `msg91:cooldown:${raw10(p)}`

function log(level, msg, meta = {}) {
  const entry = { ts: new Date().toISOString(), level, svc: 'msg91', msg, ...meta }
  if (level === 'error') console.error(JSON.stringify(entry))
  else                   console.log(JSON.stringify(entry))
}

function validateConfig() {
  if (IS_BYPASS()) return { ok: true, bypass: true }
  const missing = []
  if (!AUTH_KEY())    missing.push('MSG91_AUTH_KEY')
  if (!TEMPLATE_ID()) missing.push('MSG91_TEMPLATE_ID_OTP')
  if (missing.length) {
    log('error', 'MSG91 config missing', { missing })
    return { ok: false, error: `Missing: ${missing.join(', ')}` }
  }
  return { ok: true }
}

async function httpRequest(method, path, { params, data } = {}) {
  let lastErr
  for (let attempt = 0; attempt <= MAX_HTTP_RETRY; attempt++) {
    try {
      const res = await axios.request({
        method, url: `${BASE_URL}${path}`, params, data,
        timeout: HTTP_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json', authkey: AUTH_KEY() },
        validateStatus: (s) => s < 500,
      })
      return res
    } catch (err) {
      lastErr = err
      const isRetryable =
        !err.response ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ETIMEDOUT' ||
        (err.response && err.response.status >= 500)
      if (!isRetryable || attempt === MAX_HTTP_RETRY) break
      const wait = RETRY_BACKOFF[attempt] || 2000
      log('warn', 'MSG91 retry', { attempt: attempt + 1, wait, error: err?.message })
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastErr
}

export async function sendOtp(phone) {
  let formatted
  try { formatted = formatPhone(phone) }
  catch {
    log('warn', 'Invalid phone in sendOtp', { phone })
    return { success: false, error: 'Invalid phone number' }
  }

  if (await cache.get(cooldownKey(formatted))) {
    return { success: false, error: 'Please wait before requesting another OTP' }
  }

  const attempts = Number((await cache.get(attemptKey(formatted))) ?? 0)
  if (attempts >= RATE_LIMIT_MAX) {
    log('warn', 'Rate limit hit', { phone: raw10(formatted), attempts })
    return { success: false, error: 'Too many OTP requests. Try again in a few minutes.' }
  }

  const cfg = validateConfig()
  if (!cfg.ok && !cfg.bypass) {
    return { success: false, error: 'SMS service not configured' }
  }

  if (IS_BYPASS()) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    await cache.set(bypassKey(formatted),   otp,                  OTP_EXPIRY_SEC)
    await cache.set(attemptKey(formatted),  String(attempts + 1), RATE_WINDOW_SEC)
    await cache.set(cooldownKey(formatted), '1',                  30)
    log('info', 'BYPASS OTP sent', { phone: raw10(formatted), otp })
    return {
      success: true, bypassMode: true,
      ...(!IS_PROD() && { devOtp: otp }),
    }
  }

  try {
    const payload = {
      template_id: TEMPLATE_ID(),
      mobile:      formatted,
      otp_length:  OTP_LENGTH,
      otp_expiry:  OTP_EXPIRY_MIN,
      ...(SENDER_ID() && { sender: SENDER_ID() }),
    }
    const res = await httpRequest('POST', '/otp', { data: payload })

    if (res.data?.type === 'success') {
      await cache.set(attemptKey(formatted),  String(attempts + 1), RATE_WINDOW_SEC)
      await cache.set(cooldownKey(formatted), '1',                  30)
      log('info', 'OTP sent', { phone: raw10(formatted), requestId: res.data?.request_id })
      return { success: true, requestId: res.data?.request_id }
    }

    log('error', 'MSG91 sendOtp failed', { phone: raw10(formatted), status: res.status, response: res.data })
    return { success: false, error: res.data?.message || 'Failed to send OTP' }

  } catch (err) {
    log('error', 'MSG91 sendOtp exception', {
      phone: raw10(formatted), error: err?.message, code: err?.code,
      status: err?.response?.status, data: err?.response?.data,
    })
    return { success: false, error: 'SMS service temporarily unavailable. Please try again.' }
  }
}

export async function verifyOtp(phone, otp) {
  let formatted
  try { formatted = formatPhone(phone) }
  catch {
    log('warn', 'Invalid phone in verifyOtp', { phone })
    return false
  }

  const otpClean = String(otp || '').replace(/\D/g, '').trim()
  if (!otpClean || otpClean.length !== OTP_LENGTH) return false

  if (IS_BYPASS()) {
    const stored = await cache.get(bypassKey(formatted))
    if (stored && String(stored).trim() === otpClean) {
      await cache.del(bypassKey(formatted))
      await cache.del(attemptKey(formatted))
      await cache.del(cooldownKey(formatted))
      return true
    }
    if (otpClean === '123456') {
      await cache.del(attemptKey(formatted))
      await cache.del(cooldownKey(formatted))
      return true
    }
    log('warn', 'BYPASS OTP mismatch', { phone: raw10(formatted) })
    return false
  }

  if (!AUTH_KEY()) {
    log('error', 'MSG91_AUTH_KEY missing in verifyOtp')
    return false
  }

  try {
    const res = await httpRequest('GET', '/otp/verify', {
      params: { mobile: formatted, otp: otpClean },
    })

    if (res.data?.type === 'success') {
      await cache.del(attemptKey(formatted))
      await cache.del(cooldownKey(formatted))
      log('info', 'OTP verified', { phone: raw10(formatted) })
      return true
    }

    log('warn', 'OTP verification failed', { phone: raw10(formatted), status: res.status, response: res.data })
    return false

  } catch (err) {
    log('error', 'MSG91 verifyOtp exception', {
      phone: raw10(formatted), error: err?.message,
      status: err?.response?.status, data: err?.response?.data,
    })
    return false
  }
}

export async function resendOtp(phone, retryType = 'text') {
  let formatted
  try { formatted = formatPhone(phone) }
  catch { return { success: false, error: 'Invalid phone number' } }

  if (await cache.get(cooldownKey(formatted))) {
    return { success: false, error: 'Please wait before requesting another OTP' }
  }
  const attempts = Number((await cache.get(attemptKey(formatted))) ?? 0)
  if (attempts >= RATE_LIMIT_MAX) {
    return { success: false, error: 'Too many OTP requests. Try again in a few minutes.' }
  }
  if (IS_BYPASS()) return sendOtp(phone)
  if (!AUTH_KEY()) return { success: false, error: 'SMS service not configured' }

  try {
    const res = await httpRequest('GET', '/otp/retry', {
      params: { mobile: formatted, retrytype: retryType === 'voice' ? 'voice' : 'text' },
    })
    if (res.data?.type === 'success') {
      await cache.set(attemptKey(formatted),  String(attempts + 1), RATE_WINDOW_SEC)
      await cache.set(cooldownKey(formatted), '1',                  30)
      log('info', 'OTP resent', { phone: raw10(formatted), retryType })
      return { success: true }
    }
    return { success: false, error: res.data?.message || 'Failed to resend OTP' }
  } catch (err) {
    log('error', 'MSG91 resendOtp exception', { phone: raw10(formatted), error: err?.message })
    return { success: false, error: 'SMS service temporarily unavailable' }
  }
}

export async function sendSMS({ phone, templateId, variables = {} }) {
  const formatted = formatPhone(phone)

  if (IS_BYPASS()) {
    log('info', 'BYPASS SMS', { phone: raw10(formatted), variables })
    return { success: true, bypassMode: true }
  }

  if (!AUTH_KEY()) throw new Error('MSG91_AUTH_KEY is not configured')

  const tplId = templateId || env('MSG91_TEMPLATE_ID_BOOKING') || TEMPLATE_ID()
  if (!tplId) throw new Error('No template_id provided for SMS')

  try {
    const res = await httpRequest('POST', '/flow/', {
      data: {
        template_id: tplId, short_url: '0',
        recipients: [{ mobiles: formatted, ...variables }],
      },
    })
    if (res.data?.type === 'success' || res.status === 200) {
      log('info', 'SMS sent', { phone: raw10(formatted), tplId })
      return { success: true, data: res.data }
    }
    log('error', 'SMS send failed', { phone: raw10(formatted), response: res.data })
    return { success: false, error: res.data?.message || 'Failed to send SMS' }
  } catch (err) {
    log('error', 'sendSMS exception', { phone: raw10(formatted), error: err?.message })
    throw err
  }
}

export default { sendOtp, verifyOtp, resendOtp, sendSMS }