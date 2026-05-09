'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

// ✅ Use credentials cookie — no Bearer token needed (verifyAuth handles both)
const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)  // returns { refunds: [], pagination: {} }

const KF = `@keyframes rf-spin { to { transform: rotate(360deg) } }`

const RF_CODES = {
  RF000: { label: 'Refunded',           variant: 'success' },
  RF001: { label: 'Txn Not Found',      variant: 'danger'  },
  RF002: { label: 'Txn Failed',         variant: 'danger'  },
  RF003: { label: 'Already Refunded',   variant: 'warning' },
  RF004: { label: 'Pending Settlement', variant: 'warning' },
  RF005: { label: 'Invalid Amount',     variant: 'danger'  },
}

const STATUS_BADGE = {
  pending:    'warning',
  processing: 'info',
  completed:  'success',
  failed:     'danger',
}

const TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'pending',   label: 'Pending'   },
  { id: 'completed', label: 'Completed' },
  { id: 'failed',    label: 'Failed'    },
]

/* ─── Tab Button ─────────────────────────────────────────────────────── */
function TabBtn({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '8px 16px', borderRadius: 12, border: 'none',
        background: active ? '#fff' : h ? 'rgba(255,255,255,0.5)' : 'transparent',
        color: active ? '#0f172a' : '#64748b',
        fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      {label}
    </button>
  )
}

/* ─── Retry Button ───────────────────────────────────────────────────── */
function RetryBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      onMouseEnter={() => !isLoading && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 10px', borderRadius: 8, border: 'none',
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'background .13s ease',
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading && (
        <span style={{
          width: 11, height: 11, borderRadius: '50%',
          border: '2px solid #6366f1', borderTopColor: 'transparent',
          animation: 'rf-spin .7s linear infinite', display: 'inline-block',
        }} />
      )}
      🔄 Retry
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

