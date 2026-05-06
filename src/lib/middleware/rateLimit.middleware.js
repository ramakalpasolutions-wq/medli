import redis from '@/lib/cache'

export async function rateLimit(request, { max, windowSeconds, keyPrefix }) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip        = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown'

  const key     = `${keyPrefix}:${ip}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }

  if (current > max) {
    const ttl = await redis.ttl(key)
    throw new Error(
      `Too many requests. Please try again in ${ttl} seconds.`
    )
  }

  return { current, remaining: max - current, ip }
}