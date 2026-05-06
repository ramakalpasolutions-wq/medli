// src/lib/utils/onepay-debug.js
// Run this separately to test your keys before going live

import crypto from 'crypto'

export function debugEncryption() {
  const key = process.env.ONE_PAY_SECRET_KEY || ''
  const iv  = process.env.ONE_PAY_SECRET_IV  || key.substring(0, 32)

  console.log('=== 1Pay Encryption Debug ===')
  console.log('KEY length (chars):', key.length)
  console.log('IV  length (chars):', iv.length)

  // Key must be 64 hex chars = 32 bytes
  const keyBuf = Buffer.from(key, 'hex')
  const ivBuf  = Buffer.from(iv, 'hex')

  console.log('KEY buffer length (bytes):', keyBuf.length, '(must be 32)')
  console.log('IV  buffer length (bytes):', ivBuf.length,  '(must be 16)')

  if (keyBuf.length !== 32) {
    console.error('❌ KEY is wrong length! Expected 32 bytes (64 hex chars)')
    console.error('   Your key is', keyBuf.length, 'bytes')
  } else {
    console.log('✅ KEY length is correct')
  }

  if (ivBuf.length !== 16) {
    console.error('❌ IV is wrong length! Expected 16 bytes (32 hex chars)')
    console.error('   Your IV is', ivBuf.length, 'bytes')
  } else {
    console.log('✅ IV length is correct')
  }

  // Test encrypt/decrypt round-trip
  try {
    const testData   = { test: 'hello', amount: '100.00' }
    const testStr    = JSON.stringify(testData)

    const cipher     = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf)
    let encrypted    = cipher.update(testStr, 'utf8', 'base64')
    encrypted       += cipher.final('base64')

    const decipher   = crypto.createDecipheriv('aes-256-cbc', keyBuf, ivBuf)
    let decrypted    = decipher.update(encrypted, 'base64', 'utf8')
    decrypted       += decipher.final('utf8')

    const match = decrypted === testStr

    console.log('✅ Encrypt/decrypt round-trip:', match ? 'PASS' : 'FAIL')
    if (!match) {
      console.error('   Original:', testStr)
      console.error('   Decrypted:', decrypted)
    }
  } catch (err) {
    console.error('❌ Encrypt/decrypt failed:', err.message)
  }

  console.log('=== End Debug ===')
}