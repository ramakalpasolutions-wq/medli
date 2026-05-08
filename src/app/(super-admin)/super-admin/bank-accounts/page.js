'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes ba-spin{to{transform:rotate(360deg)}}`

function FilterSelect({ value, onChange }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={onChange} onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          padding: '10px 30px 10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: value ? '#0f172a' : '#94a3b8', outline: 'none',
          appearance: 'none', cursor: 'pointer', boxSizing: 'border-box',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
        }}>
        <option value="">All Types</option>
        <option value="hospital">Hospital</option>
        <option value="lab">Lab</option>
        <option value="user">User</option>
      </select>
      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#94a3b8', pointerEvents: 'none' }}>▼</span>
    </div>
  )
}

function VerifyBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading} onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', borderRadius: 8,
        border: `1.5px solid ${h ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all .13s ease',
        display: 'flex', alignItems: 'center', gap: 5, opacity: isLoading ? 0.6 : 1,
      }}>
      {isLoading && <span style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid #6366f1', borderTopColor: 'transparent', animation: 'ba-spin .7s linear infinite', display: 'inline-block' }} />}
      🛡 Verify
    </button>
  )
}

export default function BankAccountsPage() {
  const [page,       setPage]       = useState(1)
  const [entityType, setEntityType] = useState('')
  const [verifying,  setVerifying]  = useState(null)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (entityType) qs.set('entityType', entityType)

  const { data, isLoading, mutate } = useSWR(`/api/bank-accounts?${qs}`, fetcher)

  const verify = async (id) => {
    setVerifying(id)
    try {
      const res  = await fetch(`/api/bank-accounts/${id}/verify`, { method: 'POST', credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success(json.message) : toast.error(json.error)
      mutate()
    } catch { toast.error('Verification failed') }
    setVerifying(null)
  }

  const columns = [
    { key: 'accountHolderName', header: 'Account Holder', render: (v) => <span style={{ fontSize: 13, fontWeight: 500 }}>{v || '—'}</span> },
    { key: 'entityType',        header: 'Type',            render: (v) => <Badge variant="info" size="sm">{v}</Badge> },
    { key: 'bankName',          header: 'Bank',            render: (v) => <span style={{ fontSize: 12 }}>{v || '—'}</span> },
    { key: 'accountNumber',     header: 'Account',         render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v ? `****${v.slice(-4)}` : '—'}</span> },
    { key: 'ifscCode',          header: 'IFSC',            render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v || '—'}</span> },
    { key: 'isVerified',        header: 'Verified',        render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Verified' : 'Pending'}</Badge> },
    { key: 'actions',           header: '',                render: (_, row) => !row.isVerified ? <VerifyBtn onClick={() => verify(row.id)} loading={verifying === row.id} /> : null },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Bank Accounts" subtitle="Manage provider bank accounts"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Bank Accounts' }]} />
      <div style={{ marginBottom: 16 }}>
        <FilterSelect value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1) }} />
      </div>
      <DataTable columns={columns} data={data || []} loading={isLoading}
        page={page} totalPages={Math.ceil((data?.length || 0) / 20)} onPageChange={setPage}
        emptyTitle="No bank accounts found" />
    </>
  )
}