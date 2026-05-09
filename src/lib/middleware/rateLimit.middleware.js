import { NextResponse } from 'next/server'
import { cache }        from '@/lib/cache'

const LIMITS = {
  auth:    { max: 10,  window: 60  },   // 10 req / 60 s
  otp:     { max: 5,   window: 300 },   // 5  req / 5 min
  payment: { max: 20,  window: 60  },
  default: { max: 100, window: 60  },
}

/**
 * Rate-limit a route handler.
 * Falls back silently if cache is unavailable.
 *
 * @param {Request}  request
 * @param {string}   type     — key into LIMITS
 * @param {Function} handler  — async (request) => Response
 */
export async function withRateLimit(request, type = 'default', handler) {
  try {
    const limit = LIMITS[type] ?? LIMITS.default

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const key     = `ratelimit:${type}:${ip}`
    const current = await cache.incr(key)

    if (current === 1) {
      await cache.expire(key, limit.window)
    }

    if (current > limit.max) {
      return NextResponse.json(
        {
          success: false,
          error:   'Too many requests. Please try again later.',
        },
        {
          status:  429,
          headers: {
            'Retry-After':        String(limit.window),
            'X-RateLimit-Limit':  String(limit.max),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    // Attach rate limit headers to successful response
    const response = await handler(request)

    if (response instanceof Response) {
      const remaining = Math.max(0, limit.max - current)
      response.headers.set('X-RateLimit-Limit',     String(limit.max))
      response.headers.set('X-RateLimit-Remaining', String(remaining))
    }

    return response
  } catch (error) {
    // Fail open — never block a request because of rate limiter crash
    console.warn('[RateLimit] Error — allowing request:', error?.message)
    return handler(request)
  }
}

export default { withRateLimit }