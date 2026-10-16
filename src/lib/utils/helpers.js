function randomSuffix(digits = 6) {
  return Math.floor(Math.random() * Math.pow(10, digits))
    .toString()
    .padStart(digits, '0')
}

// ✅ FIX: Use IST year instead of UTC year
// On Vercel (UTC), between 00:00–05:29 IST the UTC year could be
// the previous year (e.g. Jan 1 00:30 IST = Dec 31 19:00 UTC)
function currentYear() {
  return Number(
    new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
    })
  )
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

export const generateId = generateOTP

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

export function formatNumber(amount) {
  return new Intl.NumberFormat('en-IN').format(Number(amount) || 0)
}

// ✅ FIX: Add explicit IST timezone so dates display correctly on Vercel
export function formatDate(date, options = { dateStyle: 'medium' }) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    ...options,
    timeZone: 'Asia/Kolkata',
  })
}

// ✅ FIX: Add explicit IST timezone
export function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
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
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
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

export function getPaginationParams(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page, 10) || 1)
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
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

// ============================================================
// ✅ IST DATE HELPERS (new)
// ============================================================

/**
 * Get a Date object representing "now" in IST.
 * The returned Date's .getFullYear(), .getMonth(), .getDate(),
 * .getHours(), .getMinutes() all return IST values.
 */
function istNow() {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  )
}

/**
 * Build a Date from IST date parts.
 * Equivalent to new Date(y, m, d, h, min, s, ms) but in IST.
 */
function istDate(year, month, day, hours = 0, minutes = 0, seconds = 0, ms = 0) {
  // Create the date string in IST and parse it with an explicit +05:30 offset
  const y = String(year)
  const mo = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  const h = String(hours).padStart(2, '0')
  const mi = String(minutes).padStart(2, '0')
  const s = String(seconds).padStart(2, '0')
  const milli = String(ms).padStart(3, '0')
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}.${milli}+05:30`)
}

/**
 * Extract IST date string (YYYY-MM-DD) from any Date or ISO string.
 * Safe on Vercel (UTC) or any server timezone.
 */
export function getIstDateString(dateInput) {
  return new Date(dateInput).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/**
 * Extract IST time string (HH:MM) from any Date or ISO string.
 */
export function getIstTimeString(dateInput) {
  const d = new Date(
    new Date(dateInput).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  )
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ============================================================
// ✅ FIX: getDateRange — all boundaries now use IST
// ============================================================

export function getDateRange(preset, dateFrom, dateTo) {
  const now = istNow()
  const today = istDate(now.getFullYear(), now.getMonth(), now.getDate())

  const startOf = (d) => {
    const ist = new Date(
      d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    )
    return istDate(ist.getFullYear(), ist.getMonth(), ist.getDate(), 0, 0, 0, 0)
  }

  const endOf = (d) => {
    const ist = new Date(
      d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    )
    return istDate(ist.getFullYear(), ist.getMonth(), ist.getDate(), 23, 59, 59, 999)
  }

  switch (preset) {
    case 'today':
      return { from: startOf(today), to: endOf(today) }
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
      const from = istDate(now.getFullYear(), now.getMonth(), 1)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'lastMonth': {
      const from = istDate(now.getFullYear(), now.getMonth() - 1, 1)
      const to = istDate(now.getFullYear(), now.getMonth(), 0)
      return { from: startOf(from), to: endOf(to) }
    }
    case 'last3Months': {
      const from = istDate(now.getFullYear(), now.getMonth() - 2, 1)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'last6Months': {
      const from = istDate(now.getFullYear(), now.getMonth() - 5, 1)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'thisYear': {
      const from = istDate(now.getFullYear(), 0, 1)
      return { from: startOf(from), to: endOf(today) }
    }
    case 'custom': {
      const from = dateFrom ? new Date(dateFrom) : startOf(today)
      const to = dateTo ? new Date(dateTo) : endOf(today)
      return { from, to }
    }
    default: {
      const from = new Date(today)
      from.setDate(from.getDate() - 29)
      return { from: startOf(from), to: endOf(today) }
    }
  }
}

// ✅ FIX: Use IST date parts instead of UTC .getFullYear()/.getMonth()/.getDate()
function formatLocalDateKey(date) {
  const ist = new Date(
    new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  )
  return [
    ist.getFullYear(),
    String(ist.getMonth() + 1).padStart(2, '0'),
    String(ist.getDate()).padStart(2, '0'),
  ].join('-')
}

export function groupByDate(items, dateField = 'createdAt') {
  const map = {}
  for (const item of items) {
    const key = formatLocalDateKey(item[dateField])
    if (!map[key]) map[key] = []
    map[key].push(item)
  }
  return map
}

// ✅ FIX: Cursor now iterates in IST dates
export function buildChartData(bookings, from, to) {
  const grouped = groupByDate(bookings, 'createdAt')
  const result = []

  // Parse "from" and "to" as IST dates
  const fromIst = new Date(
    new Date(from).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  )
  const toIst = new Date(
    new Date(to).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  )

  const cursor = istDate(fromIst.getFullYear(), fromIst.getMonth(), fromIst.getDate())
  const end = istDate(toIst.getFullYear(), toIst.getMonth(), toIst.getDate())

  while (cursor <= end) {
    const key = formatLocalDateKey(cursor)
    const day = grouped[key] || []

    result.push({
      date: key,
      bookings: day.length,
      revenue: day.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0),
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
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

export function safeJson(str, fallback = null) {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

export function shortId(id) {
  if (!id) return '—'
  return String(id).slice(-6).toUpperCase()
}

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
  getIstDateString,
  getIstTimeString,
  groupByDate,
  buildChartData,
  haversineDistance,
  safeJson,
  shortId,
}