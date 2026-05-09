'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'
import DateRangePicker from '@/components/ui/DateRangePicker'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function ViewBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', borderRadius: 8, border: 'none',
        background: h ? 'rgba(249,115,22,0.1)' : 'transparent',
        color: '#f97316', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'background .13s ease',
      }}
    >
      👁 View
    </button>
  )
}

function FSelect({ value, onChange, placeholder, children }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={onChange}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          padding: '10px 30px 10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#f97316' : '#e2e8f0'}`,
          background: '#fff', color: value ? '#0f172a' : '#94a3b8', outline: 'none',
          appearance: 'none', cursor: 'pointer',
          boxShadow: f ? '0 0 0 3px rgba(249,115,22,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', boxSizing: 'border-box',
        }}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <span style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        fontSize: 11, color: '#94a3b8', pointerEvents: 'none',
      }}>▼</span>
    </div>
  )
}

/* ─── Booking Detail ─────────────────────────────────────────────────── */
function BookingDetail({ b, mounted }) {
  const statusEmoji = {
    confirmed: '✅', completed: '🎉', cancelled: '❌',
    pending_payment: '⏳', no_show: '🚫', refunded: '💸', created: '🔵',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Status banner */}
      <div style={{
        padding: '14px 16px', borderRadius: 14, flexWrap: 'wrap',
        background: b.status === 'completed' || b.status === 'confirmed'
          ? '#f0fdf4' : b.status === 'cancelled' ? '#fff1f2' : '#fffbeb',
        border: `1px solid ${
          b.status === 'completed' || b.status === 'confirmed' ? '#bbf7d0'
          : b.status === 'cancelled' ? '#fecaca' : '#fde68a'
        }`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 28 }}>{statusEmoji[b.status] || '📅'}</span>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: 0 }}>
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

      {/* Amount breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 10,
      }}>
        {[
          { label: 'Base Fee',     value: `₹${Number(b.baseFee || 0).toLocaleString('en-IN')}` },
          { label: 'Platform Fee', value: `₹${Number(b.platformFee || 0).toLocaleString('en-IN')}` },
          { label: 'GST',          value: `₹${Number(b.gst || 0).toLocaleString('en-IN')}` },
          { label: 'Total',        value: `₹${Number(b.totalAmount || 0).toLocaleString('en-IN')}`, bold: true },
        ].map((r) => (
          <div key={r.label} style={{
            padding: '10px 12px', background: r.bold ? '#fff7ed' : '#f8fafc',
            borderRadius: 12, border: `1px solid ${r.bold ? '#fed7aa' : '#f1f5f9'}`,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 11, color: r.bold ? '#ea580c' : '#94a3b8', margin: '0 0 3px' }}>{r.label}</p>
            <p style={{ fontSize: r.bold ? 16 : 14, fontWeight: r.bold ? 800 : 600, color: r.bold ? '#c2410c' : '#1e293b', margin: 0 }}>
              {r.value}
            </p>
          </div>
        ))}
      </div>

      {/* Payment */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: '#f8fafc', borderRadius: 12,
        border: '1px solid #e2e8f0',
      }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Payment Status</span>
        <Badge variant={getStatusVariant(b.paymentStatus)} size="sm" dot>
          {b.paymentStatus?.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Details */}
      <div style={{
        background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>Booking Details</p>
        </div>
        <div style={{ padding: '4px 0' }}>
          {[
            { l: 'Date',         v: mounted && b.startTime ? new Date(b.startTime).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : '—' },
            { l: 'Coupon Code',  v: b.couponCode || '—' },
            { l: 'Coupon Disc',  v: b.couponDiscount ? `₹${Number(b.couponDiscount).toLocaleString('en-IN')}` : '—' },
            { l: 'Platform Fee%',v: `${b.platformFeePercent || 0}%` },
            { l: 'GST %',        v: `${b.gstPercent || 18}%` },
            { l: 'Is Settled',   v: b.isSettled ? '✓ Yes' : 'No' },
            { l: 'Timezone',     v: b.timezone || 'Asia/Kolkata' },
          ].filter((r) => r.v !== '—').map((row) => (
            <div key={row.l} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 16px', borderBottom: '1px solid #f8fafc', flexWrap: 'wrap', gap: 4,
            }}>
              <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{row.l}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', wordBreak: 'break-word', textAlign: 'right' }}>
                {row.v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor notes */}
      {b.doctorNotes && (
        <div style={{
          background: '#f0f9ff', border: '1px solid #bae6fd',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', margin: '0 0 4px' }}>
            Doctor Notes
          </p>
          <p style={{ fontSize: 13, color: '#0c4a6e', margin: 0, lineHeight: 1.6 }}>
            {b.doctorNotes}
          </p>
        </div>
      )}

      {/* Cancellation */}
      {b.cancellationReason && (
        <div style={{
          background: '#fff1f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', margin: '0 0 4px' }}>
            Cancellation Reason
          </p>
          <p style={{ fontSize: 13, color: '#991b1b', margin: 0 }}>{b.cancellationReason}</p>
        </div>
      )}

      {/* IDs */}
      <div style={{
        padding: '10px 14px', background: '#f8fafc',
        borderRadius: 12, border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {[
          { l: 'Booking ID',  v: b.bookingId  },
          { l: 'Internal ID', v: b.id         },
          { l: 'User ID',     v: b.userId     },
          { l: 'Doctor ID',   v: b.doctorId   || '—' },
          { l: 'Hospital ID', v: b.hospitalId || '—' },
          { l: 'Lab ID',      v: b.labId      || '—' },
        ].map((r) => (
          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.l}</span>
            <span style={{
              fontSize: 11, fontFamily: 'monospace', color: '#64748b',
              wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%',
            }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegionalBookingsPage() {
  const [page,      setPage]      = useState(1)
  const [type,      setType]      = useState('')
  const [status,    setStatus]    = useState('')
  const [dateRange, setDateRange] = useState({ preset: 'last30', dateFrom: '', dateTo: '' })
  const [viewItem,  setViewItem]  = useState(null)
  const mounted = useMounted()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (type)               qs.set('type',     type)
  if (status)             qs.set('status',   status)
  if (dateRange.dateFrom) qs.set('dateFrom', dateRange.dateFrom)
  if (dateRange.dateTo)   qs.set('dateTo',   dateRange.dateTo)

  const { data, isLoading } = useSWR(`/api/bookings?${qs}`, fetcher)

  const bookings   = data?.bookings   || []
  const totalPages = data?.pagination?.totalPages || 1
  const total      = data?.pagination?.total      || 0

  const columns = [
    {
      key: 'bookingId', header: 'Booking ID',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: '#475569' }}>{v}</span>
      ),
    },
    {
      key: 'type', header: 'Type',
      render: (v) => (
        <Badge variant={v === 'lab' ? 'success' : v === 'online' ? 'purple' : 'info'} size="sm">{v}</Badge>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (v) => (
        <Badge variant={getStatusVariant(v)} size="sm" dot>{v?.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'paymentStatus', header: 'Payment',
      render: (v) => (
        <Badge variant={getStatusVariant(v)} size="sm">{v?.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'totalAmount', header: 'Total',
      render: (v) => (
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
          ₹{Number(v || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'startTime', header: 'Date',
      render: (v) => mounted
        ? <span style={{ fontSize: 12, color: '#64748b' }}>
            {new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        : '—',
    },
    {
      key: 'isSettled', header: 'Settled',
      render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm">{v ? 'Yes' : 'No'}</Badge>,
    },
    {
      key: 'actions', header: '',
      render: (_, row) => <ViewBtn onClick={() => setViewItem(row)} />,
    },
  ]

  return (
    <div>
      <AdminHeader
        title="Bookings"
        subtitle={`${total} booking${total !== 1 ? 's' : ''} in your region (read-only)`}
        breadcrumbs={[{ label: 'Regional', href: '/regional/dashboard' }, { label: 'Bookings' }]}
      />

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <FSelect value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} placeholder="All Types">
          <option value="hospital">Hospital</option>
          <option value="online">Online</option>
          <option value="lab">Lab</option>
        </FSelect>
        <FSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} placeholder="All Status">
          <option value="created">Created</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="no_show">No Show</option>
          <option value="refunded">Refunded</option>
        </FSelect>
        {(type || status) && (
          <button
            onClick={() => { setType(''); setStatus(''); setPage(1) }}
            style={{
              padding: '10px 14px', borderRadius: 12,
              border: '1.5px solid #fca5a5', background: '#fff1f2',
              color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Clear ✕
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No bookings found"
        emptyMessage="Bookings in your region will appear here"
      />

      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={`Booking — ${viewItem?.bookingId || ''}`}
        size="md"
      >
        {viewItem && <BookingDetail b={viewItem} mounted={mounted} />}
      </Modal>
    </div>
  )
}