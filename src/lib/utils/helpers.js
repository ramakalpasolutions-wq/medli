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

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
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

// ─── Pagination ───────────────────────────────────────────────────────────────

export function getPaginationParams(page = 1, limit = 20) {
  const p    = Math.max(1, parseInt(page, 10)  || 1)
  const l    = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const skip = (p - 1) * l
  return { skip, take: l, page: p, limit: l }
}

// ─── Date Range ───────────────────────────────────────────────────────────────

export function getDateRange(preset, dateFrom, dateTo) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  const endOf   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

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
      return { from: startOf(today), to: endOf(today) }
    }
  }
}