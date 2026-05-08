'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes dp-spin{to{transform:rotate(360deg)}}`

function SearchInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', width: 280 }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', color: '#94a3b8' }}>🔍</span>
      <input value={value} onChange={onChange} placeholder="Search doctors…"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 14px 10px 38px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
        }}
      />
    </div>
  )
}

function ABtn({ label, variant, onClick }) {
  const [h, setH] = useState(false)
  const V = {
    primary: { base: 'linear-gradient(135deg,#6366f1,#8b5cf6)', hov: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    success: { base: 'rgba(16,185,129,0.07)', hov: 'rgba(16,185,129,0.14)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
    danger:  { base: 'rgba(239,68,68,0.07)', hov: 'rgba(239,68,68,0.14)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
    outline: { base: '#fff', hov: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' },
  }
  const s = V[variant] || V.outline
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ padding: '5px 10px', borderRadius: 8, border: s.border || 'none', background: h ? s.hov : s.base, color: s.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .13s ease' }}>
      {label}
    </button>
  )
}

function ConfirmModal({ open, onClose, onConfirm, title, loading, details }) {
  const [h, setH] = useState(false)
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <style>{`@keyframes m-in{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'm-in .22s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>
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
              background: loading ? '#e2e8f0' : h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: loading ? '#94a3b8' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s ease',
            }}>
            {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'dp-spin .7s linear infinite', display: 'inline-block' }} />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DoctorsPage() {
  const [page,    setPage]   = useState(1)
  const [search,  setSearch] = useState('')
  const [action,  setAction] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)
  const { data, isLoading, mutate } = useSWR(`/api/doctors?${qs}`, fetcher)

  const doAction = async () => {
    setLoading(true)
    const { type, doctor } = action
    try {
      const url  = type === 'verify' ? `/api/doctors/${doctor.id}/verify` : `/api/doctors/${doctor.id}/activate`
      const res  = await fetch(url, { method: 'PATCH', credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success(json.message) : toast.error(json.error)
      mutate()
    } catch { toast.error('Action failed') }
    setLoading(false)
    setAction(null)
  }

  const columns = [
    {
      key: 'name', header: 'Doctor',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#6366f1', flexShrink: 0, overflow: 'hidden',
          }}>
            {row.avatar ? <img src={row.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : v?.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{v}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>{row.specialization?.join(', ') || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'isVerified', header: 'Verified', render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Verified' : 'Pending'}</Badge> },
    { key: 'isActive',   header: 'Active',   render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'experience', header: 'Exp',      render: (v) => v ? <span style={{ fontSize: 12 }}>{v} yrs</span> : '—' },
    {
      key: 'actions', header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {!row.isVerified && <ABtn label="✓ Verify" variant="success" onClick={() => setAction({ type: 'verify',  doctor: row })} />}
          <ABtn label={row.isActive ? 'Disable' : 'Enable'} variant={row.isActive ? 'danger' : 'outline'} onClick={() => setAction({ type: 'toggle', doctor: row })} />
        </div>
      ),
    },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title="Doctors"
        subtitle="Manage doctors"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Doctors' }]}
      />
      <div style={{ marginBottom: 16 }}>
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>
      <DataTable columns={columns} data={data?.doctors || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} emptyTitle="No doctors found" />
      <ConfirmModal open={!!action} onClose={() => setAction(null)} onConfirm={doAction}
        title={action?.type === 'verify' ? 'Verify Doctor?' : 'Toggle Status?'}
        loading={loading} details={{ Name: action?.doctor?.name }} />
    </>
  )
}