'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import DateRangePicker from '@/components/ui/DateRangePicker'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes bk-spin{to{transform:rotate(360deg)}}`

function FilterSelect({ value, onChange, placeholder, children }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={onChange} onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          padding: '10px 30px 10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: value ? '#0f172a' : '#94a3b8', outline: 'none',
          appearance: 'none', cursor: 'pointer',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', boxSizing: 'border-box',
        }}>
        <option value="">{placeholder}</option>
        {children}
      </select>
      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#94a3b8', pointerEvents: 'none' }}>▼</span>
    </div>
  )
}

function SearchInput({ value, onChange }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ position: 'relative', width: 240 }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', color: '#94a3b8' }}>🔍</span>
      <input value={value} onChange={onChange} placeholder="Search bookings…"
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: '100%', padding: '10px 14px 10px 38px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, boxSizing: 'border-box',
          border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
        }}
      />
    </div>
  )
}

function ABtn({ label, variant, onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  const V = {
    ghost:  { base: 'transparent', hov: 'rgba(99,102,241,0.07)', color: '#6366f1', border: 'none' },
    danger: { base: 'rgba(239,68,68,0.07)', hov: 'rgba(239,68,68,0.14)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' },
  }
  const s = V[variant] || V.ghost
  return (
    <button onClick={onClick} disabled={isLoading} onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 9px', borderRadius: 8, border: s.border || 'none',
        background: h ? s.hov : s.base, color: s.color,
        fontSize: 11, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all .13s ease', display: 'flex', alignItems: 'center', gap: 4,
      }}>
      {isLoading && <span style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'bk-spin .7s linear infinite', display: 'inline-block', opacity: 0.6 }} />}
      {label}
    </button>
  )
}

function ConfirmModal({ open, onClose, onConfirm, title, message, loading, details }) {
  const [h, setH] = useState(false)
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
          {message && <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{message}</p>}
        </div>
        {details && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '4px 0', marginBottom: 16 }}>
            {Object.entries(details).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
            style={{
              flex: 1, padding: '10px', borderRadius: 12, border: 'none',
              background: loading ? '#e2e8f0' : h ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: loading ? '#94a3b8' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'bk-spin .7s linear infinite', display: 'inline-block' }} />}
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BookingsPage() {
  const [page,          setPage]         = useState(1)
  const [search,        setSearch]       = useState('')
  const [type,          setType]         = useState('')
  const [status,        setStatus]       = useState('')
  const [dateRange,     setDateRange]    = useState({ preset: 'last30', dateFrom: '', dateTo: '' })
  const [viewBooking,   setViewBooking]  = useState(null)
  const [cancelBooking, setCancelBooking] = useState(null)
  const [cancelling,    setCancelling]   = useState(false)
  const mounted = useMounted()
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)
  if (type)   qs.set('type', type)
  if (status) qs.set('status', status)
  const { data, isLoading, mutate } = useSWR(`/api/bookings?${qs}`, fetcher)

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res  = await fetch(`/api/bookings/${cancelBooking.id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ reason: 'Cancelled by admin' }),
      })
      const json = await res.json()
      json.success
        ? toast.success(`Cancelled. Refund: ₹${json.data?.refundAmount || 0}`)
        : toast.error(json.error)
      mutate()
    } catch { toast.error('Cancel failed') }
    setCancelling(false)
    setCancelBooking(null)
  }

  const columns = [
    { key: 'bookingId', header: 'ID', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span> },
    { key: 'type',   header: 'Type',   render: (v) => <Badge variant="info" size="sm">{v}</Badge> },
    { key: 'status', header: 'Status', render: (v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'totalAmount', header: 'Amount', render: (v) => <span style={{ fontSize: 13, fontWeight: 600 }}>₹{(v || 0).toLocaleString('en-IN')}</span> },
    { key: 'startTime',   header: 'Date',   render: (v) => mounted ? <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(v).toLocaleDateString('en-IN')}</span> : '—' },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 5 }}>
          <ABtn label="👁 View" variant="ghost" onClick={() => setViewBooking(row)} />
          {!['cancelled','completed','refunded'].includes(row.status) && (
            <ABtn label="✕ Cancel" variant="danger" onClick={() => setCancelBooking(row)} />
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
        subtitle="All platform bookings"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Bookings' }]}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <FilterSelect value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} placeholder="All Types">
          <option value="hospital">Hospital</option>
          <option value="online">Online</option>
          <option value="lab">Lab</option>
        </FilterSelect>
        <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} placeholder="All Status">
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending_payment">Pending</option>
        </FilterSelect>
      </div>

      <div style={{ marginBottom: 16 }}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <DataTable columns={columns} data={data?.bookings || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />

      {/* View modal */}
      <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title={`Booking ${viewBooking?.bookingId}`} size="md">
        {viewBooking && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {Object.entries({
              Type:      viewBooking.type,
              Status:    viewBooking.status,
              Payment:   viewBooking.paymentStatus,
              'Base Fee': `₹${viewBooking.baseFee}`,
              'Platform Fee': `₹${viewBooking.platformFee}`,
              GST:       `₹${viewBooking.gst}`,
              Total:     `₹${viewBooking.totalAmount}`,
              Date:      mounted ? new Date(viewBooking.startTime).toLocaleString('en-IN') : '—',
            }).map(([k, v]) => (
              <div key={k} style={{ padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{k}</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', margin: '2px 0 0', textTransform: 'capitalize' }}>{v}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Cancel confirm */}
      <ConfirmModal
        open={!!cancelBooking}
        onClose={() => setCancelBooking(null)}
        onConfirm={handleCancel}
        title="Cancel Booking?"
        message="Refund will be calculated based on cancellation policy."
        loading={cancelling}
        details={{ ID: cancelBooking?.bookingId, Amount: `₹${cancelBooking?.totalAmount}` }}
      />
    </>
  )
}