'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `@keyframes py-spin { to { transform: rotate(360deg) } }`

const PAYMENT_BADGE = {
  created:    'neutral',
  authorized: 'info',
  captured:   'success',
  refunded:   'purple',
  failed:     'danger',
}

function FilterSelect({ value, onChange, children }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={onChange}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          padding: '10px 30px 10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          appearance: 'none', cursor: 'pointer', boxSizing: 'border-box',
          transition: 'all .15s ease',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >{children}</select>
      <span style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)', fontSize: 11,
        color: '#94a3b8', pointerEvents: 'none',
      }}>▼</span>
    </div>
  )
}

function DateInput({ value, onChange }) {
  const [f, setF] = useState(false)
  return (
    <input
      type="date" value={value} onChange={onChange}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{
        padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
        borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
        background: '#fff', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
        transition: 'all .15s ease',
        boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    />
  )
}

function VerifyBtn({ onClick, loading: isLoading, disabled }) {
  const [h, setH] = useState(false)
  const off = isLoading || disabled
  return (
    <button onClick={onClick} disabled={off}
      onMouseEnter={() => !off && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', borderRadius: 100,
        border: `1.5px solid ${h ? '#6366f1' : 'rgba(99,102,241,0.3)'}`,
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.5 : 1,
        transition: 'all .13s ease',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
      {isLoading && (<span style={{
        width: 11, height: 11, borderRadius: '50%',
        border: '2px solid #6366f1', borderTopColor: 'transparent',
        animation: 'py-spin .7s linear infinite', display: 'inline-block',
      }} />)}
      {isLoading ? 'Verifying…' : 'Verify'}
    </button>
  )
}

function ViewBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '4px 9px', borderRadius: 7, border: 'none',
        background: h ? '#f1f5f9' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'background .13s ease',
      }}>
      👁 View
    </button>
  )
}

