
'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'
import {
  Search,
  RefreshCw,
  Eye,
  ChevronDown,
  UserRound,
  CalendarDays,
  Phone,
  Mail,
  Stethoscope,
  IndianRupee,
  Video,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

// ============================================================
// STATUS CONSTANTS
// ============================================================

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

const CANCELLABLE = new Set([
  'created',
  'pending_payment',
  'confirmed',
])

const STATUS_LABELS = {
  created: 'Created',
  pending_payment: 'Pending Payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  no_show: 'Not Attended',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

function statusLabel(status) {
  return (
    STATUS_LABELS[status] ||
    String(status || 'Unknown').replaceAll('_', ' ')
  )
}

// Hospital Admin can manage appointment progress.
// Payment status must be verified by the payment workflow.

function availableStatuses(booking) {
  if (booking.paymentStatus !== 'paid') {
    return []
  }

  if (
    ['created', 'pending_payment'].includes(
      booking.status
    )
  ) {
    return ['confirmed']
  }

  if (booking.status === 'confirmed') {
    return ['completed', 'no_show']
  }

  return []
}

// ============================================================
// FORMATTERS
// ============================================================

function rupees(value) {
  return `₹${Number(value || 0).toLocaleString(
    'en-IN',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`
}

function dateTime(value, mounted) {
  if (!mounted || !value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

// ============================================================
// API FETCHER
// ============================================================

async function fetcher(url) {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  })

  const json = await response.json()

  if (
    !response.ok ||
    json?.success === false
  ) {
    throw new Error(
      json?.message ||
      json?.error ||
      'Failed to load bookings'
    )
  }

  return json?.data ?? json
}

// ============================================================
// COMMON BUTTON
// ============================================================

function ActionButton({
  children,
  onClick,
  disabled = false,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '9px 13px',
        borderRadius: 10,

        background: danger
          ? '#fff1f2'
          : '#f1f5f9',

        color: danger
          ? '#dc2626'
          : '#334155',

        border: `1px solid ${
          danger ? '#fecdd3' : '#e2e8f0'
        }`,

        fontWeight: 700,
        fontSize: 12,

        cursor: disabled
          ? 'not-allowed'
          : 'pointer',

        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  )
}

// ============================================================
// STATUS DROPDOWN
// ============================================================

function StatusDropdown({
  booking,
  onSelect,
  disabled = false,
}) {
  const allowed = availableStatuses(booking)

  const canCancel = CANCELLABLE.has(
    booking.status
  )

  const canChange =
    allowed.length > 0 || canCancel

  function handleChange(event) {
    event.stopPropagation()

    const next = event.target.value

    // Open confirmation instead of changing immediately.

    if (
      next !== booking.status &&
      next
    ) {
      onSelect(booking, next)
    }
  }

  return (
    <div
      style={{
        minWidth: 156,
        display: 'grid',
        gap: 5,
      }}
    >
      <div style={{ position: 'relative' }}>
        <select
          aria-label={`Update status for booking ${
            booking.bookingId || booking.id
          }`}
          value={booking.status}
          onClick={(event) =>
            event.stopPropagation()
          }
          onChange={handleChange}
          disabled={disabled || !canChange}
          style={{
            width: '100%',

            appearance: 'none',
            WebkitAppearance: 'none',

            border: '1px solid #c7d2fe',
            borderRadius: 10,

            background: canChange
              ? '#eef2ff'
              : '#f1f5f9',

            color: canChange
              ? '#4338ca'
              : '#64748b',

            padding: '9px 28px 9px 10px',
            outlineColor: '#6366f1',

            fontSize: 12,
            fontWeight: 700,

            cursor:
              disabled || !canChange
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {/* Current Status */}
          <option value={booking.status}>
            {statusLabel(booking.status)} (Current)
          </option>

          {/* Available Status Updates */}
          {allowed.map((status) => (
            <option
              key={status}
              value={status}
            >
              {status === 'confirmed'
                ? 'Confirm Booking'
                : status === 'completed'
                  ? 'Mark Completed'
                  : 'Mark Not Attended'}
            </option>
          ))}

          {/* Cancellation */}
          {canCancel && (
            <option value="cancelled">
              Cancel Booking
            </option>
          )}
        </select>

        <ChevronDown
          size={14}
          color="#64748b"
          style={{
            position: 'absolute',
            right: 9,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {!canChange && (
        <span
          style={{
            fontSize: 10,
            color: '#94a3b8',
          }}
        >
          No available status changes
        </span>
      )}

      {[
        'created',
        'pending_payment',
      ].includes(booking.status) &&
        booking.paymentStatus !== 'paid' && (
          <span
            style={{
              fontSize: 10,
              color: '#b45309',
            }}
          >
            Awaiting verified payment
          </span>
        )}
    </div>
  )
}

// ============================================================
// BOOKING DETAIL ROW
// ============================================================

function DetailRow({
  label,
  value,
  Icon,
}) {
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
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,

        padding: '9px 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,

          fontSize: 12,
          color: '#64748b',
        }}
      >
        {Icon && <Icon size={13} />}
        {label}
      </span>

      <span
        style={{
          fontSize: 12,
          color: '#1e293b',
          fontWeight: 600,
          textAlign: 'right',
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ============================================================
// BOOKING DETAIL MODAL CONTENT
// ============================================================

function BookingDetail({
  booking,
  mounted,
  onSelect,
  saving,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 15,
      }}
    >
      {/* Booking Summary */}

      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: 15,
          borderRadius: 14,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: '#0f172a',
            fontWeight: 800,
            fontFamily: 'monospace',
          }}
        >
          {booking.bookingId || booking.id}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 7,
            flexWrap: 'wrap',
            marginTop: 9,
          }}
        >
          <Badge
            variant={getStatusVariant(
              booking.status
            )}
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
            Payment: {statusLabel(
              booking.paymentStatus
            )}
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
            {booking.type || '—'}
          </Badge>
        </div>
      </div>

      {/* Patient & Appointment */}

      <section
        style={{
          padding: 15,
          border: '1px solid #e2e8f0',
          borderRadius: 14,
        }}
      >
        <h3
          style={{
            display: 'flex',
            gap: 7,
            alignItems: 'center',
            fontSize: 13,
            margin: '0 0 7px',
            color: '#1e293b',
          }}
        >
          <UserRound
            size={16}
            color="#6366f1"
          />

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
          value={dateTime(
            booking.startTime,
            mounted
          )}
          Icon={CalendarDays}
        />
      </section>

      {/* Payment Details */}

      <section
        style={{
          padding: 15,
          border: '1px solid #e2e8f0',
          borderRadius: 14,
        }}
      >
        <h3
          style={{
            display: 'flex',
            gap: 7,
            alignItems: 'center',
            fontSize: 13,
            margin: '0 0 7px',
            color: '#1e293b',
          }}
        >
          <IndianRupee
            size={16}
            color="#059669"
          />

          Payment & Other Details
        </h3>

        <DetailRow
          label="Base fee"
          value={rupees(booking.baseFee)}
        />

        <DetailRow
          label="Total amount"
          value={rupees(booking.totalAmount)}
        />

        <DetailRow
          label="Coupon"
          value={booking.couponCode || '—'}
        />

        <DetailRow
          label="Discount"
          value={rupees(
            booking.couponDiscount
          )}
        />

        <DetailRow
          label="Doctor notes"
          value={booking.doctorNotes}
        />

        <DetailRow
          label="Cancellation reason"
          value={booking.cancellationReason}
        />

        <DetailRow
          label="Internal ID"
          value={booking.id}
        />
      </section>

      {/* Online Consultation */}

      {booking.type === 'online' &&
        booking.meetLink && (
          <a
            href={booking.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#059669',
              color: 'white',
              borderRadius: 12,
              padding: 12,
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Video
              size={15}
              style={{
                display: 'inline',
                verticalAlign: '-3px',
                marginRight: 6,
              }}
            />

            Join Online Consultation
          </a>
        )}

      {/* Status Update Dropdown */}

      <section
        style={{
          padding: 15,
          borderRadius: 14,
          background: '#eef2ff',
          border: '1px solid #c7d2fe',
        }}
      >
        <h3
          style={{
            margin: '0 0 10px',
            fontSize: 13,
            fontWeight: 800,
            color: '#3730a3',
          }}
        >
          Update Booking Status
        </h3>

        <StatusDropdown
          booking={booking}
          onSelect={onSelect}
          disabled={saving}
        />
      </section>
    </div>
  )
}

// ============================================================
// MAIN HOSPITAL ADMIN BOOKINGS PAGE
// ============================================================

export default function HospitalAdminBookings() {
  const toast = useToast()

  const [mounted, setMounted] =
    useState(false)

  const [page, setPage] =
    useState(1)

  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('')

  const [viewItem, setViewItem] =
    useState(null)

  const [pendingChange, setPendingChange] =
    useState(null)

  const [cancelTarget, setCancelTarget] =
    useState(null)

  const [cancelReason, setCancelReason] =
    useState('Cancelled by hospital admin')

  const [saving, setSaving] =
    useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ==========================================================
  // BUILD BOOKINGS API QUERY
  // ==========================================================

  const qs = new URLSearchParams({
    page: String(page),
    limit: '20',
  })

  if (statusFilter) {
    qs.set('status', statusFilter)
  }

  if (search.trim()) {
    qs.set('search', search.trim())
  }

  // ==========================================================
  // FETCH BOOKINGS
  // ==========================================================

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR(
    `/api/bookings?${qs.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  // ==========================================================
  // NORMALIZE BOOKING DATA
  // ==========================================================

  const bookings = useMemo(() => {
    const list = Array.isArray(
      data?.bookings
    )
      ? data.bookings
      : []

    return list.map((booking) => ({
      ...booking,

      userName:
        booking.patientName ||
        booking.userName ||
        booking.patient?.name ||
        booking.user?.name ||
        'Patient',

      userPhone:
        booking.userPhone ||
        booking.patient?.phone ||
        booking.user?.phone ||
        '',

      userEmail:
        booking.userEmail ||
        booking.patient?.email ||
        booking.user?.email ||
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

  const total =
    data?.pagination?.total ?? 0

  const totalPages = Math.max(
    1,
    data?.pagination?.totalPages || 1
  )

  // ==========================================================
  // SELECT STATUS FROM DROPDOWN
  // ==========================================================

  function requestStatus(
    booking,
    nextStatus
  ) {
    if (
      saving ||
      !booking ||
      nextStatus === booking.status
    ) {
      return
    }

    // Cancellation uses its own API.

    if (nextStatus === 'cancelled') {
      if (
        !CANCELLABLE.has(booking.status)
      ) {
        return
      }

      setViewItem(null)

      setCancelReason(
        'Cancelled by hospital admin'
      )

      setCancelTarget(booking)

      return
    }

    // Verify the transition is available.

    if (
      !availableStatuses(
        booking
      ).includes(nextStatus)
    ) {
      return
    }

    setViewItem(null)

    setPendingChange({
      booking,
      nextStatus,
    })
  }

  // ==========================================================
  // SAVE BOOKING STATUS
  // ==========================================================

  async function confirmStatus() {
    if (
      saving ||
      !pendingChange
    ) {
      return
    }

    const {
      booking,
      nextStatus,
    } = pendingChange

    if (
      !availableStatuses(
        booking
      ).includes(nextStatus)
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
            'Content-Type':
              'application/json',
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
          'Booking status update failed'
        )
      }

      toast.success(
        `Booking marked ${statusLabel(
          nextStatus
        )}`
      )

      setPendingChange(null)

      await mutate()

    } catch (err) {
      toast.error(
        err.message ||
        'Could not update booking'
      )

    } finally {
      setSaving(false)
    }
  }

  // ==========================================================
  // CANCEL BOOKING
  // ==========================================================

  async function confirmCancel() {
    if (
      saving ||
      !cancelTarget
    ) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        `/api/bookings/${cancelTarget.id}/cancel`,
        {
          method: 'POST',

          credentials: 'include',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            reason:
              cancelReason.trim() ||
              'Cancelled by hospital admin',
          }),
        }
      )

      const json =
        await response.json()

      if (
        !response.ok ||
        json?.success === false
      ) {
        throw new Error(
          json?.message ||
          json?.error ||
          'Booking cancellation failed'
        )
      }

      toast.success(
        'Booking cancelled successfully'
      )

      setCancelTarget(null)

      await mutate()

    } catch (err) {
      toast.error(
        err.message ||
        'Could not cancel booking'
      )

    } finally {
      setSaving(false)
    }
  }

  // ==========================================================
  // BOOKINGS TABLE COLUMNS
  // ==========================================================

  const columns = [
    // Patient

    {
      key: 'userName',
      header: 'Patient',

      render: (value, booking) => (
        <div>
          <p
            style={{
              margin: 0,
              color: '#1e293b',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {value}
          </p>

          <p
            style={{
              margin: '4px 0 0',
              fontSize: 11,
              fontFamily: 'monospace',
              color: '#94a3b8',
            }}
          >
            {booking.bookingId}
          </p>
        </div>
      ),
    },

    // Doctor

    {
      key: 'doctorName',
      header: 'Doctor',

      render: (value) => (
        <span
          style={{
            fontSize: 12,
            color: '#475569',
          }}
        >
          {value
            ? `Dr. ${value}`
            : '—'}
        </span>
      ),
    },

    // Booking Type

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

    // Payment Status

    {
      key: 'paymentStatus',
      header: 'Payment',

      render: (value) => (
        <Badge
          size="sm"
          variant={
            getStatusVariant(value)
          }
          dot
        >
          {statusLabel(value)}
        </Badge>
      ),
    },

    // Current Booking Status

    {
      key: 'status',
      header: 'Booking Status',

      render: (value) => (
        <Badge
          size="sm"
          variant={
            getStatusVariant(value)
          }
          dot
        >
          {statusLabel(value)}
        </Badge>
      ),
    },

    // Amount

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
          {rupees(value)}
        </span>
      ),
    },

    // Appointment Date

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
          {dateTime(value, mounted)}
        </span>
      ),
    },

    // Status Update & View

    {
      key: 'actions',
      header: 'Update Status',

      render: (_, booking) => (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <StatusDropdown
            booking={booking}
            onSelect={requestStatus}
            disabled={saving}
          />

          <ActionButton
            onClick={() =>
              setViewItem(booking)
            }
            disabled={saving}
          >
            <Eye size={13} />
            View
          </ActionButton>
        </div>
      ),
    },
  ]

  // ==========================================================
  // RENDER PAGE
  // ==========================================================

  return (
    <>
      {/* Header */}

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

      {/* Search & Filters */}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 9,
          marginBottom: 20,
        }}
      >
        {/* Search Input */}

        <div
          style={{
            position: 'relative',
            flex: '1 1 190px',
            maxWidth: 320,
          }}
        >
          <Search
            size={16}
            color="#94a3b8"
            style={{
              position: 'absolute',
              left: 12,
              top: 12,
            }}
          />

          <input
            type="search"
            aria-label="Search bookings"
            placeholder="Search booking ID…"
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              )

              setPage(1)
            }}
            style={{
              width: '100%',
              boxSizing: 'border-box',

              borderRadius: 12,
              border: '1px solid #e2e8f0',

              padding:
                '10px 12px 10px 38px',

              fontSize: 13,
              outlineColor: '#6366f1',
            }}
          />
        </div>

        {/* Status Filters */}

        {STATUS_FILTERS.map(
          ({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatusFilter(value)
                setPage(1)
              }}
              style={{
                border: 'none',
                borderRadius: 10,

                padding: '9px 12px',

                fontSize: 12,
                fontWeight: 700,

                cursor: 'pointer',
                whiteSpace: 'nowrap',

                color:
                  statusFilter === value
                    ? '#fff'
                    : '#64748b',

                background:
                  statusFilter === value
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    : '#f1f5f9',
              }}
            >
              {label}
            </button>
          )
        )}

        {/* Refresh */}

        <ActionButton
          onClick={() => mutate()}
          disabled={saving}
        >
          <RefreshCw size={15} />
          Refresh
        </ActionButton>
      </div>

      {/* API Error */}

      {error && (
        <div
          role="alert"
          style={{
            padding: 14,
            borderRadius: 12,

            color: '#b91c1c',
            background: '#fff1f2',

            marginBottom: 14,

            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={16} />

          {error.message}
        </div>
      )}

      {/* Bookings Table */}

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
            ? `No ${statusLabel(
                statusFilter
              )} bookings`
            : 'No bookings yet'
        }
      />

      {/* ============================================
          VIEW BOOKING MODAL
          ============================================ */}

      <Modal
        open={!!viewItem}
        onClose={() =>
          setViewItem(null)
        }
        title={`Booking — ${
          viewItem?.bookingId || ''
        }`}
        size="md"
      >
        {viewItem && (
          <BookingDetail
            booking={viewItem}
            mounted={mounted}
            onSelect={requestStatus}
            saving={saving}
          />
        )}
      </Modal>

      {/* ============================================
          STATUS CONFIRMATION MODAL
          ============================================ */}

      <Modal
        open={!!pendingChange}
        onClose={() => {
          if (!saving) {
            setPendingChange(null)
          }
        }}
        title="Confirm Booking Status Update"
        size="sm"
      >
        {pendingChange && (
          <div
            style={{
              display: 'grid',
              gap: 16,
            }}
          >
            <div
              style={{
                background: '#eef2ff',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <p
                style={{
                  margin: '0 0 8px',
                  color: '#334155',
                  fontSize: 13,
                }}
              >
                Booking:{' '}

                <strong>
                  {pendingChange.booking
                    .bookingId ||
                    pendingChange.booking.id}
                </strong>
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#334155',
                }}
              >
                {statusLabel(
                  pendingChange.booking
                    .status
                )}

                {' → '}

                <strong>
                  {statusLabel(
                    pendingChange.nextStatus
                  )}
                </strong>
              </p>
            </div>

            <p
              style={{
                margin: 0,
                color: '#64748b',
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              This changes appointment status only.
              Payment and settlement status remain unchanged.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                gap: 9,
              }}
            >
              <ActionButton
                onClick={() =>
                  setPendingChange(null)
                }
                disabled={saving}
              >
                Back
              </ActionButton>

              <button
                type="button"
                disabled={saving}
                onClick={confirmStatus}
                style={{
                  padding: '10px 15px',

                  border: 'none',
                  borderRadius: 10,

                  background: '#6366f1',
                  color: '#fff',

                  fontSize: 13,
                  fontWeight: 700,

                  cursor: saving
                    ? 'wait'
                    : 'pointer',
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
          if (!saving) {
            setCancelTarget(null)
          }
        }}
        title="Cancel Booking"
        size="sm"
      >
        {cancelTarget && (
          <div
            style={{
              display: 'grid',
              gap: 14,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#334155',
                fontSize: 13,
              }}
            >
              Cancel booking{' '}

              <strong>
                {cancelTarget.bookingId ||
                  cancelTarget.id}
              </strong>

              ? The existing cancellation policy will apply.
            </p>

            <label
              style={{
                display: 'grid',
                gap: 6,

                color: '#334155',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Reason for cancellation

              <textarea
                value={cancelReason}
                onChange={(event) =>
                  setCancelReason(
                    event.target.value
                  )
                }
                rows={3}
                maxLength={400}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',

                  borderRadius: 10,
                  border: '1px solid #cbd5e1',

                  padding: 10,
                  fontFamily: 'inherit',
                }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                gap: 9,
              }}
            >
              <ActionButton
                onClick={() =>
                  setCancelTarget(null)
                }
                disabled={saving}
              >
                Keep Booking
              </ActionButton>

              <ActionButton
                onClick={confirmCancel}
                disabled={saving}
                danger
              >
                <XCircle size={14} />

                {saving
                  ? 'Cancelling…'
                  : 'Cancel Booking'}
              </ActionButton>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
