
'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'
import {
  Search, RefreshCw, Eye, CheckCircle2, PartyPopper,
  XCircle, Ban, Video, UserRound, AlertTriangle, Check, X,
} from 'lucide-react'

const fetcher = async (url) => {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  })
  const json = await response.json()
  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || json?.error || 'Request failed')
  }
  return json?.data ?? json
}

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'created', label: 'Created' },
  { key: 'pending_payment', label: 'Pending Payment' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'no_show', label: 'Not Attended' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
]

const STATUS_INFO = {
  confirmed: { label: 'Confirm Booking', Icon: CheckCircle2, color: '#4f46e5', bg: '#eef2ff' },
  completed: { label: 'Mark Completed', Icon: PartyPopper, color: '#047857', bg: '#ecfdf5' },
  no_show: { label: 'Not Attended', Icon: Ban, color: '#b45309', bg: '#fffbeb' },
}

const CANCELABLE = new Set(['created', 'pending_payment', 'confirmed'])

function allowedStatusChanges(booking) {
  if (
    (booking.status === 'created' || booking.status === 'pending_payment') &&
    booking.paymentStatus === 'paid'
  ) {
    return ['confirmed']
  }
  if (booking.status === 'confirmed') return ['completed', 'no_show']
  return []
}

const prettyStatus = (status) =>
  status === 'no_show'
    ? 'Not Attended'
    : String(status || 'Unknown').replaceAll('_', ' ').replace(/\b\w/g, (x) => x.toUpperCase())

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

function Button({ children, onClick, disabled, tone = 'neutral', small = false }) {
  const TONES = {
    neutral: { background: '#f1f5f9', color: '#334155' },
    primary: { background: '#6366f1', color: '#fff' },
    success: { background: '#059669', color: '#fff' },
    danger: { background: '#fee2e2', color: '#b91c1c' },
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, border: 'none', borderRadius: 9,
        padding: small ? '6px 9px' : '10px 14px',
        fontSize: small ? 11 : 13, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        whiteSpace: 'nowrap', ...TONES[tone],
      }}
    >
      {children}
    </button>
  )
}

function StatusActions({ booking, busy, onRequest, onCancel, compact = false }) {
  const changes = allowedStatusChanges(booking)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      {changes.map((status) => {
        const { Icon, label, color, bg } = STATUS_INFO[status]
        return (
          <button
            key={status}
            type="button"
            disabled={busy}
            onClick={() => onRequest(booking, status)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontWeight: 700, fontSize: compact ? 11 : 12,
              padding: compact ? '6px 8px' : '9px 11px',
              background: bg, color, border: `1px solid ${color}22`,
              borderRadius: 9, cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.5 : 1, whiteSpace: 'nowrap',
            }}
          >
            <Icon size={compact ? 12 : 14} />
            {label}
          </button>
        )
      })}
      {CANCELABLE.has(booking.status) && (
        <Button small={compact} tone="danger" disabled={busy} onClick={() => onCancel(booking)}>
          <X size={13} /> Cancel
        </Button>
      )}
      {changes.length === 0 && !CANCELABLE.has(booking.status) && (
        <span style={{ fontSize: 11, color: '#94a3b8' }}>No further actions</span>
      )}
      {changes.length === 0 && booking.paymentStatus !== 'paid' &&
        ['created', 'pending_payment'].includes(booking.status) && (
          <span style={{ fontSize: 11, color: '#b45309' }}>Awaiting payment</span>
        )}
    </div>
  )
}

function DetailLine({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 650, textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  )
}

