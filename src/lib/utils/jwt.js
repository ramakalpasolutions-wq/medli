import jwt from 'jsonwebtoken'

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'access-secret-change-me'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-me'
const ACCESS_EXPIRY  = process.env.JWT_ACCESS_EXPIRY  || '15m'
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d'

/**
 * Generate a short-lived access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY })
}

/**
 * Generate a long-lived refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY })
}

/**
 * Verify an access token — throws if invalid/expired
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET)
}

/**
 * Verify a refresh token — throws if invalid/expired
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET)
}

/**
 * Decode a token without verifying (useful for debugging)
 */
export function decodeToken(token) {
  return jwt.decode(token)
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
}