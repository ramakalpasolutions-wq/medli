// src/app/api/payments/debug/route.js
// TEMPORARY — delete after fixing 10052
// Visit: /api/payments/debug to see encryption test

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import crypto from 'crypto'

export async function GET() {
  const results = {}

  const SECRET_KEY = process.env.ONE_PAY_SECRET_KEY || ''
  const SECRET_IV  = process.env.ONE_PAY_SECRET_IV  || ''

  results.env = {
    MERCHANT_ID:     process.env.ONE_PAY_MERCHANT_ID || 'NOT SET',
    API_KEY:         process.env.ONE_PAY_API_KEY     || 'NOT SET',
    SECRET_KEY_RAW:  SECRET_KEY,
    SECRET_IV_RAW:   SECRET_IV,
    SECRET_KEY_LEN:  SECRET_KEY.length,
    SECRET_IV_LEN:   SECRET_IV.length,
    API_BASE_UAT:    process.env.ONE_PAY_API_BASE_UAT  || 'NOT SET',
    APP_URL:         process.env.NEXT_PUBLIC_APP_URL   || 'NOT SET',
  }

  // Test all possible encryption combinations
  const testPayload = {
    merchantId:        process.env.ONE_PAY_MERCHANT_ID || 'TEST',
    apiKey:            process.env.ONE_PAY_API_KEY     || 'TEST',
    txnId:             'MEDLITEST001',
    Amount:            '100.00',
    dateTime:          new Date().toISOString().slice(0, 19).replace('T', ' '),
    custMobile:        '9999999999',
    custMail:          'test@medli.in',
    channelId:         0,
    txnType:           'DIRECT',
    returnURL:         `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/onepay-callback`,
    productId:         'DEFAULT',
    isMultiSettlement: 0,
    udf1:              'NA',
    udf2:              'NA',
  }

  results.testPayload = testPayload
  results.encryptionTests = {}

  // ── Test 1: HEX key + HEX IV (official sample) ───────────────────────────
  try {
    const keyBuf = Buffer.from(SECRET_KEY, 'hex')
    const ivBuf  = Buffer.from(SECRET_IV,  'hex')

    results.encryptionTests.test1_hex_key_hex_iv = {
      keyBytes: keyBuf.length,
      ivBytes:  ivBuf.length,
      valid:    keyBuf.length === 32 && ivBuf.length === 16,
    }

    if (keyBuf.length === 32 && ivBuf.length === 16) {
      const cipher  = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf)
      let enc        = cipher.update(JSON.stringify(testPayload), 'utf8', 'base64')
      enc           += cipher.final('base64')

      results.encryptionTests.test1_hex_key_hex_iv.reqData       = enc
      results.encryptionTests.test1_hex_key_hex_iv.reqDataLength = enc.length
      results.encryptionTests.test1_hex_key_hex_iv.status        = 'SUCCESS'
    } else {
      results.encryptionTests.test1_hex_key_hex_iv.status = 'SKIP — wrong byte length'
    }
  } catch (e) {
    results.encryptionTests.test1_hex_key_hex_iv = { status: 'ERROR', error: e.message }
  }

  // ── Test 2: UTF-8 key + IV = first 16 bytes of key ───────────────────────
  try {
    const keyBuf = Buffer.alloc(32, 0)
    Buffer.from(SECRET_KEY, 'utf8').copy(keyBuf, 0, 0, Math.min(SECRET_KEY.length, 32))
    const ivBuf = keyBuf.slice(0, 16)

    const cipher  = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf)
    let enc        = cipher.update(JSON.stringify(testPayload), 'utf8', 'base64')
    enc           += cipher.final('base64')

    results.encryptionTests.test2_utf8_key_first16_iv = {
      keyBytes:     keyBuf.length,
      ivBytes:      ivBuf.length,
      reqData:      enc,
      reqDataLength:enc.length,
      status:       'SUCCESS',
    }
  } catch (e) {
    results.encryptionTests.test2_utf8_key_first16_iv = {
      status: 'ERROR',
      error:  e.message,
    }
  }

  // ── Test 3: UTF-8 key + full key as IV (32 bytes → CBC uses first 16) ────
  try {
    const keyBuf = Buffer.alloc(32, 0)
    Buffer.from(SECRET_KEY, 'utf8').copy(keyBuf, 0, 0, Math.min(SECRET_KEY.length, 32))
    const ivBuf = keyBuf // full 32 bytes — Node uses first 16

    const cipher  = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf)
    let enc        = cipher.update(JSON.stringify(testPayload), 'utf8', 'base64')
    enc           += cipher.final('base64')

    results.encryptionTests.test3_utf8_key_fullkey_iv = {
      keyBytes:     keyBuf.length,
      ivBytes:      ivBuf.length,
      reqData:      enc,
      reqDataLength:enc.length,
      status:       'SUCCESS',
    }
  } catch (e) {
    results.encryptionTests.test3_utf8_key_fullkey_iv = {
      status: 'ERROR',
      error:  e.message,
    }
  }

  // ── Test 4: HEX key + first 16 bytes of key as IV ────────────────────────
  try {
    const keyBuf = Buffer.from(SECRET_KEY, 'hex')
    const ivBuf  = keyBuf.slice(0, 16)

    results.encryptionTests.test4_hex_key_first16_iv = {
      keyBytes: keyBuf.length,
      ivBytes:  ivBuf.length,
      valid:    keyBuf.length === 32,
    }

    if (keyBuf.length === 32) {
      const cipher  = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf)
      let enc        = cipher.update(JSON.stringify(testPayload), 'utf8', 'base64')
      enc           += cipher.final('base64')

      results.encryptionTests.test4_hex_key_first16_iv.reqData       = enc
      results.encryptionTests.test4_hex_key_first16_iv.reqDataLength = enc.length
      results.encryptionTests.test4_hex_key_first16_iv.status        = 'SUCCESS'
    } else {
      results.encryptionTests.test4_hex_key_first16_iv.status = 'SKIP — key not 32 bytes'
    }
  } catch (e) {
    results.encryptionTests.test4_hex_key_first16_iv = {
      status: 'ERROR',
      error:  e.message,
    }
  }

  // ── Test 5: ECB mode (no IV) ──────────────────────────────────────────────
  try {
    const keyBuf = Buffer.alloc(32, 0)
    Buffer.from(SECRET_KEY, 'utf8').copy(keyBuf, 0, 0, Math.min(SECRET_KEY.length, 32))

    const cipher  = crypto.createCipheriv('aes-256-ecb', keyBuf, null)
    let enc        = cipher.update(JSON.stringify(testPayload), 'utf8', 'base64')
    enc           += cipher.final('base64')

    results.encryptionTests.test5_ecb_utf8_key = {
      keyBytes:     keyBuf.length,
      reqData:      enc,
      reqDataLength:enc.length,
      status:       'SUCCESS',
    }
  } catch (e) {
    results.encryptionTests.test5_ecb_utf8_key = {
      status: 'ERROR',
      error:  e.message,
    }
  }

  // ── Test 6: ECB mode with HEX key ────────────────────────────────────────
  try {
    const keyBuf = Buffer.from(SECRET_KEY, 'hex')

    if (keyBuf.length === 32) {
      const cipher  = crypto.createCipheriv('aes-256-ecb', keyBuf, null)
      let enc        = cipher.update(JSON.stringify(testPayload), 'utf8', 'base64')
      enc           += cipher.final('base64')

      results.encryptionTests.test6_ecb_hex_key = {
        keyBytes:     keyBuf.length,
        reqData:      enc,
        reqDataLength:enc.length,
        status:       'SUCCESS',
      }
    } else {
      results.encryptionTests.test6_ecb_hex_key = {
        keyBytes: keyBuf.length,
        status:   'SKIP — key not 32 bytes when decoded as hex',
      }
    }
  } catch (e) {
    results.encryptionTests.test6_ecb_hex_key = {
      status: 'ERROR',
      error:  e.message,
    }
  }

  // ── What to share with 1Pay ───────────────────────────────────────────────
  results.shareWith1Pay = {
    message: 'Share test1 reqData with 1Pay support and ask them to decrypt it',
    test1_reqData: results.encryptionTests.test1_hex_key_hex_iv?.reqData || 'N/A',
    test2_reqData: results.encryptionTests.test2_utf8_key_first16_iv?.reqData || 'N/A',
    test5_reqData: results.encryptionTests.test5_ecb_utf8_key?.reqData || 'N/A',
  }

  return Response.json(results, {
    headers: { 'Content-Type': 'application/json' },
  })
}