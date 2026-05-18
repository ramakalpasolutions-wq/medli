'use client'

import { useState, useEffect } from 'react'
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
  TriangleAlert,
  CheckCircle2,
  PartyPopper,
  XCircle,
  Clock3,
  Ban,
  CircleDot,
  CalendarDays,
  Phone,
  Video,
  IndianRupee,
  FileText,
  UserRound,
} from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => {
    setM(true)
  }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `
  @keyframes bk-spin  { to { transform: rotate(360deg) } }
  @keyframes modal-in { from{opacity:0;transform:scale(.95) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
`

function FilterPill({ label, active, onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '8px 12px',
        borderRadius: 10,
        border: 'none',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        flexShrink: 0,
        background: active
          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
          : h
            ? '#e2e8f0'
            : '#f1f5f9',
        color: active ? '#fff' : '#64748b',
        boxShadow: active ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      {label}
    </button>
  )
}

function SearchInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 320 }}>
      <span
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Search size={16} strokeWidth={2.2} />
      </span>

      <input
        value={value}
        onChange={onChange}
        placeholder="Search bookings…"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '10px 14px 10px 38px',
          fontSize: 13,
          fontFamily: 'inherit',
          borderRadius: 12,
          boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff',
          color: '#0f172a',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
        }}
      />
    </div>
  )
}

function RefreshBtn({ onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        border: 'none',
        background: h ? '#e2e8f0' : '#f1f5f9',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background .15s ease',
        flexShrink: 0,
        color: '#475569',
      }}
    >
      <RefreshCw size={16} strokeWidth={2.2} />
    </button>
  )
}

function ViewBtn({ onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '4px 9px',
        borderRadius: 7,
        border: 'none',
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background .13s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Eye size={13} strokeWidth={2.2} />
      View
    </button>
  )
}

function RowCancelBtn({ onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 8px',
        borderRadius: 7,
        border: 'none',
        cursor: 'pointer',
        background: h ? 'rgba(239,68,68,0.1)' : 'transparent',
        color: h ? '#ef4444' : '#f87171',
        transition: 'all .12s ease',
      }}
    >
      Cancel
    </button>
  )
}

