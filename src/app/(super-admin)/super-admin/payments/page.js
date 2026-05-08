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
    .then((r) => r.json())
    .then((d) => d.data)

const KF = `@keyframes py-spin{to{transform:rotate(360deg)}}`

const PAYMENT_BADGE = {
  created: 'neutral',
  success: 'success',
  failure: 'danger',
  timeout: 'warning',
  pending: 'info',
}

function FilterSelect({ value, onChange, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '10px 30px 10px 12px',
          fontSize: 13,
          fontFamily: 'inherit',
          borderRadius: 12,
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff',
          color: '#0f172a',
          outline: 'none',
          appearance: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'all .15s ease',
        }}
      >
        {children}
      </select>
      <span
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 11,
          color: '#94a3b8',
          pointerEvents: 'none',
        }}
      >
        ▼
      </span>
    </div>
  )
}

function DateInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="date"
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        padding: '10px 12px',
        fontSize: 13,
        fontFamily: 'inherit',
        borderRadius: 12,
        border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
        background: '#fff',
        color: '#0f172a',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'all .15s ease',
      }}
    />
  )
}

function VerifyBtn({ onClick, loading: isLoading, disabled }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      onMouseEnter={() => !(isLoading || disabled) && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 10px',
        borderRadius: 100,
        border: `1.5px solid ${hovered ? '#6366f1' : 'rgba(99,102,241,0.3)'}`,
        background: hovered ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1',
        fontSize: 11,
        fontWeight: 600,
        cursor: isLoading || disabled ? 'not-allowed' : 'pointer',
        opacity: isLoading || disabled ? 0.5 : 1,
        transition: 'all .13s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {isLoading && (
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: '50%',
            border: '2px solid #6366f1',
            borderTopColor: 'transparent',
            animation: 'py-spin .7s linear infinite',
            display: 'inline-block',
          }}
        />
      )}
      {isLoading ? 'Verifying…' : 'Verify'}
    </button>
  )
}

export default function PaymentsPage() {
  const { accessToken } = useAuth()
  const toast           = useToast()

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

  // ✅ FIX: Each column key must be unique.
  //    The old code had TWO entries with key:'onePayTxnId'.
  //    The Action column now uses key:'actions' and reads
  //    the txnId from the full `row` object instead.
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
      // ✅ Unique key — was previously duplicating 'onePayTxnId'
      key:    'actions',
      header: 'Action',
      render: (_, row) => (
        <VerifyBtn
          onClick={() => handleVerify(row.onePayTxnId)}
          loading={verifyingId === row.onePayTxnId}
          disabled={!row.onePayTxnId}
        />
      ),
    },
  ]

  const payments     = data?.payments     || []
  const totalPages   = data?.pagination?.pages || 1

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Payments"
        subtitle="All 1Pay gateway transactions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Payments' },
        ]}
      />

      {/* ── Filters ── */}
      <div
        style={{
          display:       'flex',
          flexWrap:      'wrap',
          gap:           10,
          marginBottom:  16,
          alignItems:    'center',
        }}
      >
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

        {/* Clear filters */}
        {(status || dateFrom || dateTo) && (
          <button
            onClick={() => { setStatus(''); setDateFrom(''); setDateTo(''); setPage(1) }}
            style={{
              padding:      '8px 14px',
              borderRadius: 10,
              border:       '1.5px solid #fca5a5',
              background:   '#fff1f2',
              color:        '#ef4444',
              fontSize:     12,
              fontWeight:   600,
              cursor:       'pointer',
            }}
          >
            Clear
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
    </>
  )
}