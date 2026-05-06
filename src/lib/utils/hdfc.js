import CryptoJS from 'crypto-js'

function getMD5Key(workingKey) {
  return CryptoJS.MD5(workingKey).toString()
}

export function hdfcEncrypt(plaintext, workingKey) {
  const keyHex = getMD5Key(workingKey)
  const key = CryptoJS.enc.Hex.parse(keyHex)
  const iv = CryptoJS.enc.Hex.parse('000102030405060708090a0b0c0d0e0f')

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return encrypted.ciphertext.toString(CryptoJS.enc.Hex)
}

export function hdfcDecrypt(cipherHex, workingKey) {
  const keyHex = getMD5Key(workingKey)
  const key = CryptoJS.enc.Hex.parse(keyHex)
  const iv = CryptoJS.enc.Hex.parse('000102030405060708090a0b0c0d0e0f')

  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Hex.parse(cipherHex),
  })

  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return decrypted.toString(CryptoJS.enc.Utf8)
}

export function buildQueryString(params) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? '')}`)
    .join('&')
}

export function parseQueryString(str) {
  const result = {}
  if (!str) return result
  str.split('&').forEach((pair) => {
    const [k, v] = pair.split('=')
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || '')
  })
  return result
}