function PaymentDetail({ payment: p }) {
  const statusVariant = PAYMENT_BADGE[p.status] || 'neutral'
  const statusEmoji   = p.status === 'captured' ? '✅' : p.status === 'failed' ? '❌' : p.status === 'authorized' ? '🔐' : p.status === 'refunded' ? '↩️' : '🔵'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        padding: '14px 16px', borderRadius: 14,
        background: p.status === 'captured' ? '#f0fdf4'
          : p.status === 'failed' ? '#fff1f2'
          : p.status === 'refunded' ? '#faf5ff' : '#f0f9ff',
        border: `1px solid ${
          p.status === 'captured' ? '#bbf7d0'
          : p.status === 'failed' ? '#fecaca'
          : p.status === 'refunded' ? '#e9d5ff' : '#bae6fd'
        }`,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 32 }}>{statusEmoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <Badge variant={statusVariant} size="sm">{p.status?.toUpperCase()}</Badge>
            {p.razorpayInstrumentType && (
              <Badge variant="neutral" size="sm">{p.razorpayInstrumentType}</Badge>
            )}
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {p.amount ? `₹${Number(p.amount).toLocaleString('en-IN')}` : '—'}
          </p>
        </div>
      </div>

      <div style={{
        background: '#f8fafc', borderRadius: 14,
        border: '1px solid #e2e8f0', overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>
            🔗 Transaction References
          </p>
        </div>
        <div style={{ padding: '4px 0' }}>
          {[
            { l: 'Razorpay Order ID',    v: p.razorpayOrderId    || '—', mono: true },
            { l: 'Razorpay Payment ID',  v: p.razorpayPaymentId  || '—', mono: true },
            { l: 'Bank Reference (UTR)', v: p.razorpayBankRefId  || '—', mono: true },
            { l: 'Booking ID',           v: p.bookingId          || '—', mono: true },
            { l: 'User ID',              v: p.userId             || '—', mono: true },
          ].map((row) => (
            <div key={row.l} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', borderBottom: '1px solid #f8fafc',
              flexWrap: 'wrap', gap: 4,
            }}>
              <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{row.l}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#1e293b',
                fontFamily: row.mono ? 'monospace' : 'inherit',
                wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%',
              }}>{row.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
      }}>
        <InfoBox label="💰 Amount"     value={p.amount ? `₹${Number(p.amount).toLocaleString('en-IN')}` : '—'} />
        <InfoBox label="💱 Currency"   value={p.currency || 'INR'} />
        <InfoBox label="🏧 Instrument" value={p.razorpayInstrumentType || '—'} />
        <InfoBox label="📅 Date"       value={new Date(p.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} />
      </div>

      {p.razorpayFailureReason && (
        <div style={{
          background: '#fff1f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', margin: '0 0 4px' }}>
            ⚠️ Failure Reason
          </p>
          <p style={{ fontSize: 12, color: '#991b1b', margin: 0 }}>{p.razorpayFailureReason}</p>
        </div>
      )}

      {p.refunds?.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            🔄 Refunds ({p.refunds.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.refunds.map((r, i) => (
              <div key={i} style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 12, padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: 8,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: 0 }}>
                    ₹{Number(r.amount).toLocaleString('en-IN')}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{r.reason || '—'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge variant={r.status === 'refunded' ? 'success' : 'warning'} size="sm">
                    {r.status || '—'}
                  </Badge>
                  {r.utrNumber && (
                    <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b', margin: '4px 0 0' }}>
                      {r.utrNumber}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {p.webhookPayload && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            📦 Razorpay Webhook Payload
          </p>
          <pre style={{
            background: '#0f172a', color: '#e2e8f0', borderRadius: 12,
            padding: '14px 16px', fontSize: 10, fontFamily: 'monospace',
            overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            margin: 0, maxHeight: 200, overflowY: 'auto',
          }}>
            {JSON.stringify(p.webhookPayload, null, 2)}
          </pre>
        </div>
      )}

      <div style={{
        padding: '10px 14px', background: '#f8fafc',
        borderRadius: 12, border: '1px solid #e2e8f0',
      }}>
        <IDRow label="Payment ID" value={p.id} />
        <IDRow label="Updated"    value={new Date(p.updatedAt).toLocaleString('en-IN')} />
      </div>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9' }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 3px' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, wordBreak: 'break-word' }}>{value}</p>
    </div>
  )
}

function IDRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', wordBreak: 'break-all', textAlign: 'right', maxWidth: '70%' }}>{value}</span>
    </div>
  )
}

export default function PaymentsPage() {
  const toast = useToast()

  const [status,      setStatus]      = useState('')
  const [page,        setPage]        = useState(1)
  const [dateFrom,    setDateFrom]    = useState('')
  const [dateTo,      setDateTo]      = useState('')
  const [verifyingId, setVerifyingId] = useState(null)
  const [viewItem,    setViewItem]    = useState(null)

  const params = new URLSearchParams({ page, limit: 20 })
  if (status)   params.set('status',   status)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo)   params.set('dateTo',   dateTo)

  const { data, isLoading, mutate } = useSWR(
    `/api/payments?${params}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const payments   = data?.payments   || []
  const totalPages = data?.pagination?.totalPages || 1
  const total      = data?.pagination?.total      || 0

  const handleVerify = async (paymentId) => {
    if (!paymentId) return
    setVerifyingId(paymentId)
    try {
      const res  = await fetch(`/api/payments/verify/${paymentId}`, {
        credentials: 'include',
      })
      const json = await res.json()
      json.success
        ? toast.success('Status synced from Razorpay')
        : toast.error(json.error || 'Verification failed')
      mutate()
    } catch {
      toast.error('Network error during verification')
    } finally {
      setVerifyingId(null)
    }
  }

  const columns = [
    {
      key:    'razorpayOrderId',
      header: 'Order ID',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
          {v || '—'}
        </span>
      ),
    },
    {
      key:    'razorpayPaymentId',
      header: 'Payment ID',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
          {v || '—'}
        </span>
      ),
    },
    {
      key:    'razorpayInstrumentType',
      header: 'Instrument',
      render: (v) => (
        <span style={{ fontSize: 12, textTransform: 'capitalize', color: '#64748b' }}>
          {v || '—'}
        </span>
      ),
    },
    {
      key:    'amount',
      header: 'Amount',
      render: (v) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
          {v ? `₹${Number(v).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      key:    'status',
      header: 'Status',
      render: (v) => (
        <Badge variant={PAYMENT_BADGE[v] || 'neutral'} size="sm">
          {v || '—'}
        </Badge>
      ),
    },
    {
      key:    'createdAt',
      header: 'Date',
      render: (v) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {v ? new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
        </span>
      ),
    },
    {
      key:    'actions',
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ViewBtn onClick={() => setViewItem(row)} />
          <VerifyBtn
            onClick={() => handleVerify(row.razorpayPaymentId)}
            loading={verifyingId === row.razorpayPaymentId}
            disabled={!row.razorpayPaymentId}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Payments"
        subtitle={`${total} transaction${total !== 1 ? 's' : ''} · Razorpay gateway`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Payments' },
        ]}
      />

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10,
        marginBottom: 16, alignItems: 'center',
      }}>
        <FilterSelect
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">All Statuses</option>
          <option value="created">Created</option>
          <option value="authorized">Authorized</option>
          <option value="captured">Captured</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </FilterSelect>

        <DateInput value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
        <span style={{ fontSize: 13, color: '#94a3b8' }}>to</span>
        <DateInput value={dateTo}   onChange={(e) => { setDateTo(e.target.value);   setPage(1) }} />

        {(status || dateFrom || dateTo) && (
          <button
            onClick={() => { setStatus(''); setDateFrom(''); setDateTo(''); setPage(1) }}
            style={{
              padding: '9px 14px', borderRadius: 10,
              border: '1.5px solid #fca5a5',
              background: '#fff1f2', color: '#ef4444',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Clear ✕
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {[
          { label: 'Captured',   variant: 'success' },
          { label: 'Authorized', variant: 'info'    },
          { label: 'Refunded',   variant: 'purple'  },
          { label: 'Failed',     variant: 'danger'  },
          { label: 'Created',    variant: 'neutral' },
        ].map((item) => (
          <Badge key={item.label} variant={item.variant} size="sm">
            {item.label}
          </Badge>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No payments found"
        emptyMessage="Payments will appear here once transactions are initiated"
      />

      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Payment Details"
        size="md"
      >
        {viewItem && <PaymentDetail payment={viewItem} />}
      </Modal>
    </>
  )
}