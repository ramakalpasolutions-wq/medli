import jwt from 'jsonwebtoken'

const ACCESS_SECRET  = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

export function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET)
  } catch (err) {
    throw new Error('Invalid or expired access token')
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET)
  } catch (err) {
    throw new Error('Invalid or expired refresh token')
  }
}