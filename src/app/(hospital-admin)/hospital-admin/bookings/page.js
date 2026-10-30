
'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  Search,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  UserRound,
  Phone,
  Mail,
  Stethoscope,
  IndianRupee,
  Video,
  AlertTriangle,
  XCircle,
  Building2,
} from 'lucide-react'

import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

// ============================================================
// CONFIGURATION
// ============================================================

const PAGE_SIZE = 20

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'created', label: 'Created' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'Not Attended' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const STATUS_LABELS = {
  created: 'Created',
  pending_payment: 'Pending Payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  no_show: 'Not Attended',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
  partial_refund: 'Partial Refund',
}

const CANCELLABLE = new Set([
  'created',
  'pending_payment',
  'confirmed',
])

// ============================================================
// RESPONSIVE CSS
// ============================================================

const STYLES = `
  .hab-page {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow-x: clip;
  }

  .hab-page *,
  .hab-page *::before,
  .hab-page *::after {
    box-sizing: border-box;
  }

  .hab-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }

  .hab-search {
    position: relative;
    flex: 1 1 220px;
    max-width: 340px;
    min-width: 160px;
  }

  .hab-search input {
    width: 100%;
    padding: 11px 14px 11px 39px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    outline: none;
    color: #1e293b;
    font-size: 13px;
    transition: all .2s ease;
  }

  .hab-search input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,.10);
  }

  .hab-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }

  .hab-filter {
    padding: 9px 12px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 650;
    white-space: nowrap;
    background: #f1f5f9;
    color: #64748b;
    transition: .18s;
  }

  .hab-filter:hover {
    background: #e0e7ff;
    color: #4f46e5;
  }

  .hab-filter.active {
    background: linear-gradient(135deg,#6366f1,#8b5cf6);
    color: #fff;
  }

  .hab-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #475569;
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .hab-icon-btn:hover {
    background: #e0e7ff;
    color: #4f46e5;
  }

  .hab-icon-btn:disabled {
    cursor: not-allowed;
    opacity: .5;
  }

  /* Wide desktop table */

  .hab-table-view {
    display: block;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .hab-table-scroll {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    border-radius: 18px;
  }

  .hab-table-inner {
    min-width: 1220px;
  }

  .hab-table-inner table {
    width: 100%;
    min-width: 1220px;
  }

  .hab-table-inner th,
  .hab-table-inner td {
    white-space: nowrap;
    vertical-align: middle;
  }

  .hab-table-inner th:last-child,
  .hab-table-inner td:last-child {
    min-width: 250px;
  }

  .hab-cards-view {
    display: none;
  }

  /* Status dropdown */

  .hab-status-wrap {
    min-width: 0;
    width: 180px;
    max-width: 100%;
    position: relative;
  }

  .hab-status-select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    min-width: 0;
    padding: 10px 30px 10px 11px;
    border: 1.5px solid #c7d2fe;
    background: #eef2ff;
    color: #4338ca;
    font-size: 12px;
    font-weight: 700;
    border-radius: 10px;
    outline: none;
    cursor: pointer;
    text-overflow: ellipsis;
  }

  .hab-status-select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,.12);
  }

  .hab-status-select:disabled {
    background: #f1f5f9;
    color: #64748b;
    border-color: #e2e8f0;
    cursor: not-allowed;
  }

  .hab-status-arrow {
    pointer-events: none;
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
  }

  .hab-status-note {
    display: block;
    margin-top: 5px;
    font-size: 10px;
    color: #94a3b8;
    line-height: 1.4;
  }

  /* Booking cards */

  .hab-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 17px;
    min-width: 0;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(15,23,42,.035);
  }

  .hab-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 15px;
  }

  .hab-card-name {
    color: #0f172a;
    font-size: 14px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .hab-card-booking-id {
    margin-top: 5px;
    font-family: monospace;
    font-size: 11px;
    color: #94a3b8;
    overflow-wrap: anywhere;
  }

  .hab-card-grid {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 13px 15px;
  }

  .hab-card-label {
    display: block;
    font-size: 10px;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: .4px;
    margin-bottom: 5px;
  }

  .hab-card-value {
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    overflow-wrap: anywhere;
  }

  .hab-card-footer {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 10px;
    border-top: 1px solid #f1f5f9;
    margin-top: 16px;
    padding-top: 14px;
  }

  .hab-card-footer .hab-status-wrap {
    width: 100%;
  }

  .hab-card-footer .hab-action-area {
    flex: 1 1 170px;
    min-width: 0;
  }

  .hab-card-footer .hab-icon-btn {
    min-height: 40px;
  }

  .hab-card-footer .hab-view-btn {
    flex: 0 0 auto;
  }

  .hab-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 20px 0 5px;
  }

  /* Switch to responsive cards on laptop/tablet sizes */

  @media (max-width: 1550px) {
    .hab-table-view {
      display: none;
    }

    .hab-cards-view {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 14px;
    }
  }

  @media (max-width: 1180px) {
    .hab-cards-view {
      grid-template-columns: minmax(0,1fr);
    }
  }

  @media (max-width: 640px) {
    .hab-page {
      width: 100%;
      min-width: 0;
    }

    .hab-toolbar {
      gap: 9px;
    }

    .hab-search {
      min-width: 0;
      max-width: none;
      flex-basis: 100%;
    }

    .hab-filters {
      width: 100%;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 7px;
      scrollbar-width: thin;
    }

    .hab-filter {
      flex-shrink: 0;
    }

    .hab-card {
      padding: 14px;
    }

    .hab-card-grid {
      gap: 12px;
    }

    .hab-card-footer {
      align-items: stretch;
    }

    .hab-card-footer .hab-action-area {
      flex-basis: 100%;
    }

    .hab-card-footer .hab-view-btn {
      width: 100%;
    }
  }
`

