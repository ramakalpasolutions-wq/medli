'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function ABtn({ label, variant, onClick }) {
  const [h, setH] = useState(false)
  const V = {
    success: { base: 'rgba(16,185,129,0.07)', hov: 'rgba(16,185,129,0.14)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
    danger:  { base: 'rgba(239,68,68,0.07)',  hov: 'rgba(239,68,68,0.14)',  color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
    outline: { base: '#fff', hov: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' },
    ghost:   { base: 'transparent', hov: '#f1f5f9', color: '#6366f1', border: 'none' },
  }
  const s = V[variant] || V.outline
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

function SearchInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', color: '#94a3b8' }}>🔍</span>
      <input value={value} onChange={onChange} placeholder="Search labs…"
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

export default function LabsPage() {
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [action,   setAction]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)
  const { data, isLoading, mutate } = useSWR(`/api/labs?${qs}`, fetcher)

  const doAction = async () => {
    setLoading(true)
    const { type, lab } = action
    try {
      const url  = type === 'approve' ? `/api/labs/${lab.id}/approve` : `/api/labs/${lab.id}/activate`
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
      key: 'name', header: 'Lab',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, flexShrink: 0,
          }}>🧪</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{v}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>{row.address?.city || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'isApproved',         header: 'Approved', render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Yes' : 'Pending'}</Badge> },
    { key: 'isActive',           header: 'Active',   render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'platformFeePercent', header: 'Fee %',    render: (v) => <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>{v}%</span> },
    {
      key: 'actions', header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <ABtn label="👁 View" variant="ghost" onClick={() => setViewItem(row)} />
          {!row.isApproved && <ABtn label="✓ Approve" variant="success" onClick={() => setAction({ type: 'approve', lab: row })} />}
          <ABtn label={row.isActive ? 'Disable' : 'Enable'} variant={row.isActive ? 'danger' : 'outline'} onClick={() => setAction({ type: 'toggle', lab: row })} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <AdminHeader title="Labs" subtitle="Manage lab partners"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Labs' }]} />

      <div style={{ marginBottom: 16 }}>
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <DataTable columns={columns} data={data?.labs || []} loading={isLoading}
        page={page} totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage} emptyTitle="No labs found" />

      {/* ── View Detail Modal ── */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Lab Details" size="lg">
        {viewItem && <LabDetail lab={viewItem} />}
      </Modal>

      <ConfirmModal open={!!action} onClose={() => setAction(null)} onConfirm={doAction}
        title={action?.type === 'approve' ? 'Approve Lab?' : 'Toggle Status?'}
        confirmText="Confirm" loading={loading}
        variant={action?.type === 'approve' ? 'success' : 'warning'}
        details={{ Name: action?.lab?.name }} />
    </div>
  )
}

function LabDetail({ lab: l }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
        padding: 16, background: '#f0fdf4', borderRadius: 16, border: '1px solid #bbf7d0',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: '#dcfce7', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 28, flexShrink: 0,
        }}>
          {l.images?.logo
            ? <img src={l.images.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
            : '🧪'
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
            {l.name}
          </h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant={l.isApproved ? 'success' : 'warning'} size="sm" dot>
              {l.isApproved ? 'Approved' : 'Pending'}
            </Badge>
            <Badge variant={l.isActive ? 'success' : 'neutral'} size="sm">
              {l.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="info" size="sm">Fee: {l.platformFeePercent}%</Badge>
            {l.homeCollection?.enabled && (
              <Badge variant="success" size="sm">🏠 Home Collection</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12,
      }}>
        <InfoBox label="📍 Address" value={
          [l.address?.line1, l.address?.city, l.address?.state, l.address?.pinCode].filter(Boolean).join(', ') || '—'
        } />
        <InfoBox label="📞 Phone" value={l.contactPhone || '—'} />
        <InfoBox label="✉️ Email" value={l.contactEmail || '—'} />
        <InfoBox label="📅 Added" value={new Date(l.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} />
      </div>

      {/* Rating */}
      {l.rating?.average > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a',
        }}>
          <span style={{ fontSize: 24 }}>⭐</span>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#92400e', margin: 0 }}>{l.rating.average.toFixed(1)}</p>
            <p style={{ fontSize: 11, color: '#b45309', margin: 0 }}>{l.rating.count} reviews</p>
          </div>
        </div>
      )}

      {/* Certifications */}
      {l.certifications?.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Certifications
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {l.certifications.map((c) => (
              <span key={c} style={{
                fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(16,185,129,0.08)', color: '#059669',
              }}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Home Collection Coverage */}
      {l.homeCollection?.enabled && l.homeCollection.areaCoverage?.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            🏠 Home Collection Areas
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {l.homeCollection.areaCoverage.map((area) => (
              <span key={area} style={{
                fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 100,
                background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
              }}>{area}</span>
            ))}
          </div>
        </div>
      )}

      {/* IDs */}
      <div style={{
        padding: '12px 14px', background: '#f8fafc', borderRadius: 12,
        border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <IDRow label="Lab ID" value={l.id} />
        <IDRow label="Slug" value={l.slug} />
        {l.adminUserId && <IDRow label="Admin User" value={l.adminUserId} />}
        {l.regionId && <IDRow label="Region" value={l.regionId} />}
      </div>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div style={{
      padding: '12px 14px', background: '#fff', borderRadius: 12,
      border: '1px solid #f1f5f9',
    }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, wordBreak: 'break-word' }}>
        {value}
      </p>
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