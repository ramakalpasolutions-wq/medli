// src/app/api/payments/debug/route.js
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import crypto from 'crypto'

export async function GET() {
  const SECRET_KEY = (process.env.ONE_PAY_SECRET_KEY || '').trim()
  const SECRET_IV  = (process.env.ONE_PAY_SECRET_IV  || '').trim()

  // ── Key analysis ──────────────────────────────────────────────────────────
  const keyAnalysis = {
    rawValue:     SECRET_KEY,
    charCount:    SECRET_KEY.length,
    isEvenLength: SECRET_KEY.length % 2 === 0,
    expectedLen:  64,
    missing:      64 - SECRET_KEY.length,
    isValidHex:   /^[0-9a-fA-F]+$/.test(SECRET_KEY),
  }

  const ivAnalysis = {
    rawValue:   SECRET_IV,
    charCount:  SECRET_IV.length,
    expectedLen:32,
    missing:    32 - SECRET_IV.length,
    isValidHex: /^[0-9a-fA-F]+$/.test(SECRET_IV),
  }

  // ── Try padding the key ───────────────────────────────────────────────────
  const keyVariants = {}

  // Variant A: pad to even then convert
  const paddedKey = SECRET_KEY.length % 2 !== 0
    ? '0' + SECRET_KEY
    : SECRET_KEY
  const keyBufA = Buffer.from(paddedKey, 'hex')
  keyVariants.paddedToEven = {
    hexLen:   paddedKey.length,
    bytes:    keyBufA.length,
    isValid:  keyBufA.length === 32,
  }

  // Variant B: add leading zero (63 → 64)
  const keyWithLeadingZero = '0' + SECRET_KEY
  const keyBufB = Buffer.from(keyWithLeadingZero, 'hex')
  keyVariants.addLeadingZero = {
    hexLen:  keyWithLeadingZero.length,
    bytes:   keyBufB.length,
    isValid: keyBufB.length === 32,
  }

  // Variant C: add trailing zero
  const keyWithTrailingZero = SECRET_KEY + '0'
  const keyBufC = Buffer.from(keyWithTrailingZero, 'hex')
  keyVariants.addTrailingZero = {
    hexLen:  keyWithTrailingZero.length,
    bytes:   keyBufC.length,
    isValid: keyBufC.length === 32,
  }

  // Variant D: pad to 32 bytes with zeros
  const keyBufD = Buffer.alloc(32, 0)
  Buffer.from(paddedKey, 'hex').copy(keyBufD)
  keyVariants.paddedToBytes = {
    bytes:   keyBufD.length,
    isValid: keyBufD.length === 32,
  }

  // ── IV analysis ───────────────────────────────────────────────────────────
  const ivBuf = Buffer.from(SECRET_IV, 'hex')

  // ── Test encryption with each key variant ────────────────────────────────
  const testData = JSON.stringify({
    merchantId: process.env.ONE_PAY_MERCHANT_ID,
    txnId:      'TEST001',
    Amount:     '100.00',
  })

  const encTests = {}

  // Test with paddedToEven key
  try {
    if (keyBufA.length === 32 && ivBuf.length === 16) {
      const c = crypto.createCipheriv('aes-256-cbc', keyBufA, ivBuf)
      let e   = c.update(testData, 'utf8', 'base64')
      e      += c.final('base64')
      encTests.variantA_paddedToEven = { success: true, reqDataLen: e.length }
    }
  } catch (err) {
    encTests.variantA_paddedToEven = { success: false, error: err.message }
  }

  // Test with leading zero key
  try {
    if (keyBufB.length === 32 && ivBuf.length === 16) {
      const c = crypto.createCipheriv('aes-256-cbc', keyBufB, ivBuf)
      let e   = c.update(testData, 'utf8', 'base64')
      e      += c.final('base64')
      encTests.variantB_leadingZero = { success: true, reqDataLen: e.length }
    }
  } catch (err) {
    encTests.variantB_leadingZero = { success: false, error: err.message }
  }

  // Test with padded to 32 bytes
  try {
    if (ivBuf.length === 16) {
      const c = crypto.createCipheriv('aes-256-cbc', keyBufD, ivBuf)
      let e   = c.update(testData, 'utf8', 'base64')
      e      += c.final('base64')
      encTests.variantD_paddedBytes = { success: true, reqDataLen: e.length }
    }
  } catch (err) {
    encTests.variantD_paddedBytes = { success: false, error: err.message }
  }

  return Response.json({
    problem: keyAnalysis.charCount !== 64
      ? `KEY IS ${keyAnalysis.charCount} CHARS — SHOULD BE 64 — MISSING ${keyAnalysis.missing} CHAR(S)`
      : 'Key length OK',

    keyAnalysis,
    ivAnalysis: {
      ...ivAnalysis,
      bufferBytes: ivBuf.length,
      isValid:     ivBuf.length === 16,
    },
    keyVariants,
    encryptionTests:  encTests,

    recommendation: keyAnalysis.charCount === 63
      ? 'Your key is 63 chars (missing 1). Most likely a leading zero was stripped. Try adding "0" at the start: ONE_PAY_SECRET_KEY=0' + SECRET_KEY
      : 'Contact 1Pay support for correct key',

    correctKeyToTry: keyAnalysis.charCount === 63
      ? '0' + SECRET_KEY
      : 'Contact 1Pay',

    merchantId: process.env.ONE_PAY_MERCHANT_ID,
    ivBuffer:   ivBuf.length + ' bytes',
  })
}