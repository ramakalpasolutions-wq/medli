import CryptoJS from 'crypto-js'
import bcrypt from 'bcryptjs'

const KEY = process.env.ENCRYPTION_KEY
const IV  = process.env.ENCRYPTION_IV

export function encrypt(text) {
  try {
    const key        = CryptoJS.enc.Utf8.parse(KEY)
    const iv         = CryptoJS.enc.Utf8.parse(IV)
    const encrypted  = CryptoJS.AES.encrypt(text, key, {
      iv,
      mode:    CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    return encrypted.toString()
  } catch (err) {
    throw new Error('Encryption failed: ' + err.message)
  }
}

export function decrypt(cipher) {
  try {
    const key       = CryptoJS.enc.Utf8.parse(KEY)
    const iv        = CryptoJS.enc.Utf8.parse(IV)
    const decrypted = CryptoJS.AES.decrypt(cipher, key, {
      iv,
      mode:    CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (err) {
    throw new Error('Decryption failed: ' + err.message)
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}