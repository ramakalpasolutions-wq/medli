import { NextResponse }      from 'next/server'
import { verifyAccessToken } from '@/lib/utils/jwt'

export function extractToken(request) {
  const cookieToken = request.cookies.get('accessToken')?.value
  if (cookieToken) return cookieToken
  const authHeader = request.headers.get('authorization') || ''
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim()
  return null
}

export function verifyToken(request) {
  try {
    const token = extractToken(request)
    if (!token) return null
    return verifyAccessToken(token)
  } catch {
    return null
  }
}

/**
 * Unified auth function supporting TWO patterns:
 *
 * PATTERN A — middleware wrapper (new routes):
 *   return withAuth(request, async (req, user) => { ... })
 *   user = { userId, role, phone, email }
 *
 * PATTERN B — direct await (old routes):
 *   const user = await verifyAuth(request)
 *   if (!user) return errorResponse(...)
 *   checkRole(user, 'super_admin')
 */
async function _authCore(request, handler) {
  try {
    const token = extractToken(request)

    // ── No token ────────────────────────────────────────────────────
    if (!token) {
      // Pattern B — return null, let route handle it
      if (handler === undefined || handler === null) return null
      // Pattern A — return 401 response
      if (typeof handler !== 'function') {
        console.error('[withAuth] handler is not a function:', typeof handler)
        return NextResponse.json(
          { success: false, error: 'Internal server error' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // ── Verify token ────────────────────────────────────────────────
    let decoded
    try {
      decoded = verifyAccessToken(token)
    } catch {
      if (!handler) return null
      if (typeof handler !== 'function') return NextResponse.json(
        { success: false, error: 'Internal server error' }, { status: 500 }
      )
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Normalise payload — some tokens use 'id', ensure 'userId' always exists
    const user = {
      userId: decoded.userId || decoded.id || decoded.sub,
      id:     decoded.userId || decoded.id || decoded.sub, // backward compat
      role:   decoded.role,
      phone:  decoded.phone,
      email:  decoded.email,
    }

    // ── Pattern B — no handler, return user directly ─────────────────
    if (!handler) return user

    // ── Pattern A — call handler ─────────────────────────────────────
    if (typeof handler !== 'function') {
      console.error('[withAuth] handler is not a function:', typeof handler)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }

    return handler(request, user)

  } catch (error) {
    console.error('[withAuth]', error?.message)
    if (!handler) return null
    return NextResponse.json(
      { success: false, error: 'Authentication error' },
      { status: 500 }
    )
  }
}

export const withAuth   = _authCore
export const verifyAuth = _authCore

export default { withAuth, verifyAuth, extractToken, verifyToken }