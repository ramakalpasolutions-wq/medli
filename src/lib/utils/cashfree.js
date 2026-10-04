import { Cashfree, CFEnvironment } from 'cashfree-pg'

const environment =
  process.env.CASHFREE_ENV === 'production'
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX

Cashfree.XClientId = process.env.CASHFREE_APP_ID
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY
Cashfree.XEnvironment = environment

export { Cashfree }

export function getCashfreeEnvironment() {
  return process.env.CASHFREE_ENV === 'production'
    ? 'production'
    : 'sandbox'
}

export function generateCashfreeOrderId(bookingId) {
  const cleanBookingId = String(bookingId)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(-20)

  return `MEDLI_${cleanBookingId}_${Date.now()}`
}