function BookingDetail({ booking, onStatus, onCancel, busy }) {
  const date = booking.startTime
    ? new Date(booking.startTime).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short',
      })
    : 'Not scheduled'

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{booking.bookingId || booking.id}</div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
          <Badge variant={getStatusVariant(booking.status)} size="sm" dot>{prettyStatus(booking.status)}</Badge>
          <Badge variant={getStatusVariant(booking.paymentStatus)} size="sm" dot>
            Payment: {prettyStatus(booking.paymentStatus)}
          </Badge>
          <Badge variant={booking.type === 'lab' ? 'success' : booking.type === 'online' ? 'purple' : 'info'} size="sm">
            {booking.type}
          </Badge>
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: '#334155' }}>
          <UserRound size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }} />Patient Information
        </h3>
        <DetailLine label="Patient" value={booking.userName} />
        <DetailLine label="Phone" value={booking.userPhone} />
        <DetailLine label="Email" value={booking.userEmail} />
        <DetailLine label="Doctor" value={booking.doctorName ? `Dr. ${booking.doctorName}` : '—'} />
        <DetailLine label="Hospital" value={booking.hospitalName} />
        <DetailLine label="Appointment" value={date} />
      </div>

      <div style={{ padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: '#334155' }}>Payment & Booking</h3>
        <DetailLine label="Base fee" value={money(booking.baseFee)} />
        <DetailLine label="Total amount" value={money(booking.totalAmount)} />
        <DetailLine label="Coupon" value={booking.couponCode || '—'} />
        <DetailLine label="Discount" value={money(booking.couponDiscount)} />
        <DetailLine label="Booking ID" value={booking.bookingId} />
        <DetailLine label="Doctor notes" value={booking.doctorNotes} />
        <DetailLine label="Cancellation reason" value={booking.cancellationReason} />
      </div>

      {booking.type === 'online' && booking.meetLink && (
        <a href={booking.meetLink} target="_blank" rel="noopener noreferrer" style={{
          textAlign: 'center', textDecoration: 'none', padding: 12,
          background: '#059669', color: '#fff', fontWeight: 700, borderRadius: 12,
        }}><Video size={16} style={{ display: 'inline', verticalAlign: '-3px' }} /> Join Meet</a>
      )}

      <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800 }}>Update Booking Status</h3>
        <StatusActions booking={booking} busy={busy} onRequest={onStatus} onCancel={onCancel} />
      </div>
    </div>
  )
}

