'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

// ✅ Returns j.data = { accounts: [], pagination: {} }
const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `@keyframes ba-spin { to { transform: rotate(360deg) } }`

/* ─── Filter Select ──────────────────────────────────────────────────── */
function FilterSelect({ value, onChange }) {
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
          background: '#fff', color: value ? '#0f172a' : '#94a3b8',
          outline: 'none', appearance: 'none', cursor: 'pointer',
          boxSizing: 'border-box',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
        }}
      >
        <option value="">All Types</option>
        <option value="hospital">Hospital</option>
        <option value="lab">Lab</option>
        <option value="user">User</option>
      </select>
      <span style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)', fontSize: 11,
        color: '#94a3b8', pointerEvents: 'none',
      }}>▼</span>
    </div>
  )
}

/* ─── Verify Button ──────────────────────────────────────────────────── */
function VerifyBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      onMouseEnter={() => !isLoading && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', borderRadius: 8,
        border: `1.5px solid ${h ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all .13s ease',
        display: 'flex', alignItems: 'center', gap: 5,
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading && (
        <span style={{
          width: 11, height: 11, borderRadius: '50%',
          border: '2px solid #6366f1', borderTopColor: 'transparent',
          animation: 'ba-spin .7s linear infinite', display: 'inline-block',
        }} />
      )}
      🛡 Verify
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
        padding: '5px 10px', borderRadius: 8, border: 'none',
        background: h ? '#f1f5f9' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'all .13s ease',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      👁 View
    </button>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function BankAccountsPage() {
  const [page,       setPage]       = useState(1)
  const [entityType, setEntityType] = useState('')
  const [verifying,  setVerifying]  = useState(null)
  const [viewItem,   setViewItem]   = useState(null)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (entityType) qs.set('entityType', entityType)

  const { data, isLoading, mutate } = useSWR(
    `/api/bank-accounts?${qs}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  // ✅ Correctly read accounts array from paginatedResponse shape
  const accounts   = data?.accounts   || []
  const totalPages = data?.pagination?.totalPages || 1
  const total      = data?.pagination?.total      || 0

  const verify = async (id) => {
    setVerifying(id)
    try {
      const res  = await fetch(`/api/bank-accounts/${id}/verify`, {
        method: 'POST', credentials: 'include',
      })
      const json = await res.json()
      json.success
        ? toast.success(json.message || 'Account verified')
        : toast.error(json.error || 'Verification failed')
      mutate()
    } catch {
      toast.error('Verification failed')
    }
    setVerifying(null)
  }

  const ENTITY_BADGE = {
    hospital: 'info',
    lab:      'success',
    user:     'neutral',
  }

  const columns = [
    {
      key: 'accountHolderName', header: 'Account Holder',
      render: (v) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
          {v || '—'}
        </span>
      ),
    },
    {
      key: 'entityType', header: 'Type',
      render: (v) => (
        <Badge variant={ENTITY_BADGE[v] || 'neutral'} size="sm">
          {v || '—'}
        </Badge>
      ),
    },
    {
      key: 'bankName', header: 'Bank',
      render: (v) => <span style={{ fontSize: 12, color: '#475569' }}>{v || '—'}</span>,
    },
    {
      key: 'accountNumber', header: 'Account',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
          {v ? `****${String(v).slice(-4)}` : '—'}
        </span>
      ),
    },
    {
      key: 'ifscCode', header: 'IFSC',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
          {v || '—'}
        </span>
      ),
    },
    {
      key: 'isVerified', header: 'Verified',
      render: (v) => (
        <Badge variant={v ? 'success' : 'warning'} size="sm" dot>
          {v ? 'Verified' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ViewBtn onClick={() => setViewItem(row)} />
          {!row.isVerified && (
            <VerifyBtn
              onClick={() => verify(row.id)}
              loading={verifying === row.id}
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
        title="Bank Accounts"
        subtitle={`${total} account${total !== 1 ? 's' : ''} found`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Bank Accounts' },
        ]}
      />

      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
        <FilterSelect
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1) }}
        />
      </div>

      {/* ✅ accounts array — never undefined */}
      <DataTable
        columns={columns}
        data={accounts}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No bank accounts found"
        emptyMessage="Bank accounts will appear here once added by providers"
      />

      {/* ── View Detail Modal ── */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Bank Account Details"
        size="md"
      >
        {viewItem && <BankAccountDetail account={viewItem} />}
      </Modal>
    </>
  )
}

