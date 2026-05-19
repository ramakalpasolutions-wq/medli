'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `@keyframes rf-spin { to { transform: rotate(360deg) } }`

const REFUND_BADGE = {
  pending: 'neutral',
  processing: 'info',
  completed: 'success',
  failed: 'danger',
}

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
          padding: '10px 30px 10px 12px',
          fontSize: 13,
          fontFamily: 'inherit',
          borderRadius: 12,
          border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff',
          color: '#0f172a',
          outline: 'none',
          appearance: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'all .15s ease',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
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
  const [f, setF] = useState(false)
  return (
    <input
      type="date"
      value={value}
      onChange={onChange}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        padding: '10px 12px',
        fontSize: 13,
        fontFamily: 'inherit',
        borderRadius: 12,
        border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
        background: '#fff',
        color: '#0f172a',
        outline: 'none',
        boxSizing: 'border-box',
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
    <button
      onClick={onClick}
      disabled={off}
      onMouseEnter={() => !off && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px',
        borderRadius: 100,
        border: `1.5px solid ${h ? '#6366f1' : 'rgba(99,102,241,0.3)'}`,
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1',
        fontSize: 11,
        fontWeight: 600,
        cursor: off ? 'not-allowed' : 'pointer',
        opacity: off ? 0.5 : 1,
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
            animation: 'rf-spin .7s linear infinite',
            display: 'inline-block',
          }}
        />
      )}
      {isLoading ? 'Verifying…' : 'Verify'}
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
        background: h ? '#f1f5f9' : 'transparent',
        color: '#6366f1',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background .13s ease',
      }}
    >
      👁 View
    </button>
  )
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '10px 0',
        borderBottom: '1px solid #f1f5f9',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          color: '#0f172a',
          fontWeight: 600,
          fontFamily: mono ? 'monospace' : 'inherit',
          textAlign: 'right',
          wordBreak: 'break-all',
        }}
      >
        {value || '—'}
      </span>
    </div>
  )
}

function RefundDetail({ refund }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 14,
          background:
            refund.status === 'completed'
              ? '#f0fdf4'
              : refund.status === 'failed'
              ? '#fff1f2'
              : refund.status === 'processing'
              ? '#eff6ff'
              : '#f8fafc',
          border: `1px solid ${
            refund.status === 'completed'
              ? '#bbf7d0'
              : refund.status === 'failed'
              ? '#fecaca'
              : refund.status === 'processing'
              ? '#bfdbfe'
              : '#e2e8f0'
          }`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Badge variant={REFUND_BADGE[refund.status] || 'neutral'} size="sm">
            {refund.status?.toUpperCase()}
          </Badge>
          {refund.refundMethod && (
            <Badge variant="neutral" size="sm">
              {refund.refundMethod}
            </Badge>
          )}
        </div>

        <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '10px 0 0' }}>
          {refund.refundAmount != null
            ? `₹${Number(refund.refundAmount).toLocaleString('en-IN')}`
            : '—'}
        </p>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '4px 16px',
        }}
      >
        <DetailRow label="Refund Number" value={refund.refundNumber} mono />
        <DetailRow label="Booking ID" value={refund.bookingId} mono />
        <DetailRow label="User ID" value={refund.userId} mono />
        <DetailRow label="Booking Amount" value={refund.bookingAmount != null ? `₹${Number(refund.bookingAmount).toLocaleString('en-IN')}` : '—'} />
        <DetailRow label="Refund Percent" value={refund.refundPercent != null ? `${refund.refundPercent}%` : '—'} />
        <DetailRow label="Refund Amount" value={refund.refundAmount != null ? `₹${Number(refund.refundAmount).toLocaleString('en-IN')}` : '—'} />
        <DetailRow label="Cancelled By" value={refund.cancelledBy} mono />
        <DetailRow label="Reason" value={refund.reason} />
        <DetailRow label="Razorpay Refund ID" value={refund.razorpayRefundId} mono />
        <DetailRow label="Razorpay Refund Status" value={refund.razorpayRefundStatus} />
        <DetailRow label="Failure Reason" value={refund.failureReason} />
        <DetailRow label="Processed At" value={refund.processedAt ? new Date(refund.processedAt).toLocaleString('en-IN') : '—'} />
        <DetailRow label="Created At" value={refund.createdAt ? new Date(refund.createdAt).toLocaleString('en-IN') : '—'} />
      </div>
    </div>
  )
}

export default function RefundsPage() {
  const toast = useToast()

  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [verifyingId, setVerifyingId] = useState(null)
  const [viewItem, setViewItem] = useState(null)

  const params = new URLSearchParams({ page, limit: 20 })
  if (status) params.set('status', status)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)

  const { data, isLoading, mutate } = useSWR(
    `/api/refunds?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const refunds = data?.refunds || []
  const totalPages = data?.pagination?.totalPages || 1
  const total = data?.pagination?.total || 0

  const handleVerify = async (refundId) => {
    if (!refundId) return
    setVerifyingId(refundId)

    try {
      const res = await fetch(`/api/refunds/${refundId}/verify`, {
        credentials: 'include',
      })
      const json = await res.json()

      if (json.success) {
        toast.success('Refund status synced from Razorpay')
      } else {
        toast.error(json.error || 'Verification failed')
      }

      mutate()
    } catch {
      toast.error('Network error during verification')
    } finally {
      setVerifyingId(null)
    }
  }

  const columns = [
    {
      key: 'refundNumber',
      header: 'Refund #',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
          {v || '—'}
        </span>
      ),
    },
    {
      key: 'bookingId',
      header: 'Booking',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
          {v || '—'}
        </span>
      ),
    },
    {
      key: 'refundAmount',
      header: 'Amount',
      render: (v) => (
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
          {v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      key: 'refundPercent',
      header: '%',
      render: (v) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {v != null ? `${v}%` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => (
        <Badge variant={REFUND_BADGE[v] || 'neutral'} size="sm">
          {v || '—'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (v) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {v ? new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ViewBtn onClick={() => setViewItem(row)} />
          <VerifyBtn
            onClick={() => handleVerify(row.id)}
            loading={verifyingId === row.id}
            disabled={!row.razorpayRefundId}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Refunds"
        subtitle={`${total} refund${total !== 1 ? 's' : ''} · Razorpay refund requests`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Refunds' },
        ]}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 16,
          alignItems: 'center',
        }}
      >
        <FilterSelect
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </FilterSelect>

        <DateInput
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value)
            setPage(1)
          }}
        />
        <span style={{ fontSize: 13, color: '#94a3b8' }}>to</span>
        <DateInput
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value)
            setPage(1)
          }}
        />

        {(status || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setStatus('')
              setDateFrom('')
              setDateTo('')
              setPage(1)
            }}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: '1.5px solid #fca5a5',
              background: '#fff1f2',
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear ✕
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <Badge variant="neutral" size="sm">Pending</Badge>
        <Badge variant="info" size="sm">Processing</Badge>
        <Badge variant="success" size="sm">Completed</Badge>
        <Badge variant="danger" size="sm">Failed</Badge>
      </div>

      <DataTable
        columns={columns}
        data={refunds}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No refunds found"
        emptyMessage="Refunds will appear here when bookings are cancelled"
      />

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