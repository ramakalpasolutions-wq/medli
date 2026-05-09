'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

// ✅ Use credentials cookie — consistent with all other admin pages
const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)  // returns { payments: [], pagination: {} }

const KF = `@keyframes py-spin { to { transform: rotate(360deg) } }`

const PAYMENT_BADGE = {
  created: 'neutral',
  success: 'success',
  failure: 'danger',
  timeout: 'warning',
  pending: 'info',
}

/* ─── Filter Select ──────────────────────────────────────────────────── */
function FilterSelect({ value, onChange, children }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={{
          padding: '10px 30px 10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          appearance: 'none', cursor: 'pointer', boxSizing: 'border-box',
          transition: 'all .15s ease',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {children}
      </select>
      <span style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)', fontSize: 11,
        color: '#94a3b8', pointerEvents: 'none',
      }}>▼</span>
    </div>
  )
}

/* ─── Date Input ─────────────────────────────────────────────────────── */
function DateInput({ value, onChange }) {
  const [f, setF] = useState(false)
  return (
    <input
      type="date"
      value={value}
      onChange={onChange}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
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

/* ─── Verify Button ──────────────────────────────────────────────────── */
function VerifyBtn({ onClick, loading: isLoading, disabled }) {
  const [h, setH] = useState(false)
  const off = isLoading || disabled
  return (
    <button
      onClick={onClick}
      disabled={off}
      onMouseEnter={() => !off && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', borderRadius: 100,
        border: `1.5px solid ${h ? '#6366f1' : 'rgba(99,102,241,0.3)'}`,
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: off ? 'not-allowed' : 'pointer',
        opacity: off ? 0.5 : 1,
        transition: 'all .13s ease',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {isLoading && (
        <span style={{
          width: 11, height: 11, borderRadius: '50%',
          border: '2px solid #6366f1', borderTopColor: 'transparent',
          animation: 'py-spin .7s linear infinite', display: 'inline-block',
        }} />
      )}
      {isLoading ? 'Verifying…' : 'Verify'}
    </button>
  )
}

/* ─── View Button ────────────────────────────────────────────────────── */
function ViewBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '4px 9px', borderRadius: 7, border: 'none',
        background: h ? '#f1f5f9' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'background .13s ease',
      }}
    >
      👁 View
    </button>
  )
}

/* ─── Payment Detail Modal ───────────────────────────────────────────── */
function PaymentDetail({ payment: p }) {
  const statusVariant = PAYMENT_BADGE[p.status] || 'neutral'
  const statusEmoji   = p.status === 'success' ? '✅' : p.status === 'failure' ? '❌' : p.status === 'timeout' ? '⏰' : p.status === 'pending' ? '⏳' : '🔵'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Status banner */}
      <div style={{
        padding: '14px 16px', borderRadius: 14,
        background: p.status === 'success' ? '#f0fdf4'
          : p.status === 'failure' ? '#fff1f2'
          : p.status === 'timeout' ? '#fffbeb' : '#f0f9ff',
        border: `1px solid ${
          p.status === 'success' ? '#bbf7d0'
          : p.status === 'failure' ? '#fecaca'
          : p.status === 'timeout' ? '#fde68a' : '#bae6fd'
        }`,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 32 }}>{statusEmoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <Badge variant={statusVariant} size="sm">{p.status?.toUpperCase()}</Badge>
            {p.onePayInstrumentType && (
              <Badge variant="neutral" size="sm">{p.onePayInstrumentType}</Badge>
            )}
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {p.amount ? `₹${Number(p.amount).toLocaleString('en-IN')}` : '—'}
          </p>
        </div>
      </div>

      {/* Transaction IDs */}
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
            { l: 'Transaction ID (TxnId)', v: p.onePayTxnId     || '—', mono: true },
            { l: 'PG Reference ID',        v: p.onePayPgRefId   || '—', mono: true },
            { l: 'Bank Reference',         v: p.onePayBankRefId || '—', mono: true },
            { l: 'Booking ID',             v: p.bookingId       || '—', mono: true },
            { l: 'User ID',                v: p.userId          || '—', mono: true },
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
              }}>
                {row.v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment info grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
      }}>
        <InfoBox label="💰 Amount"     value={p.amount ? `₹${Number(p.amount).toLocaleString('en-IN')}` : '—'} />
        <InfoBox label="💱 Currency"   value={p.currency || 'INR'} />
        <InfoBox label="🏧 Instrument" value={p.onePayInstrumentType || '—'} />
        <InfoBox label="📅 Date"       value={new Date(p.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} />
      </div>

      {/* Failure message */}
      {p.onePayFailureMsg && (
        <div style={{
          background: '#fff1f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', margin: '0 0 4px' }}>
            ⚠️ Failure Reason
          </p>
          <p style={{ fontSize: 12, color: '#991b1b', margin: 0 }}>{p.onePayFailureMsg}</p>
        </div>
      )}

      {/* Refunds */}
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

      {/* Callback data */}
      {p.callbackData && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            📦 Gateway Callback Data
          </p>
          <pre style={{
            background: '#0f172a', color: '#e2e8f0', borderRadius: 12,
            padding: '14px 16px', fontSize: 10, fontFamily: 'monospace',
            overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            margin: 0, maxHeight: 200, overflowY: 'auto',
          }}>
            {JSON.stringify(p.callbackData, null, 2)}
          </pre>
        </div>
      )}

      {/* Payment ID */}
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

/* ─── Main Page ──────────────────────────────────────────────────────── */
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

  // ✅ Correctly read from paginatedResponse shape
  const payments   = data?.payments   || []
  const totalPages = data?.pagination?.totalPages || 1
  const total      = data?.pagination?.total      || 0

  const handleVerify = async (txnId) => {
    if (!txnId) return
    setVerifyingId(txnId)
    try {
      const res  = await fetch(`/api/payments/verify/${txnId}`, {
        credentials: 'include',
      })
      const json = await res.json()
      json.success
        ? toast.success('Status synced from 1Pay')
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
      key:    'onePayTxnId',
      header: 'Transaction ID',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
          {v || '—'}
        </span>
      ),
    },
    {
      key:    'onePayPgRefId',
      header: 'PG Reference',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
          {v || '—'}
        </span>
      ),
    },
    {
      key:    'onePayInstrumentType',
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
            onClick={() => handleVerify(row.onePayTxnId)}
            loading={verifyingId === row.onePayTxnId}
            disabled={!row.onePayTxnId}
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
        subtitle={`${total} transaction${total !== 1 ? 's' : ''} · 1Pay gateway`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Payments' },
        ]}
      />

      {/* ── Filters ── */}
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
          <option value="success">Success</option>
          <option value="failure">Failed</option>
          <option value="timeout">Timeout</option>
          <option value="pending">Pending</option>
        </FilterSelect>

        <DateInput
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
        />
        <span style={{ fontSize: 13, color: '#94a3b8' }}>to</span>
        <DateInput
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
        />

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

      {/* ── Status legend ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {[
          { label: 'Success', variant: 'success' },
          { label: 'Failed',  variant: 'danger'  },
          { label: 'Timeout', variant: 'warning' },
          { label: 'Pending', variant: 'info'    },
          { label: 'Created', variant: 'neutral' },
        ].map((item) => (
          <Badge key={item.label} variant={item.variant} size="sm">
            {item.label}
          </Badge>
        ))}
      </div>

      {/* ── Table ── */}
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

      {/* ── View Detail Modal ── */}
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