export default function HospitalAdminBookings() {
  const toast = useToast()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewItem, setViewItem] = useState(null)
  const [pendingChange, setPendingChange] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('Cancelled by hospital admin')
  const [saving, setSaving] = useState(false)

  const query = new URLSearchParams({ page: String(page), limit: '20' })
  if (statusFilter) query.set('status', statusFilter)
  if (search.trim()) query.set('search', search.trim())

  const { data, error, isLoading, mutate } = useSWR(
    `/api/bookings?${query.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const bookings = useMemo(() =>
    (Array.isArray(data?.bookings) ? data.bookings : []).map((b) => ({
      ...b,
      userName: b.userName || b.patient?.name || b.user?.name || b.patientName || 'Patient',
      userPhone: b.userPhone || b.patient?.phone || b.user?.phone || '',
      userEmail: b.userEmail || b.patient?.email || b.user?.email || '',
      hospitalName: b.hospitalName || b.hospital?.name || '',
      doctorName: b.doctorName || b.doctor?.name || '',
    })),
    [data]
  )

  const total = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.totalPages || 1

  const askStatus = (booking, status) => {
    if (!allowedStatusChanges(booking).includes(status)) return
    setViewItem(null)
    setPendingChange({ booking, status })
  }

  const askCancel = (booking) => {
    if (!CANCELABLE.has(booking.status)) return
    setViewItem(null)
    setCancelTarget(booking)
    setCancelReason('Cancelled by hospital admin')
  }

  async function saveStatus() {
    if (!pendingChange || saving) return
    const { booking, status } = pendingChange
    if (!allowedStatusChanges(booking).includes(status)) return

    setSaving(true)
    try {
      const response = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await response.json()
      if (!response.ok || json?.success === false) {
        throw new Error(json?.message || json?.error || 'Status update failed')
      }
      toast.success(`Booking marked ${prettyStatus(status)}`)
      setPendingChange(null)
      await mutate()
    } catch (err) {
      toast.error(err.message || 'Unable to update booking status')
    } finally {
      setSaving(false)
    }
  }

  async function cancelBooking() {
    if (!cancelTarget || saving) return
    setSaving(true)
    try {
      const response = await fetch(`/api/bookings/${cancelTarget.id}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() || 'Cancelled by hospital admin' }),
      })
      const json = await response.json()
      if (!response.ok || json?.success === false) {
        throw new Error(json?.message || json?.error || 'Cancellation failed')
      }
      toast.success('Booking cancelled successfully')
      setCancelTarget(null)
      await mutate()
    } catch (err) {
      toast.error(err.message || 'Unable to cancel booking')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'userName', header: 'Patient',
      render: (name, b) => (
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{name || 'Unknown'}</p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{b.bookingId}</p>
        </div>
      ),
    },
    {
      key: 'doctorName', header: 'Doctor',
      render: (value) => <span style={{ fontSize: 12, color: '#475569' }}>{value ? `Dr. ${value}` : '—'}</span>,
    },
    {
      key: 'type', header: 'Type',
      render: (value) => <Badge size="sm" variant={value === 'online' ? 'purple' : value === 'lab' ? 'success' : 'info'}>{value || '—'}</Badge>,
    },
    {
      key: 'status', header: 'Status',
      render: (value, b) => (
        <div style={{ display: 'grid', gap: 5, justifyItems: 'start' }}>
          <Badge variant={getStatusVariant(value)} size="sm" dot>{prettyStatus(value)}</Badge>
          {b.paymentStatus !== 'paid' && ['created', 'pending_payment'].includes(value) && (
            <span style={{ fontSize: 10, color: '#b45309' }}>Payment pending</span>
          )}
        </div>
      ),
    },
    {
      key: 'totalAmount', header: 'Amount',
      render: (value) => <span style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>{money(value)}</span>,
    },
    {
      key: 'startTime', header: 'Appointment',
      render: (value) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {value ? new Date(value).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }) : '—'}
        </span>
      ),
    },
    {
      key: 'actions', header: 'Status / Actions',
      render: (_, b) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', minWidth: 160 }}>
          <Button small onClick={() => setViewItem(b)}><Eye size={13} /> View</Button>
          <StatusActions booking={b} busy={saving} compact onRequest={askStatus} onCancel={askCancel} />
        </div>
      ),
    },
  ]

  return (
    <>
      <AdminHeader
        title="Bookings"
        subtitle={`${total} booking${total === 1 ? '' : 's'} · ${statusFilter ? prettyStatus(statusFilter) : 'All'}`}
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Bookings' }]}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 170, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', top: 11, left: 12, color: '#94a3b8' }} />
          <input
            aria-label="Search bookings"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search booking IDs…"
            style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, padding: '10px 12px 10px 38px', border: '1px solid #e2e8f0', outlineColor: '#6366f1', fontSize: 13 }}
          />
        </div>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setStatusFilter(key); setPage(1) }}
            style={{
              padding: '9px 12px', border: 'none', borderRadius: 10,
              color: statusFilter === key ? '#fff' : '#64748b',
              background: statusFilter === key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f1f5f9',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >{label}</button>
        ))}
        <Button onClick={() => mutate()}><RefreshCw size={15} /> Refresh</Button>
      </div>

      {error && (
        <div role="alert" style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#b91c1c', background: '#fef2f2', padding: 14, borderRadius: 12, marginBottom: 16 }}>
          <AlertTriangle size={18} /> Failed to load bookings: {error.message}
        </div>
      )}

      <DataTable
        columns={columns}
        data={bookings}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No bookings found"
        emptyMessage={statusFilter ? `No ${prettyStatus(statusFilter)} bookings` : 'No bookings yet'}
      />

      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={`Booking — ${viewItem?.bookingId || ''}`}
        size="md"
      >
        {viewItem && <BookingDetail booking={viewItem} onStatus={askStatus} onCancel={askCancel} busy={saving} />}
      </Modal>

      <Modal
        open={!!pendingChange}
        onClose={() => { if (!saving) setPendingChange(null) }}
        title="Confirm Status Change"
        size="sm"
      >
        {pendingChange && (
          <div style={{ display: 'grid', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
              Change booking <strong>{pendingChange.booking.bookingId}</strong> from{' '}
              <strong>{prettyStatus(pendingChange.booking.status)}</strong> to{' '}
              <strong>{prettyStatus(pendingChange.status)}</strong>?
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              This updates appointment status only. Payment and settlement status are not modified.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button disabled={saving} onClick={() => setPendingChange(null)}>Back</Button>
              <Button disabled={saving} tone="primary" onClick={saveStatus}>
                <Check size={15} /> {saving ? 'Updating…' : 'Confirm Update'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!cancelTarget}
        onClose={() => { if (!saving) setCancelTarget(null) }}
        title="Cancel Booking"
        size="sm"
      >
        {cancelTarget && (
          <div style={{ display: 'grid', gap: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
              Cancel <strong>{cancelTarget.bookingId}</strong>? Refunds follow the existing cancellation policy.
            </p>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>
              Cancellation reason
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                maxLength={400}
                style={{ width: '100%', resize: 'vertical', border: '1px solid #cbd5e1', padding: 10, borderRadius: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button disabled={saving} onClick={() => setCancelTarget(null)}>Keep Booking</Button>
              <Button disabled={saving} tone="danger" onClick={cancelBooking}>
                <XCircle size={15} /> {saving ? 'Cancelling…' : 'Cancel Booking'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
