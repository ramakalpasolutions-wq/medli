import Redis from 'ioredis'

const globalForRedis = globalThis

const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message)
})

redis.on('connect', () => {
  console.log('[Redis] Connected successfully')
})

export const cache = {
  async get(key) {
    try {
      const value = await redis.get(key)
      if (!value) return null
      return JSON.parse(value)
    } catch (err) {
      console.error(`[Cache] GET error for key "${key}":`, err.message)
      return null
    }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await redis.set(key, serialized, 'EX', ttlSeconds)
      } else {
        await redis.set(key, serialized)
      }
      return true
    } catch (err) {
      console.error(`[Cache] SET error for key "${key}":`, err.message)
      return false
    }
  },

  async del(key) {
    try {
      await redis.del(key)
      return true
    } catch (err) {
      console.error(`[Cache] DEL error for key "${key}":`, err.message)
      return false
    }
  },

  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length === 0) return true
      const pipeline = redis.pipeline()
      keys.forEach((key) => pipeline.del(key))
      await pipeline.exec()
      return true
    } catch (err) {
      console.error(
        `[Cache] DEL PATTERN error for pattern "${pattern}":`,
        err.message
      )
      return false
    }
  },
}

export default redis