/* ─── Refund Detail Modal ────────────────────────────────────────────── */
function RefundDetail({ refund: r }) {
  const rfCode = r.onePayRefundStatus ? RF_CODES[r.onePayRefundStatus] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px', borderRadius: 14, flexWrap: 'wrap',
        background: r.status === 'completed' ? '#f0fdf4'
          : r.status === 'failed' ? '#fff1f2' : '#fffbeb',
        border: `1px solid ${
          r.status === 'completed' ? '#bbf7d0'
          : r.status === 'failed' ? '#fecaca' : '#fde68a'
        }`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 28 }}>
          {r.status === 'completed' ? '✅' : r.status === 'failed' ? '❌' : '⏳'}
        </span>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: 0 }}>
            {r.refundNumber}
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <Badge variant={STATUS_BADGE[r.status] || 'neutral'} size="sm" dot>
              {r.status}
            </Badge>
            {rfCode && (
              <Badge variant={rfCode.variant} size="sm">
                {r.onePayRefundStatus} · {rfCode.label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Amount breakdown */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12,
      }}>
        <AmtBox label="Booking Amount" value={r.bookingAmount} color="#64748b" />
        <AmtBox label="Refund %" value={r.refundPercent ? `${r.refundPercent}%` : '—'} raw color="#f59e0b" />
        <AmtBox label="Refund Amount" value={r.refundAmount} color="#16a34a" big />
      </div>

      {/* Details */}
      <div style={{
        background: '#f8fafc', borderRadius: 14,
        border: '1px solid #e2e8f0', overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 16px', background: '#f1f5f9',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>
            Refund Details
          </p>
        </div>
        <div style={{ padding: '4px 0' }}>
          {[
            { l: 'Reason',           v: r.reason        || '—'  },
            { l: 'Cancelled By',     v: r.cancelledBy   || '—'  },
            { l: 'Refund Method',    v: r.refundMethod  || '—'  },
            { l: 'Beneficiary',      v: r.beneficiaryName || '—' },
            { l: 'Account',          v: r.beneficiaryAccount || '—', mono: true },
            { l: 'IFSC',             v: r.beneficiaryIFSC || '—', mono: true },
            { l: '1Pay Request ID',  v: r.onePayRefundRequestId || '—', mono: true },
            { l: '1Pay RF Status',   v: r.onePayRefundStatus || '—' },
            { l: 'Processed At',     v: r.processedAt ? new Date(r.processedAt).toLocaleString('en-IN') : '—' },
          ].map((row) => (
            <div key={row.l} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 16px', borderBottom: '1px solid #f8fafc',
              flexWrap: 'wrap', gap: 4,
            }}>
              <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{row.l}</span>
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#1e293b',
                fontFamily: row.mono ? 'monospace' : 'inherit',
                wordBreak: 'break-all', textAlign: 'right',
              }}>
                {row.v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Failure reason */}
      {r.failureReason && (
        <div style={{
          background: '#fff1f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', margin: '0 0 4px' }}>
            ⚠️ Failure Reason
          </p>
          <p style={{ fontSize: 12, color: '#991b1b', margin: 0 }}>{r.failureReason}</p>
        </div>
      )}

      {/* IDs */}
      <div style={{
        padding: '12px 14px', background: '#f8fafc', borderRadius: 12,
        border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 7,
      }}>
        {[
          { l: 'Refund ID',  v: r.id        },
          { l: 'Booking ID', v: r.bookingId },
          { l: 'User ID',    v: r.userId    },
          { l: 'Initiated By', v: r.initiatedBy || '—' },
          { l: 'Created',    v: new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
        ].map((row) => (
          <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{row.l}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>
              {row.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AmtBox({ label, value, raw, color, big }) {
  return (
    <div style={{
      padding: '12px 14px', background: '#fff',
      borderRadius: 12, border: '1px solid #f1f5f9',
    }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>{label}</p>
      <p style={{
        fontSize: big ? 20 : 15, fontWeight: big ? 800 : 700,
        color: color || '#1e293b', margin: 0,
      }}>
        {raw ? value : (value ? `₹${Number(value).toLocaleString('en-IN')}` : '—')}
      </p>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function RefundsPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [page,      setPage]      = useState(1)
  const [retrying,  setRetrying]  = useState(null)
  const [viewItem,  setViewItem]  = useState(null)

  const statusFilter = activeTab === 'all' ? '' : activeTab
  const params       = new URLSearchParams({ page, limit: 20 })
  if (statusFilter) params.set('status', statusFilter)

  const { data, isLoading, mutate } = useSWR(
    `/api/refunds?${params}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  // ✅ Correctly read refunds array
  const refunds    = data?.refunds    || []
  const totalPages = data?.pagination?.totalPages || 1
  const total      = data?.pagination?.total      || 0

  const handleRetry = async (refundId) => {
    setRetrying(refundId)
    try {
      const res    = await fetch(`/api/refunds/${refundId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'retry' }),
      })
      const result = await res.json()
      result.success
        ? toast.success('Refund retry initiated')
        : toast.error(result.error || 'Retry failed')
      mutate()
    } catch {
      toast.error('Failed to retry refund')
    } finally {
      setRetrying(null)
    }
  }

  const columns = [
    {
      key: 'refundNumber', header: 'Refund #',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: '#374151' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'bookingId', header: 'Booking',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
          {String(v).slice(-8)}…
        </span>
      ),
    },
    {
      key: 'refundAmount', header: 'Amount',
      render: (v) => (
        <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
          {v ? `₹${Number(v).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      key: 'refundPercent', header: '%',
      render: (v) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>{v ? `${v}%` : '—'}</span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (v, row) => {
        if (row.onePayRefundStatus && RF_CODES[row.onePayRefundStatus]) {
          const rf = RF_CODES[row.onePayRefundStatus]
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Badge variant={rf.variant} size="sm">{rf.label}</Badge>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#94a3b8' }}>
                {row.onePayRefundStatus}
              </span>
            </div>
          )
        }
        return (
          <Badge variant={STATUS_BADGE[v] || 'neutral'} size="sm" dot>{v}</Badge>
        )
      },
    },
    {
      key: 'createdAt', header: 'Date',
      render: (v) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
        </span>
      ),
    },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <ViewBtn onClick={() => setViewItem(row)} />
          {row.status === 'failed' && (
            <RetryBtn
              onClick={() => handleRetry(row.id)}
              loading={retrying === row.id}
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
        title="Refunds"
        subtitle={`${total} refund${total !== 1 ? 's' : ''} · 1Pay refund requests`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Refunds' },
        ]}
      />

      {/* RF Code Legend */}
      <div style={{
        background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 14, padding: '12px 16px', marginBottom: 20,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 8, margin: '0 0 8px' }}>
          1Pay Refund Status Codes
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(RF_CODES).map(([code, info]) => (
            <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Badge variant={info.variant} size="sm">{code}</Badge>
              <span style={{ fontSize: 11, color: '#64748b' }}>{info.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 3, background: '#f1f5f9', borderRadius: 14,
        padding: 4, width: 'fit-content', marginBottom: 20,
        overflowX: 'auto',
      }}>
        {TABS.map((t) => (
          <TabBtn
            key={t.id}
            label={t.label}
            active={activeTab === t.id}
            onClick={() => { setActiveTab(t.id); setPage(1) }}
          />
        ))}
      </div>

      <DataTable
        columns={columns}
        data={refunds}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No refunds found"
        emptyMessage={
          activeTab !== 'all'
            ? `No ${activeTab} refunds at this time`
            : 'Refunds will appear here when bookings are cancelled'
        }
      />

      {/* ── View Detail Modal ── */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Refund Details"
        size="md"
      >
        {viewItem && <RefundDetail refund={viewItem} />}
      </Modal>
    </>
  )
}