function CancelModal({ open, onClose, onConfirm, loading }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <style>{`@keyframes modal-in2{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>

      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          animation: 'modal-in2 .22s ease',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 12px',
              borderRadius: '50%',
              background: '#fff7ed',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TriangleAlert size={28} strokeWidth={2.2} />
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Cancel Booking?
          </h3>

          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
            A refund will be calculated based on the cancellation policy.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 12,
              border: '1.5px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Keep
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 12,
              border: 'none',
              background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: loading ? '#94a3b8' : '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {loading && (
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  animation: 'bk-spin .7s linear infinite',
                  display: 'inline-block',
                }}
              />
            )}
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  )
}

function BookingDetail({ b, mounted }) {
  const fmtRs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

  const statusIcon = {
    confirmed: CheckCircle2,
    completed: PartyPopper,
    cancelled: XCircle,
    pending_payment: Clock3,
    no_show: Ban,
    refunded: IndianRupee,
    created: CircleDot,
  }

  const StatusIcon = statusIcon[b.status] || CalendarDays

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 14,
          flexWrap: 'wrap',
          background:
            b.status === 'completed' || b.status === 'confirmed'
              ? '#f0fdf4'
              : b.status === 'cancelled'
                ? '#fff1f2'
                : '#fffbeb',
          border: `1px solid ${
            b.status === 'completed' || b.status === 'confirmed'
              ? '#bbf7d0'
              : b.status === 'cancelled'
                ? '#fecaca'
                : '#fde68a'
          }`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color:
              b.status === 'completed' || b.status === 'confirmed'
                ? '#16a34a'
                : b.status === 'cancelled'
                  ? '#dc2626'
                  : '#ca8a04',
          }}
        >
          <StatusIcon size={24} strokeWidth={2.2} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: '#1e293b',
              margin: 0,
              fontFamily: 'monospace',
            }}
          >
            {b.bookingId}
          </p>

          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge variant={getStatusVariant(b.status)} size="sm" dot>
              {b.status?.replace(/_/g, ' ')}
            </Badge>
            <Badge variant={b.type === 'lab' ? 'success' : b.type === 'online' ? 'purple' : 'info'} size="sm">
              {b.type}
            </Badge>
          </div>
        </div>
      </div>

      {(b.userName || b.userPhone) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <UserRound size={18} strokeWidth={2.2} />
          </div>

          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              {b.userName || 'Unknown Patient'}
            </p>
            {b.userPhone && (
              <p
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  margin: '2px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Phone size={12} strokeWidth={2.2} />
                +91 {b.userPhone}
              </p>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 10,
        }}
      >
        {[
          { label: 'Base Fee', value: fmtRs(b.baseFee) },
          { label: 'Platform Fee', value: fmtRs(b.platformFee) },
          { label: 'GST', value: fmtRs(b.gst) },
          { label: 'Total', value: fmtRs(b.totalAmount), bold: true },
        ].map((r) => (
          <div
            key={r.label}
            style={{
              padding: '10px 12px',
              textAlign: 'center',
              background: r.bold ? '#f0fdf4' : '#f8fafc',
              borderRadius: 12,
              border: `1px solid ${r.bold ? '#bbf7d0' : '#f1f5f9'}`,
            }}
          >
            <p style={{ fontSize: 10, color: r.bold ? '#16a34a' : '#94a3b8', margin: '0 0 3px' }}>
              {r.label}
            </p>
            <p
              style={{
                fontSize: r.bold ? 16 : 14,
                fontWeight: r.bold ? 800 : 600,
                color: r.bold ? '#15803d' : '#1e293b',
                margin: 0,
              }}
            >
              {r.value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
        }}
      >
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Payment Status</span>
        <Badge variant={getStatusVariant(b.paymentStatus)} size="sm" dot>
          {b.paymentStatus?.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div
        style={{
          background: '#f8fafc',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            background: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>Booking Details</p>
        </div>

        {[
          {
            l: 'Date & Time',
            v:
              mounted && b.startTime
                ? new Date(b.startTime).toLocaleString('en-IN', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })
                : '—',
          },
          { l: 'Doctor', v: b.doctorName ? `Dr. ${b.doctorName}` : '—' },
          { l: 'Coupon Code', v: b.couponCode || '—' },
          { l: 'Coupon Disc.', v: b.couponDiscount > 0 ? fmtRs(b.couponDiscount) : '—' },
          { l: 'Platform Fee%', v: `${b.platformFeePercent || 0}%` },
          { l: 'Is Settled', v: b.isSettled ? '✓ Yes' : 'No' },
          { l: 'Meet Link', v: b.meetLink ? 'Available' : '—' },
        ]
          .filter((r) => r.v && r.v !== '—')
          .map((row) => (
            <div
              key={row.l}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 16px',
                borderBottom: '1px solid #f8fafc',
                flexWrap: 'wrap',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 12, color: '#64748b' }}>{row.l}</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1e293b',
                  wordBreak: 'break-word',
                  textAlign: 'right',
                }}
              >
                {row.v}
              </span>
            </div>
          ))}
      </div>

      {b.cancellationReason && (
        <div
          style={{
            background: '#fff1f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '12px 16px',
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', margin: '0 0 4px' }}>
            Cancellation Reason
          </p>
          <p style={{ fontSize: 13, color: '#991b1b', margin: 0 }}>{b.cancellationReason}</p>
        </div>
      )}

      {b.doctorNotes && (
        <div
          style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 12,
            padding: '12px 16px',
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', margin: '0 0 4px' }}>
            Doctor Notes
          </p>
          <p style={{ fontSize: 13, color: '#0c4a6e', margin: 0, lineHeight: 1.6 }}>
            {b.doctorNotes}
          </p>
        </div>
      )}

      {b.meetLink && b.type === 'online' && (
        <a
          href={b.meetLink}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px',
            borderRadius: 12,
            background: 'linear-gradient(135deg,#10b981,#059669)',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
          }}
        >
          <Video size={16} strokeWidth={2.3} />
          Join Meet Link
        </a>
      )}

      <div
        style={{
          padding: '10px 14px',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {[
          { l: 'Booking ID', v: b.bookingId },
          { l: 'Internal ID', v: b.id },
          { l: 'User ID', v: b.userId },
        ].map((r) => (
          <div
            key={r.l}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.l}</span>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#64748b',
                wordBreak: 'break-all',
                textAlign: 'right',
                maxWidth: '60%',
              }}
            >
              {r.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'pending_payment', label: 'Pending' },
  { key: 'no_show', label: 'Not Attended' },
]

export default function HospitalAdminBookings() {
  const toast = useToast()
  const mounted = useMounted()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [targetId, setTargetId] = useState(null)
  const [viewItem, setViewItem] = useState(null)

  const qs = new URLSearchParams({ page, limit: 20 })
  if (statusFilter) qs.set('status', statusFilter)
  if (search) qs.set('search', search)

  const { data, isLoading, mutate } = useSWR(`/api/bookings?${qs}`, fetcher)
  const bookings = data?.bookings || []
  const totalPages = data?.pagination?.totalPages || 1
  const total = data?.pagination?.total || 0

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch(`/api/bookings/${targetId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Cancelled by hospital admin' }),
      })
      const json = await res.json()
      json.success ? toast.success('Booking cancelled') : toast.error(json.error)
      mutate()
    } catch {
      toast.error('Failed to cancel')
    } finally {
      setCancelling(false)
      setCancelOpen(false)
      setTargetId(null)
    }
  }

  const CANCELLABLE = ['created', 'confirmed', 'pending_payment']

  const columns = [
    {
      key: 'userName',
      header: 'Patient',
      render: (v, row) => (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>
            {v || 'Unknown'}
          </p>
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', margin: '2px 0 0' }}>
            {row.bookingId}
          </p>
        </div>
      ),
    },
    {
      key: 'doctorName',
      header: 'Doctor',
      render: (v) =>
        v ? (
          <span style={{ fontSize: 13, color: '#475569' }}>Dr. {v}</span>
        ) : (
          <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
        ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (v) => (
        <Badge variant={v === 'lab' ? 'success' : v === 'online' ? 'purple' : 'info'} size="sm">
          {v}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => (
        <Badge variant={getStatusVariant(v)} size="sm" dot>
          {v?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (v) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
          ₹{Number(v || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'startTime',
      header: 'Date',
      render: (v) =>
        mounted ? (
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <ViewBtn onClick={() => setViewItem(row)} />
          {CANCELLABLE.includes(row.status) && (
            <RowCancelBtn
              onClick={() => {
                setTargetId(row.id)
                setCancelOpen(true)
              }}
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Bookings"
        subtitle={`${total} booking${total !== 1 ? 's' : ''} · ${statusFilter || 'All'}`}
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Bookings' }]}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />

        {STATUS_FILTERS.map((f) => (
          <FilterPill
            key={f.key}
            label={f.label}
            active={statusFilter === f.key}
            onClick={() => {
              setStatusFilter(f.key)
              setPage(1)
            }}
          />
        ))}

        <RefreshBtn onClick={() => mutate()} />
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No bookings found"
        emptyMessage={statusFilter ? `No ${statusFilter.replace(/_/g, ' ')} bookings` : 'No bookings yet'}
      />

      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={`Booking — ${viewItem?.bookingId || ''}`}
        size="md"
      >
        {viewItem && <BookingDetail b={viewItem} mounted={mounted} />}
      </Modal>

      <CancelModal
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false)
          setTargetId(null)
        }}
        onConfirm={handleCancel}
        loading={cancelling}
      />
    </>
  )
}