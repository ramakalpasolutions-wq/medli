'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes rg-spin{to{transform:rotate(360deg)}}`

function FInput({ label, ...props }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>}
      <input {...props} onFocus={(e) => { setF(true); props.onFocus?.(e) }} onBlur={(e) => { setF(false); props.onBlur?.(e) }}
        style={{
          padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', width: '100%', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function AddBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: 'none',
        background: h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s ease',
      }}>
      + Add Region
    </button>
  )
}

export default function RegionsPage() {
  const [page,       setPage]       = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [form,       setForm]       = useState({ name: '', states: '', cities: '' })
  const [saving,     setSaving]     = useState(false)
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR(`/api/regions?page=${page}&limit=20`, fetcher)

  const createRegion = async () => {
    setSaving(true)
    try {
      const res  = await fetch('/api/regions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ name: form.name, states: form.states.split(',').map((s) => s.trim()).filter(Boolean), cities: form.cities.split(',').map((s) => s.trim()).filter(Boolean) }),
      })
      const json = await res.json()
      if (json.success) { toast.success('Region created'); mutate(); setShowCreate(false); setForm({ name: '', states: '', cities: '' }) }
      else toast.error(json.error)
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  const columns = [
    { key: 'name',     header: 'Region', render: (v) => <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{v}</span> },
    { key: 'states',   header: 'States', render: (v) => <span style={{ fontSize: 12, color: '#64748b' }}>{(v || []).join(', ') || '—'}</span> },
    { key: 'cities',   header: 'Cities', render: (v) => <span style={{ fontSize: 12, color: '#64748b' }}>{(v || []).slice(0, 3).join(', ') + ((v || []).length > 3 ? '...' : '') || '—'}</span> },
    { key: 'isActive', header: 'Status', render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge> },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Regions" subtitle="Manage regions"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Regions' }]}
        actions={<AddBtn onClick={() => setShowCreate(true)} />}
      />
      <DataTable columns={columns} data={data?.regions || []} loading={isLoading}
        page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Region" size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => setShowCreate(false)} style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <CreateBtn onClick={createRegion} loading={saving} />
          </div>
        }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FInput label="Region Name" value={form.name}   onChange={(e) => setForm({ ...form, name:   e.target.value })} required />
          <FInput label="States (comma-separated)" value={form.states} onChange={(e) => setForm({ ...form, states: e.target.value })} />
          <FInput label="Cities (comma-separated)" value={form.cities} onChange={(e) => setForm({ ...form, cities: e.target.value })} />
        </div>
      </Modal>
    </>
  )
}

function CreateBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading} onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '10px 18px', borderRadius: 12, border: 'none',
        background: isLoading ? '#e2e8f0' : h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: isLoading ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s ease',
      }}>
      {isLoading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'rg-spin .7s linear infinite', display: 'inline-block' }} />}
      Create
    </button>
  )
}