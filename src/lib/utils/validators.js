export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(String(email).toLowerCase())
}

export function isValidPhone(phone) {
  // Indian 10-digit mobile numbers
  const re = /^[6-9]\d{9}$/
  return re.test(String(phone).replace(/\s+/g, ''))
}

export function isValidIFSC(ifsc) {
  // 4 letters, 0, 6 alphanumeric
  const re = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return re.test(String(ifsc).toUpperCase())
}

export function isValidPAN(pan) {
  // AAAAA9999A format
  const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return re.test(String(pan).toUpperCase())
}

export function isValidPinCode(pin) {
  // Indian 6-digit pin code
  const re = /^[1-9][0-9]{5}$/
  return re.test(String(pin))
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  return input
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .replace(/[<>'"]/g, '')    // strip remaining dangerous chars
    .trim()
}