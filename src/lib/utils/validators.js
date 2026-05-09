export function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone || '').replace(/\s+/g, ''))
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

export function validateIfsc(ifsc) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(ifsc || '').toUpperCase())
}

export function validateGstin(gstin) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    String(gstin || '').toUpperCase()
  )
}

export function validatePan(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(pan || '').toUpperCase())
}

export function validatePincode(pin) {
  return /^[1-9][0-9]{5}$/.test(String(pin || ''))
}

export function validateUpi(upi) {
  return /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(String(upi || '').trim())
}

export function validateAccountNumber(acc) {
  return /^\d{9,18}$/.test(String(acc || '').replace(/\s/g, ''))
}

export function validateObjectId(id) {
  return /^[a-f\d]{24}$/i.test(String(id || ''))
}

export function validatePositiveNumber(val) {
  return !isNaN(val) && Number(val) > 0
}

export function validatePercent(val) {
  const n = Number(val)
  return !isNaN(n) && n >= 0 && n <= 100
}

export function validateDate(val) {
  if (!val) return false
  return !isNaN(new Date(val).getTime())
}

export function validateFutureDate(val) {
  if (!validateDate(val)) return false
  return new Date(val) > new Date()
}

export function validateBookingType(type) {
  return ['hospital', 'online', 'lab'].includes(type)
}

export function validateCouponCode(code) {
  return /^[A-Z0-9]{3,20}$/.test(String(code || '').toUpperCase())
}

export function validateRequired(obj, fields) {
  return fields.filter((f) => {
    const v = obj?.[f]
    if (v === null || v === undefined) return true
    if (typeof v === 'string' && v.trim() === '') return true
    return false
  })
}

export function sanitizeInput(input, maxLength) {
  const max = maxLength || 500
  if (input === null || input === undefined) return ''
  return String(input)
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export function sanitizeName(name, maxLength) {
  const max = maxLength || 100
  if (!name) return ''
  return String(name)
    .replace(/[^a-zA-Z\u0900-\u097F\s'\-.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export function sanitizePhone(phone) {
  if (!phone) return ''
  return String(phone).replace(/\D/g, '').slice(-10)
}

export function sanitizeEmail(email) {
  if (!email) return ''
  return String(email).toLowerCase().trim().slice(0, 254)
}

export function sanitizeUrl(url, maxLength) {
  const max = maxLength || 2048
  if (!url) return ''
  const clean = String(url).trim()
  if (!/^https?:\/\//i.test(clean)) return ''
  return clean.slice(0, max)
}

export default {
  validatePhone,
  validateEmail,
  validateIfsc,
  validateGstin,
  validatePan,
  validatePincode,
  validateUpi,
  validateAccountNumber,
  validateObjectId,
  validatePositiveNumber,
  validatePercent,
  validateDate,
  validateFutureDate,
  validateBookingType,
  validateCouponCode,
  validateRequired,
  sanitizeInput,
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  sanitizeUrl,
}