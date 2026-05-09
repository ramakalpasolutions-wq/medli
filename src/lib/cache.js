/**
 * Pure in-memory cache — no Redis dependency required.
 * Replace with Redis later by swapping this file.
 */

class MemoryCache {
  constructor() {
    this._store  = new Map()
    this._timers = new Map()
  }

  get(key) {
    const entry = this._store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._store.delete(key)
      this._timers.delete(key)
      return null
    }
    return entry.value
  }

  set(key, value, ttlSeconds = 300) {
    // Clear existing timer
    const existing = this._timers.get(key)
    if (existing) clearTimeout(existing)

    const expiresAt = ttlSeconds
      ? Date.now() + ttlSeconds * 1000
      : null

    this._store.set(key, { value, expiresAt })

    if (ttlSeconds) {
      const t = setTimeout(() => {
        this._store.delete(key)
        this._timers.delete(key)
      }, ttlSeconds * 1000)
      // Don't keep Node.js alive just for cache timers
      if (typeof t.unref === 'function') t.unref()
      this._timers.set(key, t)
    }

    return true
  }

  del(key) {
    const t = this._timers.get(key)
    if (t) clearTimeout(t)
    this._timers.delete(key)
    return this._store.delete(key)
  }

  incr(key) {
    const current = Number(this.get(key) ?? 0)
    const next    = current + 1
    // Preserve existing TTL
    const entry   = this._store.get(key)
    const ttl     = entry?.expiresAt
      ? Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000))
      : 60
    this.set(key, next, ttl)
    return next
  }

  expire(key, seconds) {
    const entry = this._store.get(key)
    if (!entry) return false
    this.set(key, entry.value, seconds)
    return true
  }

  keys(pattern = '*') {
    const all = [...this._store.keys()]
    if (pattern === '*') return all
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
    const re = new RegExp(`^${escaped}$`)
    return all.filter((k) => re.test(k))
  }

  flush(pattern = '*') {
    const matched = this.keys(pattern)
    matched.forEach((k) => this.del(k))
    return matched.length
  }

  ttl(key) {
    const entry = this._store.get(key)
    if (!entry)           return -2   // key doesn't exist
    if (!entry.expiresAt) return -1   // no expiry
    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000))
  }

  size() {
    return this._store.size
  }

  clear() {
    this._timers.forEach((t) => clearTimeout(t))
    this._timers.clear()
    this._store.clear()
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────
const globalForCache = globalThis

export const cache =
  globalForCache._appCache ??
  (globalForCache._appCache = new MemoryCache())

export default cache