// ============================================================
// HELPERS
// ============================================================

function statusLabel(status) {
  return (
    STATUS_LABELS[status] ||
    String(status || 'Unknown')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value, mounted, includeTime = true) {
  if (!mounted || !value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' } : {}),
  })
}

function availableStatuses(booking) {
  if (booking.paymentStatus !== 'paid') {
    return []
  }

  switch (booking.status) {
    case 'created':
    case 'pending_payment':
      return ['confirmed']

    case 'confirmed':
      return ['completed', 'no_show']

    default:
      return []
  }
}

async function fetcher(url) {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  })

  const json = await response.json()

  if (!response.ok || json?.success === false) {
    throw new Error(
      json?.message ||
      json?.error ||
      'Failed to load bookings'
    )
  }

  return json?.data ?? json
}

// ============================================================
// STATUS DROPDOWN
// ============================================================

function StatusDropdown({
  booking,
  onChange,
  disabled = false,
  fullWidth = false,
}) {
  const allowed = availableStatuses(booking)
  const canCancel = CANCELLABLE.has(booking.status)
  const editable = allowed.length > 0 || canCancel

  const current = booking.status || 'created'

  function handleChange(event) {
    event.stopPropagation()

    const target = event.currentTarget
    const next = target.value

    // Keep current value until API confirmation succeeds.
    target.value = current

    if (!next || next === current) return

    onChange(booking, next)
  }

  return (
    <div
      className="hab-status-wrap"
      style={fullWidth ? { width: '100%' } : undefined}
    >
      <div style={{ position: 'relative' }}>
        <select
          className="hab-status-select"
          aria-label={`Change booking status for ${
            booking.bookingId || booking.id
          }`}
          value={current}
          disabled={disabled || !editable}
          onClick={(event) => event.stopPropagation()}
          onChange={handleChange}
        >
          <option value={current}>
            {statusLabel(current)} (Current)
          </option>

          {allowed.map((status) => (
            <option key={status} value={status}>
              {status === 'confirmed'
                ? 'Confirm Booking'
                : status === 'completed'
                  ? 'Mark Completed'
                  : 'Not Attended'}
            </option>
          ))}

          {canCancel && (
            <option value="cancelled">
              Cancel Booking
            </option>
          )}
        </select>

        <ChevronDown
          size={14}
          className="hab-status-arrow"
        />
      </div>

      {!editable && (
        <span className="hab-status-note">
          No available status changes
        </span>
      )}

      {['created', 'pending_payment'].includes(
        current
      ) &&
        booking.paymentStatus !== 'paid' && (
          <span
            className="hab-status-note"
            style={{ color: '#b45309' }}
          >
            Awaiting verified payment
          </span>
        )}
    </div>
  )
}

// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({ label, value, Icon }) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          color: '#64748b',
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        {Icon && <Icon size={14} />}
        {label}
      </span>

      <span
        style={{
          fontSize: 12,
          fontWeight: 650,
          color: '#0f172a',
          textAlign: 'right',
          overflowWrap: 'anywhere',
          minWidth: 0,
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ============================================================
// BOOKING DETAILS
// ============================================================

function BookingDetail({
  booking,
  mounted,
  saving,
  onStatusChange,
}) {
  return (
    <div style={{ display: 'grid', gap: 15 }}>
      <div
        style={{
          padding: 16,
          borderRadius: 14,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            fontFamily: 'monospace',
            overflowWrap: 'anywhere',
            color: '#0f172a',
          }}
        >
          {booking.bookingId || booking.id}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 10,
          }}
        >
          <Badge
            variant={getStatusVariant(booking.status)}
            size="sm"
            dot
          >
            {statusLabel(booking.status)}
          </Badge>

          <Badge
            variant={getStatusVariant(
              booking.paymentStatus
            )}
            size="sm"
            dot
          >
            {statusLabel(booking.paymentStatus)}
          </Badge>

          <Badge
            variant={
              booking.type === 'lab'
                ? 'success'
                : booking.type === 'online'
                  ? 'purple'
                  : 'info'
            }
            size="sm"
          >
            {booking.type}
          </Badge>
        </div>
      </div>

      <section
        style={{
          padding: 15,
          borderRadius: 14,
          border: '1px solid #e2e8f0',
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#334155',
            margin: '0 0 8px',
          }}
        >
          Patient & Appointment
        </h3>

        <DetailRow
          label="Patient"
          value={booking.userName}
          Icon={UserRound}
        />

        <DetailRow
          label="Phone"
          value={booking.userPhone}
          Icon={Phone}
        />

        <DetailRow
          label="Email"
          value={booking.userEmail}
          Icon={Mail}
        />

        <DetailRow
          label="Hospital"
          value={booking.hospitalName}
          Icon={Building2}
        />

        <DetailRow
          label="Doctor"
          value={
            booking.doctorName
              ? `Dr. ${booking.doctorName}`
              : '—'
          }
          Icon={Stethoscope}
        />

        <DetailRow
          label="Appointment"
          value={formatDate(
            booking.startTime,
            mounted
          )}
          Icon={CalendarDays}
        />
      </section>

      <section
        style={{
          padding: 15,
          borderRadius: 14,
          border: '1px solid #e2e8f0',
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#334155',
            margin: '0 0 8px',
          }}
        >
          Payment Details
        </h3>

        <DetailRow
          label="Payment Status"
          value={statusLabel(booking.paymentStatus)}
        />

        <DetailRow
          label="Base Fee"
          value={money(booking.baseFee)}
          Icon={IndianRupee}
        />

        <DetailRow
          label="Total Amount"
          value={money(booking.totalAmount)}
        />

        <DetailRow
          label="Coupon"
          value={booking.couponCode || '—'}
        />

        <DetailRow
          label="Discount"
          value={money(booking.couponDiscount)}
        />

        <DetailRow
          label="Doctor Notes"
          value={booking.doctorNotes}
        />

        <DetailRow
          label="Cancellation Reason"
          value={booking.cancellationReason}
        />
      </section>

      {booking.type === 'online' &&
        booking.meetLink && (
          <a
            href={booking.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#059669',
              color: '#fff',
              padding: 12,
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Video size={16} />
            Join Online Consultation
          </a>
        )}

      <section
        style={{
          padding: 15,
          background: '#eef2ff',
          border: '1px solid #c7d2fe',
          borderRadius: 14,
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#3730a3',
            margin: '0 0 12px',
          }}
        >
          Update Booking Status
        </h3>

        <StatusDropdown
          booking={booking}
          disabled={saving}
          onChange={onStatusChange}
          fullWidth
        />
      </section>
    </div>
  )
}

// ============================================================
// MOBILE / TABLET BOOKING CARD
// ============================================================

function BookingCard({
  booking,
  mounted,
  saving,
  onStatusChange,
  onView,
}) {
  return (
    <article className="hab-card">
      <div className="hab-card-header">
        <div style={{ minWidth: 0 }}>
          <div className="hab-card-name">
            {booking.userName}
          </div>

          <div className="hab-card-booking-id">
            {booking.bookingId || booking.id}
          </div>
        </div>

        <Badge
          variant={getStatusVariant(booking.status)}
          size="sm"
          dot
        >
          {statusLabel(booking.status)}
        </Badge>
      </div>

      <div className="hab-card-grid">
        <div>
          <span className="hab-card-label">Doctor</span>
          <span className="hab-card-value">
            {booking.doctorName
              ? `Dr. ${booking.doctorName}`
              : '—'}
          </span>
        </div>

        <div>
          <span className="hab-card-label">Type</span>

          <Badge
            size="sm"
            variant={
              booking.type === 'lab'
                ? 'success'
                : booking.type === 'online'
                  ? 'purple'
                  : 'info'
            }
          >
            {booking.type || '—'}
          </Badge>
        </div>

        <div>
          <span className="hab-card-label">
            Payment
          </span>

          <Badge
            size="sm"
            variant={getStatusVariant(
              booking.paymentStatus
            )}
            dot
          >
            {statusLabel(booking.paymentStatus)}
          </Badge>
        </div>

        <div>
          <span className="hab-card-label">
            Amount
          </span>

          <span className="hab-card-value">
            {money(booking.totalAmount)}
          </span>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <span className="hab-card-label">
            Appointment Date
          </span>

          <span
            className="hab-card-value"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CalendarDays size={13} />

            {formatDate(booking.startTime, mounted)}
          </span>
        </div>
      </div>

      <div className="hab-card-footer">
        <div className="hab-action-area">
          <span className="hab-card-label">
            Update Status
          </span>

          <StatusDropdown
            booking={booking}
            disabled={saving}
            onChange={onStatusChange}
            fullWidth
          />
        </div>

        <button
          type="button"
          className="hab-icon-btn hab-view-btn"
          onClick={() => onView(booking)}
          disabled={saving}
        >
          <Eye size={15} />
          View Details
        </button>
      </div>
    </article>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function HospitalAdminBookings() {
  const toast = useToast()

  const [mounted, setMounted] = useState(false)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [viewItem, setViewItem] = useState(null)

  const [pendingChange, setPendingChange] =
    useState(null)

  const [cancelTarget, setCancelTarget] =
    useState(null)

  const [cancelReason, setCancelReason] =
    useState('Cancelled by hospital admin')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ----------------------------------------------------------
  // FETCH BOOKINGS
  // ----------------------------------------------------------

  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  })

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (statusFilter) {
    params.set('status', statusFilter)
  }

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR(
    `/api/bookings?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const bookings = useMemo(() => {
    const raw = Array.isArray(data?.bookings)
      ? data.bookings
      : []

    return raw.map((booking) => ({
      ...booking,

      userName:
        booking.patientName ||
        booking.userName ||
        booking.user?.name ||
        booking.patient?.name ||
        'Patient',

      userPhone:
        booking.userPhone ||
        booking.user?.phone ||
        booking.patient?.phone ||
        '',

      userEmail:
        booking.userEmail ||
        booking.user?.email ||
        booking.patient?.email ||
        '',

      doctorName:
        booking.doctorName ||
        booking.doctor?.name ||
        '',

      hospitalName:
        booking.hospitalName ||
        booking.hospital?.name ||
        '',
    }))
  }, [data])

  const total = data?.pagination?.total ?? 0

  const totalPages = Math.max(
    1,
    data?.pagination?.totalPages || 1
  )

  // ----------------------------------------------------------
  // HANDLE STATUS DROPDOWN
  // ----------------------------------------------------------

  function requestStatusChange(booking, nextStatus) {
    if (saving || !booking) return

    if (nextStatus === booking.status) return

    if (nextStatus === 'cancelled') {
      if (!CANCELLABLE.has(booking.status)) return

      setViewItem(null)
      setCancelTarget(booking)
      setCancelReason('Cancelled by hospital admin')
      return
    }

    const allowed = availableStatuses(booking)

    if (!allowed.includes(nextStatus)) return

    setViewItem(null)

    setPendingChange({
      booking,
      nextStatus,
    })
  }

  // ----------------------------------------------------------
  // SAVE STATUS
  // ----------------------------------------------------------

  async function confirmStatusUpdate() {
    if (!pendingChange || saving) return

    const { booking, nextStatus } = pendingChange

    if (
      !availableStatuses(booking).includes(nextStatus)
    ) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        `/api/bookings/${booking.id}/status`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      )

      const json = await response.json()

      if (
        !response.ok ||
        json?.success === false
      ) {
        throw new Error(
          json?.message ||
          json?.error ||
          'Failed to update booking status'
        )
      }

      toast.success(
        `Booking updated to ${statusLabel(nextStatus)}`
      )

      setPendingChange(null)

      await mutate()
    } catch (err) {
      toast.error(
        err.message || 'Status update failed'
      )
    } finally {
      setSaving(false)
    }
  }

  // ----------------------------------------------------------
  // CANCEL BOOKING
  // ----------------------------------------------------------

  async function confirmCancellation() {
    if (!cancelTarget || saving) return

    setSaving(true)

    try {
      const response = await fetch(
        `/api/bookings/${cancelTarget.id}/cancel`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason:
              cancelReason.trim() ||
              'Cancelled by hospital admin',
          }),
        }
      )

      const json = await response.json()

      if (
        !response.ok ||
        json?.success === false
      ) {
        throw new Error(
          json?.message ||
          json?.error ||
          'Failed to cancel booking'
        )
      }

      toast.success('Booking cancelled successfully')

      setCancelTarget(null)

      await mutate()
    } catch (err) {
      toast.error(
        err.message || 'Cancellation failed'
      )
    } finally {
      setSaving(false)
    }
  }

  // ----------------------------------------------------------
  // TABLE COLUMNS
  // ----------------------------------------------------------

  const columns = [
    {
      key: 'userName',
      header: 'Patient',

      render: (value, booking) => (
        <div style={{ minWidth: 150 }}>
          <p
            style={{
              margin: 0,
              color: '#1e293b',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {value}
          </p>

          <p
            style={{
              margin: '4px 0 0',
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#94a3b8',
            }}
          >
            {booking.bookingId}
          </p>
        </div>
      ),
    },

    {
      key: 'doctorName',
      header: 'Doctor',

      render: (value) => (
        <span style={{ fontSize: 12, color: '#475569' }}>
          {value ? `Dr. ${value}` : '—'}
        </span>
      ),
    },

    {
      key: 'type',
      header: 'Type',

      render: (value) => (
        <Badge
          size="sm"
          variant={
            value === 'lab'
              ? 'success'
              : value === 'online'
                ? 'purple'
                : 'info'
          }
        >
          {value || '—'}
        </Badge>
      ),
    },

    {
      key: 'paymentStatus',
      header: 'Payment',

      render: (value) => (
        <Badge
          size="sm"
          dot
          variant={getStatusVariant(value)}
        >
          {statusLabel(value)}
        </Badge>
      ),
    },

    {
      key: 'status',
      header: 'Booking Status',

      render: (value) => (
        <Badge
          size="sm"
          dot
          variant={getStatusVariant(value)}
        >
          {statusLabel(value)}
        </Badge>
      ),
    },

    {
      key: 'totalAmount',
      header: 'Amount',

      render: (value) => (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#334155',
          }}
        >
          {money(value)}
        </span>
      ),
    },

    {
      key: 'startTime',
      header: 'Date',

      render: (value) => (
        <span
          style={{
            fontSize: 12,
            color: '#64748b',
          }}
        >
          {formatDate(value, mounted)}
        </span>
      ),
    },

    {
      key: 'actions',
      header: 'Update Status',

      render: (_, booking) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <StatusDropdown
            booking={booking}
            disabled={saving}
            onChange={requestStatusChange}
          />

          <button
            type="button"
            className="hab-icon-btn"
            disabled={saving}
            onClick={() => setViewItem(booking)}
          >
            <Eye size={14} />
            View
          </button>
        </div>
      ),
    },
  ]

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <>
      <style>{STYLES}</style>

      <div className="hab-page">
        <AdminHeader
          title="Bookings"
          subtitle={`${total} booking${
            total === 1 ? '' : 's'
          } · ${
            statusFilter
              ? statusLabel(statusFilter)
              : 'All'
          }`}
          breadcrumbs={[
            { label: 'Hospital Admin' },
            { label: 'Bookings' },
          ]}
        />

        {/* Search and filters */}

        <div className="hab-toolbar">
          <div className="hab-search">
            <Search
              size={16}
              color="#94a3b8"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />

            <input
              type="search"
              placeholder="Search booking ID…"
              aria-label="Search bookings"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="hab-filters">
            {STATUS_FILTERS.map((filter) => (
              <button
                type="button"
                key={filter.value}
                className={`hab-filter ${
                  statusFilter === filter.value
                    ? 'active'
                    : ''
                }`}
                onClick={() => {
                  setStatusFilter(filter.value)
                  setPage(1)
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="hab-icon-btn"
            onClick={() => mutate()}
            disabled={saving}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* Error */}

        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff1f2',
              border: '1px solid #fecaca',
              padding: 14,
              borderRadius: 12,
              marginBottom: 16,
              color: '#b91c1c',
              fontSize: 13,
            }}
          >
            <AlertTriangle size={17} />
            {error.message}
          </div>
        )}

        {/* ============================================
            DESKTOP TABLE
            ============================================ */}

        <div className="hab-table-view">
          <div className="hab-table-scroll">
            <div className="hab-table-inner">
              <DataTable
                columns={columns}
                data={bookings}
                loading={isLoading}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                emptyTitle="No bookings found"
                emptyMessage={
                  statusFilter
                    ? `No ${statusLabel(statusFilter)} bookings`
                    : 'No bookings yet'
                }
              />
            </div>
          </div>
        </div>

        {/* ============================================
            RESPONSIVE BOOKING CARDS
            ============================================ */}

        <div className="hab-cards-view">
          {isLoading ? (
            [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="hab-card"
                style={{ minHeight: 200 }}
              >
                <div
                  style={{
                    background: '#f1f5f9',
                    height: 20,
                    width: '65%',
                    borderRadius: 6,
                    marginBottom: 20,
                  }}
                />

                <div
                  style={{
                    background: '#f1f5f9',
                    height: 100,
                    borderRadius: 10,
                  }}
                />
              </div>
            ))
          ) : bookings.length === 0 ? (
            <div
              className="hab-card"
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 40,
              }}
            >
              <CalendarDays
                size={32}
                color="#94a3b8"
              />

              <h3
                style={{
                  margin: '12px 0 4px',
                  fontSize: 15,
                }}
              >
                No bookings found
              </h3>

              <p
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                }}
              >
                Try adjusting your filters.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                mounted={mounted}
                saving={saving}
                onView={setViewItem}
                onStatusChange={requestStatusChange}
              />
            ))
          )}
        </div>

        {/* Responsive pagination */}

        <div className="hab-cards-view">
          <div
            className="hab-pagination"
            style={{ gridColumn: '1 / -1' }}
          >
            <button
              type="button"
              className="hab-icon-btn"
              disabled={page <= 1 || isLoading}
              onClick={() =>
                setPage((p) => Math.max(1, p - 1))
              }
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            <span
              style={{
                fontSize: 12,
                color: '#64748b',
                whiteSpace: 'nowrap',
              }}
            >
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              className="hab-icon-btn"
              disabled={
                page >= totalPages || isLoading
              }
              onClick={() =>
                setPage((p) =>
                  Math.min(totalPages, p + 1)
                )
              }
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================
          VIEW BOOKING MODAL
          ============================================ */}

      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={`Booking — ${viewItem?.bookingId || ''}`}
        size="md"
      >
        {viewItem && (
          <BookingDetail
            booking={viewItem}
            mounted={mounted}
            saving={saving}
            onStatusChange={requestStatusChange}
          />
        )}
      </Modal>

      {/* ============================================
          STATUS CONFIRMATION MODAL
          ============================================ */}

      <Modal
        open={!!pendingChange}
        onClose={() => {
          if (!saving) setPendingChange(null)
        }}
        title="Confirm Status Update"
        size="sm"
      >
        {pendingChange && (
          <div style={{ display: 'grid', gap: 15 }}>
            <div
              style={{
                background: '#eef2ff',
                border: '1px solid #c7d2fe',
                padding: 16,
                borderRadius: 14,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  margin: '0 0 9px',
                }}
              >
                Booking{' '}
                <strong>
                  {pendingChange.booking.bookingId}
                </strong>
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <Badge
                  variant={getStatusVariant(
                    pendingChange.booking.status
                  )}
                  size="sm"
                >
                  {statusLabel(
                    pendingChange.booking.status
                  )}
                </Badge>

                <ChevronRight
                  size={16}
                  color="#6366f1"
                />

                <Badge
                  variant={getStatusVariant(
                    pendingChange.nextStatus
                  )}
                  size="sm"
                >
                  {statusLabel(
                    pendingChange.nextStatus
                  )}
                </Badge>
              </div>
            </div>

            <p
              style={{
                color: '#64748b',
                fontSize: 12,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              This updates the appointment status only.
              Payment and settlement details remain unchanged.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                type="button"
                className="hab-icon-btn"
                disabled={saving}
                onClick={() => setPendingChange(null)}
              >
                Back
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={confirmStatusUpdate}
                style={{
                  padding: '11px 16px',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#fff',
                  background: '#6366f1',
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving
                  ? 'Updating…'
                  : 'Confirm Update'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================
          CANCEL BOOKING MODAL
          ============================================ */}

      <Modal
        open={!!cancelTarget}
        onClose={() => {
          if (!saving) setCancelTarget(null)
        }}
        title="Cancel Booking"
        size="sm"
      >
        {cancelTarget && (
          <div style={{ display: 'grid', gap: 15 }}>
            <p
              style={{
                fontSize: 13,
                color: '#475569',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Cancel booking{' '}
              <strong>
                {cancelTarget.bookingId}
              </strong>
              ? The existing refund and cancellation
              policy will apply.
            </p>

            <label
              style={{
                display: 'grid',
                gap: 7,
                fontSize: 12,
                fontWeight: 700,
                color: '#334155',
              }}
            >
              Cancellation Reason

              <textarea
                rows={3}
                maxLength={400}
                value={cancelReason}
                onChange={(event) =>
                  setCancelReason(event.target.value)
                }
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  padding: 12,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  resize: 'vertical',
                }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                type="button"
                className="hab-icon-btn"
                disabled={saving}
                onClick={() => setCancelTarget(null)}
              >
                Keep Booking
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={confirmCancellation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 15px',
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                <XCircle size={15} />
                {saving
                  ? 'Cancelling…'
                  : 'Cancel Booking'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
