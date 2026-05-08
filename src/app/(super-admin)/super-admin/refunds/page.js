'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'

const fetcher = ([url, token]) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.json()).then((d) => d.data)

const KF = `@keyframes rf-spin{to{transform:rotate(360deg)}}`

const RF_CODES = {
  RF000: { label: 'Refunded',           variant: 'success' },
  RF001: { label: 'Txn Not Found',      variant: 'danger'  },
  RF002: { label: 'Txn Failed',         variant: 'danger'  },
  RF003: { label: 'Already Refunded',   variant: 'warning' },
  RF004: { label: 'Pending Settlement', variant: 'warning' },
  RF005: { label: 'Invalid Amount',     variant: 'danger'  },
}

const STATUS_BADGE = { pending: 'warning', processing: 'info', completed: 'success', failed: 'danger' }

function TabBtn({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '8px 16px', borderRadius: 12, border: 'none',
        background: active ? '#fff' : h ? 'rgba(255,255,255,0.5)' : 'transparent',
        color: active ? '#0f172a' : '#64748b',
        fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all .15s ease',
      }}>
      {label}
    </button>
  )
}

function RetryBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading} onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: 'none',
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent', color: '#6366f1',
        fontSize: 11, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'background .13s ease', opacity: isLoading ? 0.6 : 1,
      }}>
      {isLoading && <span style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid #6366f1', borderTopColor: 'transparent', animation: 'rf-spin .7s linear infinite', display: 'inline-block' }} />}
      🔄 Retry
    </button>
  )
}

const TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'pending',   label: 'Pending'   },
  { id: 'completed', label: 'Completed' },
  { id: 'failed',    label: 'Failed'    },
]

export default function RefundsPage() {
  const { accessToken } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [page,      setPage]      = useState(1)
  const [retrying,  setRetrying]  = useState(null)

  const statusFilter = activeTab === 'all' ? '' : activeTab
  const params       = new URLSearchParams({ page, ...(statusFilter && { status: statusFilter }) })

  const { data, isLoading, mutate } = useSWR(
    accessToken ? [`/api/refunds?${params}`, accessToken] : null,
    fetcher
  )

  const handleRetry = async (refundId) => {
    setRetrying(refundId)
    try {
      const res    = await fetch(`/api/refunds/${refundId}/retry`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      })
      const result = await res.json()
      result.success ? toast.success('Refund retry initiated') : toast.error(result.error || 'Retry failed')
      mutate()
    } catch { toast.error('Failed to retry refund') }
    finally { setRetrying(null) }
  }

  const columns = [
    { key: 'refundNumber',         header: 'Refund #',    render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span> },
    { key: 'bookingId',            header: 'Booking',     render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span> },
    { key: 'refundAmount',         header: 'Amount',      render: (v) => <span style={{ fontSize: 13, fontWeight: 600 }}>{v ? `₹${Number(v).toLocaleString('en-IN')}` : '-'}</span> },
    { key: 'refundPercent',        header: '%',           render: (v) => <span style={{ fontSize: 12 }}>{v ? `${v}%` : '-'}</span> },
    { key: 'onePayRefundRequestId',header: '1Pay Ref',    render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748b' }}>{v || '-'}</span> },
    {
      key: 'status', header: 'Status',
      render: (v, row) => {
        if (row.onePayRefundStatus && RF_CODES[row.onePayRefundStatus]) {
          const rf = RF_CODES[row.onePayRefundStatus]
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Badge variant={rf.variant} size="sm">{rf.label}</Badge>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#94a3b8' }}>{row.onePayRefundStatus}</span>
            </div>
          )
        }
        return <Badge variant={STATUS_BADGE[v] || 'neutral'} size="sm">{v}</Badge>
      },
    },
    { key: 'reason',    header: 'Reason', render: (v) => <span style={{ fontSize: 11, color: '#64748b', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{v || '-'}</span> },
    { key: 'createdAt', header: 'Date',   render: (v) => <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(v).toLocaleDateString('en-IN')}</span> },
    { key: 'id',        header: 'Action', render: (v, row) => row.status === 'failed' ? <RetryBtn onClick={() => handleRetry(v)} loading={retrying === v} /> : null },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Refunds" subtitle="1Pay refund requests and status"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Refunds' }]} />

      {/* RF Code Legend */}
      <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 14, padding: '12px 16px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 8 }}>1Pay Refund Status Codes</p>
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
      <div style={{ display: 'flex', gap: 3, background: '#f1f5f9', borderRadius: 14, padding: 4, width: 'fit-content', marginBottom: 20 }}>
        {TABS.map((t) => (
          <TabBtn key={t.id} label={t.label} active={activeTab === t.id} onClick={() => { setActiveTab(t.id); setPage(1) }} />
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.refunds || []}
        loading={isLoading}
        page={page}
        totalPages={data?.pagination?.pages || 1}
        onPageChange={setPage}
        emptyTitle="No refunds found"
      />
    </>
  )
}