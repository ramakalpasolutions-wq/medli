/**
 * Hybrid Cache:
 *   - Has REDIS_URL (production)  → uses Redis (works across ALL devices/servers)
 *   - No REDIS_URL  (local dev)   → uses in-memory cache
 *
 * ⚠️ ALL methods are async — always use `await cache.X()`
 */

const REDIS_URL = process.env.REDIS_URL
const USE_REDIS = !!REDIS_URL && process.env.DISABLE_REDIS !== 'true'

// ─── In-Memory (local development only) ────────────────────────────────────
class MemoryCache {
  constructor() {
    this._store  = new Map()
    this._timers = new Map()
    console.log('[cache] using in-memory cache (development)')
  }

  async get(key) {
    const entry = this._store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._store.delete(key)
      this._timers.delete(key)
      return null
    }
    return entry.value
  }

  async set(key, value, ttlSeconds = 300) {
    const existing = this._timers.get(key)
    if (existing) clearTimeout(existing)

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    this._store.set(key, { value, expiresAt })

    if (ttlSeconds) {
      const t = setTimeout(() => {
        this._store.delete(key)
        this._timers.delete(key)
      }, ttlSeconds * 1000)
      if (typeof t.unref === 'function') t.unref()
      this._timers.set(key, t)
    }
    return true
  }

  async del(key) {
    const t = this._timers.get(key)
    if (t) clearTimeout(t)
    this._timers.delete(key)
    return this._store.delete(key)
  }

  async incr(key) {
    const current = Number((await this.get(key)) ?? 0)
    const next    = current + 1
    const entry   = this._store.get(key)
    const ttl     = entry?.expiresAt
      ? Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000))
      : 60
    await this.set(key, next, ttl)
    return next
  }

  async expire(key, seconds) {
    const entry = this._store.get(key)
    if (!entry) return false
    return this.set(key, entry.value, seconds)
  }

  async ttl(key) {
    const entry = this._store.get(key)
    if (!entry)           return -2
    if (!entry.expiresAt) return -1
    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000))
  }

  async keys(pattern = '*') {
    const all = [...this._store.keys()]
    if (pattern === '*') return all
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
    const re = new RegExp(`^${escaped}$`)
    return all.filter((k) => re.test(k))
  }

  async flush(pattern = '*') {
    const matched = await this.keys(pattern)
    for (const k of matched) await this.del(k)
    return matched.length
  }

  async size() { return this._store.size }
}

// ─── Redis (production — works across all servers/devices) ─────────────────
class RedisCache {
  constructor() {
    this._redis      = null
    this._connecting = null
    console.log('[cache] using Redis Cloud (production)')
  }

  async _client() {
    if (this._redis) return this._redis
    if (this._connecting) return this._connecting

    this._connecting = (async () => {
      const { default: Redis } = await import('ioredis')
      const client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck:     true,
        lazyConnect:          false,
        connectTimeout:       10_000,
        commandTimeout:       5_000,
        retryStrategy:        (times) => Math.min(times * 200, 2000),
      })

      client.on('error',   (err) => console.error('[Redis] error:', err?.message))
      client.on('connect', ()    => console.log('[Redis] connected'))
      client.on('ready',   ()    => console.log('[Redis] ready'))
      client.on('end',     ()    => console.log('[Redis] disconnected'))

      this._redis = client
      return client
    })()

    return this._connecting
  }

  async get(key) {
    try {
      const c   = await this._client()
      const raw = await c.get(key)
      if (raw === null || raw === undefined) return null
      try { return JSON.parse(raw) }
      catch { return raw }
    } catch (e) {
      console.error('[Redis] get error:', key, e?.message)
      return null
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      const c = await this._client()
      const v = typeof value === 'string' ? value : JSON.stringify(value)
      if (ttlSeconds && ttlSeconds > 0) {
        await c.set(key, v, 'EX', ttlSeconds)
      } else {
        await c.set(key, v)
      }
      return true
    } catch (e) {
      console.error('[Redis] set error:', key, e?.message)
      return false
    }
  }

  async del(key) {
    try {
      const c = await this._client()
      const r = await c.del(key)
      return r > 0
    } catch (e) {
      console.error('[Redis] del error:', key, e?.message)
      return false
    }
  }

  async incr(key) {
    try {
      const c = await this._client()
      return await c.incr(key)
    } catch (e) {
      console.error('[Redis] incr error:', key, e?.message)
      return 0
    }
  }

  async expire(key, seconds) {
    try {
      const c = await this._client()
      const r = await c.expire(key, seconds)
      return r === 1
    } catch { return false }
  }

  async ttl(key) {
    try {
      const c = await this._client()
      return await c.ttl(key)
    } catch { return -2 }
  }

  async keys(pattern = '*') {
    try {
      const c = await this._client()
      return await c.keys(pattern)
    } catch (e) {
      console.error('[Redis] keys error:', e?.message)
      return []
    }
  }

  async flush(pattern = '*') {
    try {
      const c  = await this._client()
      const ks = await c.keys(pattern)
      if (!ks.length) return 0
      await c.del(...ks)
      return ks.length
    } catch (e) {
      console.error('[Redis] flush error:', e?.message)
      return 0
    }
  }

  async size() {
    try {
      const c = await this._client()
      return await c.dbsize()
    } catch { return 0 }
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────
const globalForCache = globalThis

export const cache =
  globalForCache._appCache ??
  (globalForCache._appCache = USE_REDIS ? new RedisCache() : new MemoryCache())

export default cache