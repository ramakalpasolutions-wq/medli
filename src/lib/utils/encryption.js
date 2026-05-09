import CryptoJS from 'crypto-js'
import bcrypt   from 'bcryptjs'

const KEY = process.env.ENCRYPTION_KEY || 'medli-default-key-32-characters!'
const IV  = process.env.ENCRYPTION_IV  || 'medli-default-iv!'

export function encrypt(text) {
  if (!text) return null
  try {
    const key       = CryptoJS.enc.Utf8.parse(KEY)
    const iv        = CryptoJS.enc.Utf8.parse(IV)
    const encrypted = CryptoJS.AES.encrypt(String(text), key, {
      iv,
      mode:    CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    return encrypted.toString()
  } catch (err) {
    console.error('[encrypt]', err.message)
    return null
  }
}

export function decrypt(cipher) {
  if (!cipher) return null
  try {
    const key       = CryptoJS.enc.Utf8.parse(KEY)
    const iv        = CryptoJS.enc.Utf8.parse(IV)
    const decrypted = CryptoJS.AES.decrypt(String(cipher), key, {
      iv,
      mode:    CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (err) {
    console.error('[decrypt]', err.message)
    return null
  }
}

export function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false
  return /^[A-Za-z0-9+/]+=*$/.test(value) && value.length > 20
}

export function maskSensitive(value, visibleChars) {
  const show = visibleChars || 4
  if (!value) return null
  try {
    const plain = isEncrypted(value) ? decrypt(value) : String(value)
    if (!plain) return null
    if (plain.length <= show) return plain
    return '*'.repeat(Math.max(0, plain.length - show)) + plain.slice(-show)
  } catch {
    return null
  }
}

export async function hashPassword(password) {
  if (!password) throw new Error('Password is required')
  return bcrypt.hash(String(password), 12)
}

export async function comparePassword(password, hash) {
  if (!password || !hash) return false
  return bcrypt.compare(String(password), String(hash))
}

export function generateOtp(length) {
  const len = length || 6
  const min = Math.pow(10, len - 1)
  const max = Math.pow(10, len) - 1
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

export default {
  encrypt,
  decrypt,
  isEncrypted,
  maskSensitive,
  hashPassword,
  comparePassword,
  generateOtp,
}