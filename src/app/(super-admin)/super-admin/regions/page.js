'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function FInput({ label, ...props }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>}
      <input {...props}
        value={props.value ?? ''}
        onFocus={(e) => { setF(true); props.onFocus?.(e) }}
        onBlur={(e) => { setF(false); props.onBlur?.(e) }}
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

function GradBtn({ label, onClick, loading: isLoading, variant = 'primary' }) {
  const [h, setH] = useState(false)
  const V = {
    primary:   { base: 'linear-gradient(135deg,#6366f1,#8b5cf6)', hov: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff' },
    secondary: { base: '#fff', hov: '#f8fafc', color: '#475569' },
  }
  const s = V[variant] || V.primary
  return (
    <button onClick={onClick} disabled={isLoading}
      onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '10px 18px', borderRadius: 12,
        border: variant === 'secondary' ? '1.5px solid #e2e8f0' : 'none',
        background: isLoading ? '#e2e8f0' : h ? s.hov : s.base,
        color: isLoading ? '#94a3b8' : s.color,
        fontSize: 13, fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s ease',
      }}>
      {isLoading && (
        <span style={{
          width: 13, height: 13, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
          animation: 'rg-spin .7s linear infinite', display: 'inline-block',
        }} />
      )}
      {label}
    </button>
  )
}

function ActionBtn({ label, variant, onClick }) {
  const [h, setH] = useState(false)
  const V = {
    ghost: { base: 'transparent', hov: '#f1f5f9', color: '#6366f1', border: 'none' },
  }
  const s = V[variant] || V.ghost
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', borderRadius: 8, border: s.border || 'none',
        background: h ? s.hov : s.base, color: s.color,
        fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .13s ease',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
      {label}
    </button>
  )
}

export default function RegionsPage() {
  const [page,       setPage]       = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [viewItem,   setViewItem]   = useState(null)
  const [form,       setForm]       = useState({ name: '', states: '', cities: '' })
  const [saving,     setSaving]     = useState(false)
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR(`/api/regions?page=${page}&limit=20`, fetcher)

  const createRegion = async () => {
    if (!form.name.trim()) { toast.error('Region name is required'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/regions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          name:   form.name.trim(),
          states: form.states.split(',').map((s) => s.trim()).filter(Boolean),
          cities: form.cities.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Region created')
        mutate()
        setShowCreate(false)
        setForm({ name: '', states: '', cities: '' })
      } else {
        toast.error(json.error)
      }
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  const columns = [
    {
      key: 'name', header: 'Region',
      render: (v) => <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{v}</span>,
    },
    {
      key: 'states', header: 'States',
      render: (v) => <span style={{ fontSize: 12, color: '#64748b' }}>{(v || []).join(', ') || '—'}</span>,
    },
    {
      key: 'cities', header: 'Cities',
      render: (v) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {(v || []).slice(0, 3).join(', ')}{(v || []).length > 3 ? ` +${v.length - 3}` : ''}{!(v || []).length ? '—' : ''}
        </span>
      ),
    },
    {
      key: 'isActive', header: 'Status',
      render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <ActionBtn label="👁 View" variant="ghost" onClick={() => setViewItem(row)} />
      ),
    },
  ]

  return (
    <div>
      <style>{`@keyframes rg-spin{to{transform:rotate(360deg)}}`}</style>

      <AdminHeader title="Regions" subtitle="Manage regions"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Regions' }]}
        actions={<GradBtn label="+ Add Region" onClick={() => setShowCreate(true)} />}
      />

      <DataTable columns={columns} data={data?.regions || []} loading={isLoading}
        page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage}
        emptyTitle="No regions found" />

      {/* ── Create Region Modal ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Region" size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <GradBtn label="Cancel" variant="secondary" onClick={() => setShowCreate(false)} />
            <GradBtn label="Create" onClick={createRegion} loading={saving} />
          </div>
        }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FInput label="Region Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FInput label="States (comma-separated)" value={form.states}
            onChange={(e) => setForm({ ...form, states: e.target.value })}
            placeholder="e.g. Karnataka, Maharashtra" />
          <FInput label="Cities (comma-separated)" value={form.cities}
            onChange={(e) => setForm({ ...form, cities: e.target.value })}
            placeholder="e.g. Bangalore, Mumbai, Pune" />
        </div>
      </Modal>

      {/* ── View Detail Modal ── */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Region Details" size="md">
        {viewItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{
              display: 'flex', gap: 16, alignItems: 'center',
              padding: 16, background: '#f0f9ff', borderRadius: 16, border: '1px solid #bae6fd',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, flexShrink: 0,
              }}>
                🌍
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  {viewItem.name}
                </h3>
                <Badge variant={viewItem.isActive ? 'success' : 'neutral'} size="sm">
                  {viewItem.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {/* States */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                States ({viewItem.states?.length || 0})
              </p>
              {viewItem.states?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewItem.states.map((s) => (
                    <span key={s} style={{
                      fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 100,
                      background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                    }}>{s}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#94a3b8' }}>No states assigned</p>
              )}
            </div>

            {/* Cities */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                Cities ({viewItem.cities?.length || 0})
              </p>
              {viewItem.cities?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewItem.cities.map((c) => (
                    <span key={c} style={{
                      fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 100,
                      background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0',
                    }}>{c}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#94a3b8' }}>No cities assigned</p>
              )}
            </div>

            {/* Manager */}
            <div style={{
              padding: '12px 14px', background: '#f8fafc', borderRadius: 12,
              border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <IDRow label="Region ID" value={viewItem.id} />
              <IDRow label="Manager ID" value={viewItem.managerId || '—'} />
              <IDRow label="Created" value={new Date(viewItem.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function IDRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}