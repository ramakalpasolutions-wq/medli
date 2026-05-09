// ─── ID / Number Generators ───────────────────────────────────────────────────

function randomSuffix(digits = 6) {
  return Math.floor(Math.random() * Math.pow(10, digits))
    .toString()
    .padStart(digits, '0')
}

function currentYear() {
  return new Date().getFullYear()
}

export function generateBookingId() {
  return `BK-${currentYear()}-${randomSuffix(6)}`
}

export function generateInvoiceNumber() {
  return `INV-${currentYear()}-${randomSuffix(6)}`
}

export function generateSettlementNumber() {
  return `STL-${currentYear()}-${randomSuffix(6)}`
}

export function generateRefundNumber() {
  return `REF-${currentYear()}-${randomSuffix(6)}`
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Alias used by some routes
 */
export const generateId = generateOTP

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

export function formatNumber(amount) {
  return new Intl.NumberFormat('en-IN').format(Number(amount) || 0)
}

export function formatDate(date, options = { dateStyle: 'medium' }) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', options)
}

export function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text, maxLength = 50) {
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string')  return value.trim() === ''
  if (Array.isArray(value))       return value.length === 0
  if (typeof value === 'object')  return Object.keys(value).length === 0
  return false
}

export function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) acc[key] = obj[key]
    return acc
  }, {})
}

export function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k))
  )
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function getPaginationParams(page = 1, limit = 20) {
  const p    = Math.max(1, parseInt(page,  10) || 1)
  const l    = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const skip = (p - 1) * l
  return { skip, take: l, page: p, limit: l }
}

export function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 1
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

// ─── Date Range ───────────────────────────────────────────────────────────────

/**
 * Returns { from: Date, to: Date } for a given preset or custom range.
 *
 * Presets: today | yesterday | last7 | last14 | last30 |
 *          thisMonth | lastMonth | last3Months | last6Months |
 *          thisYear | custom
 */
export function getDateRange(preset, dateFrom, dateTo) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const startOf = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,  0,  0,  0)
  const endOf   = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

  switch (preset) {
    case 'today': {
      return { from: startOf(today), to: endOf(today) }
    }
    case 'yesterday': {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      return { from: startOf(y), to: endOf(y) }
    }
    case 'last7': {
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'last14': {
      const from = new Date(today)
      from.setDate(from.getDate() - 13)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'last30': {
      const from = new Date(today)
      from.setDate(from.getDate() - 29)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'thisMonth': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'lastMonth': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const to   = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: startOf(from), to: endOf(to) }
    }
    case 'last3Months': {
      const from = new Date(today.getFullYear(), today.getMonth() - 2, 1)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'last6Months': {
      const from = new Date(today.getFullYear(), today.getMonth() - 5, 1)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'thisYear': {
      const from = new Date(today.getFullYear(), 0, 1)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'custom': {
      const from = dateFrom ? new Date(dateFrom) : startOf(today)
      const to   = dateTo   ? new Date(dateTo)   : endOf(today)
      return { from, to }
    }
    default: {
      // Default to last 30 days
      const from = new Date(today)
      from.setDate(from.getDate() - 29)
      return { from: startOf(from), to: endOf(today) }
    }
  }
}

/**
 * Group an array of bookings by date for chart data.
 * Each item needs a `createdAt` or `startTime` field.
 */
export function groupByDate(items, dateField = 'createdAt') {
  const map = {}
  for (const item of items) {
    const d   = new Date(item[dateField])
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!map[key]) map[key] = []
    map[key].push(item)
  }
  return map
}

/**
 * Build chart-ready data from grouped bookings.
 * Returns array sorted by date ascending.
 */
export function buildChartData(bookings, from, to) {
  const grouped = groupByDate(bookings, 'createdAt')
  const result  = []

  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)

  while (cursor <= to) {
    const key  = cursor.toISOString().slice(0, 10)
    const day  = grouped[key] || []

    result.push({
      date:     key,
      bookings: day.length,
      revenue:  day.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0),
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

// ─── Geo ──────────────────────────────────────────────────────────────────────

/**
 * Calculate distance between two lat/lng points in kilometres.
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R    = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

/**
 * Safe JSON parse — returns fallback on error.
 */
export function safeJson(str, fallback = null) {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/**
 * Convert MongoDB ObjectId string to a display-friendly short ID.
 */
export function shortId(id) {
  if (!id) return '—'
  return String(id).slice(-6).toUpperCase()
}

// ─── Default export (for routes that use default import) ─────────────────────

export default {
  generateBookingId,
  generateInvoiceNumber,
  generateSettlementNumber,
  generateRefundNumber,
  generateOTP,
  generateId,
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  slugify,
  truncate,
  isEmpty,
  pick,
  omit,
  deepClone,
  sleep,
  getPaginationParams,
  buildPaginationMeta,
  getDateRange,
  groupByDate,
  buildChartData,
  haversineDistance,
  safeJson,
  shortId,
}