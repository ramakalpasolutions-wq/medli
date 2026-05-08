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

const KF = `@keyframes py-spin{to{transform:rotate(360deg)}}`

const PAYMENT_BADGE = {
  created: 'neutral', success: 'success', failure: 'danger', timeout: 'warning', pending: 'info',
}

function FilterSelect({ value, onChange, children }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={onChange} onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          padding: '10px 30px 10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          appearance: 'none', cursor: 'pointer', boxSizing: 'border-box',
          transition: 'all .15s ease',
        }}>
        {children}
      </select>
      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#94a3b8', pointerEvents: 'none' }}>▼</span>
    </div>
  )
}

function DateInput({ value, onChange }) {
  const [f, setF] = useState(false)
  return (
    <input type="date" value={value} onChange={onChange}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{
        padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
        borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
        background: '#fff', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', transition: 'all .15s ease',
      }}
    />
  )
}

function VerifyBtn({ onClick, loading: isLoading, disabled }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading || disabled}
      onMouseEnter={() => !(isLoading||disabled) && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', borderRadius: 100,
        border: `1.5px solid ${h ? '#6366f1' : 'rgba(99,102,241,0.3)'}`,
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: isLoading || disabled ? 'not-allowed' : 'pointer',
        opacity: isLoading || disabled ? 0.5 : 1,
        transition: 'all .13s ease', display: 'flex', alignItems: 'center', gap: 4,
      }}>
      {isLoading && <span style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid #6366f1', borderTopColor: 'transparent', animation: 'py-spin .7s linear infinite', display: 'inline-block' }} />}
      Verify
    </button>
  )
}

export default function PaymentsPage() {
  const { accessToken } = useAuth()
  const toast = useToast()
  const [status,      setStatus]      = useState('')
  const [page,        setPage]        = useState(1)
  const [dateFrom,    setDateFrom]    = useState('')
  const [dateTo,      setDateTo]      = useState('')
  const [verifyingId, setVerifyingId] = useState(null)

  const params = new URLSearchParams({ page })
  if (status)   params.set('status',   status)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo)   params.set('dateTo',   dateTo)

  const { data, isLoading, mutate } = useSWR(
    accessToken ? [`/api/payments?${params}`, accessToken] : null,
    fetcher
  )

  const handleVerify = async (txnId) => {
    if (!txnId) return
    setVerifyingId(txnId)
    try {
      const res  = await fetch(`/api/payments/verify/${txnId}`, { credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success('Status synced from 1Pay') : toast.error(json.error || 'Failed to verify')
      mutate()
    } catch { toast.error('Network error during verification') }
    finally { setVerifyingId(null) }
  }

  const columns = [
    { key: 'onePayTxnId',         header: 'Transaction ID', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v || '-'}</span> },
    { key: 'onePayPgRefId',       header: 'PG Reference',   render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v || '-'}</span> },
    { key: 'onePayInstrumentType',header: 'Instrument',     render: (v) => <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{v || '-'}</span> },
    { key: 'amount',              header: 'Amount',         render: (v) => <span style={{ fontSize: 13, fontWeight: 600 }}>{v ? `₹${Number(v).toLocaleString('en-IN')}` : '-'}</span> },
    { key: 'status',              header: 'Status',         render: (v) => <Badge variant={PAYMENT_BADGE[v] || 'neutral'} size="sm">{v}</Badge> },
    { key: 'createdAt',           header: 'Date',           render: (v) => <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(v).toLocaleDateString('en-IN')}</span> },
    { key: 'onePayTxnId',         header: 'Action',         render: (v, row) => <VerifyBtn onClick={() => handleVerify(v)} loading={verifyingId === v} disabled={!v} /> },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Payments" subtitle="All 1Pay gateway transactions"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Payments' }]} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          <option value="created">Created</option>
          <option value="success">Success</option>
          <option value="failure">Failed</option>
          <option value="timeout">Timeout</option>
          <option value="pending">Pending</option>
        </FilterSelect>
        <DateInput value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span style={{ fontSize: 13, color: '#94a3b8' }}>to</span>
        <DateInput value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        data={data?.payments || []}
        loading={isLoading}
        page={page}
        totalPages={data?.pagination?.pages || 1}
        onPageChange={setPage}
        emptyTitle="No payments found"
      />
    </>
  )
}