/* ─── Bank Account Detail ────────────────────────────────────────────── */
function BankAccountDetail({ account: a }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{
        display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
        padding: 16, background: '#f8fafc', borderRadius: 16,
        border: '1px solid #e2e8f0',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          🏦
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
            {a.accountHolderName || 'Unknown Holder'}
          </h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant={a.entityType === 'hospital' ? 'info' : a.entityType === 'lab' ? 'success' : 'neutral'} size="sm">
              {a.entityType}
            </Badge>
            <Badge variant={a.isVerified ? 'success' : 'warning'} size="sm" dot>
              {a.isVerified ? 'Verified' : 'Pending Verification'}
            </Badge>
            {a.isPrimary && (
              <Badge variant="purple" size="sm">Primary</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Bank Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}>
        <DetailBox label="🏦 Bank Name"     value={a.bankName     || '—'} />
        <DetailBox label="🏢 Branch"        value={a.branchName   || '—'} />
        <DetailBox label="📋 Account Type"  value={a.accountType  || '—'} />
        <DetailBox label="🔢 IFSC Code"     value={a.ifscCode     || '—'} mono />
      </div>

      {/* Sensitive fields — masked */}
      <div style={{
        background: '#f8fafc', borderRadius: 14,
        border: '1px solid #e2e8f0', overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 16px', background: '#f1f5f9',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>
            🔒 Sensitive Information (masked)
          </p>
        </div>
        <div style={{ padding: '4px 0' }}>
          {[
            { label: 'Account Number', value: a.accountNumber || '—' },
            { label: 'UPI ID',         value: a.upiId         || '—' },
            { label: 'PAN Number',     value: a.panNumber     || '—' },
            { label: 'GSTIN',          value: a.gstin         || '—' },
          ].map((row) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', borderBottom: '1px solid #f8fafc',
            }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{row.label}</span>
              <span style={{
                fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: '#1e293b',
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Verification info */}
      {a.isVerified && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', margin: 0 }}>
            ✓ Verification Details
          </p>
          {[
            { l: 'Method',        v: a.verificationMethod || '—' },
            { l: 'Verified At',   v: a.verifiedAt ? new Date(a.verifiedAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) : '—' },
            { l: 'Transaction ID', v: a.pennyDropTransactionId || '—' },
          ].map((row) => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#16a34a' }}>{row.l}</span>
              <span style={{ fontWeight: 600, color: '#14532d', fontFamily: row.l === 'Transaction ID' ? 'monospace' : 'inherit' }}>
                {row.v}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Entity + timestamps */}
      <div style={{
        background: '#f8fafc', borderRadius: 14,
        border: '1px solid #e2e8f0', padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {[
          { l: 'Account ID', v: a.id },
          { l: 'Entity ID',  v: a.entityId },
          { l: 'Active',     v: a.isActive ? 'Yes' : 'No' },
          { l: 'Added',      v: new Date(a.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
          { l: 'Updated',    v: new Date(a.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
        ].map((row) => (
          <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{row.l}</span>
            <span style={{
              fontSize: 11, color: '#64748b', fontFamily: 'monospace',
              wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%',
            }}>
              {row.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailBox({ label, value, mono }) {
  return (
    <div style={{
      padding: '12px 14px', background: '#fff',
      borderRadius: 12, border: '1px solid #f1f5f9',
    }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>{label}</p>
      <p style={{
        fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0,
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-word',
      }}>
        {value}
      </p>
    </div>
  )
}