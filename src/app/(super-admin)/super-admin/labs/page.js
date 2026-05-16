'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader  from '@/components/admin/AdminHeader'
import DataTable    from '@/components/ui/DataTable'
import Badge        from '@/components/ui/Badge'
import Modal        from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes lab-slide { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes lab-fade  { from{opacity:0} to{opacity:1} }
  @keyframes lab-spin  { to{transform:rotate(360deg)} }
`

const CERTIFICATIONS = [
  'NABL Accredited', 'CAP Certified', 'ISO 15189', 'ISO 9001',
  'NABH Accredited', 'JCI Certified', 'GLP Certified', 'AABB Certified',
]

/* ─── Action Button ──────────────────────────────────────────────────── */
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
      }}>{label}</button>
  )
}

function AddBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 16px', borderRadius: 12, border: 'none',
        background: h
          ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        boxShadow: h ? '0 6px 20px rgba(99,102,241,0.45)' : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
      }}>+ Add Lab</button>
  )
}

function SearchInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        fontSize: 16, pointerEvents: 'none', color: '#94a3b8',
      }}>🔍</span>
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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function LabsPage() {
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')
  const [action,    setAction]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [viewItem,  setViewItem]  = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)
  const { data, isLoading, mutate } = useSWR(`/api/labs?${qs}`, fetcher)

  const doAction = async () => {
    setLoading(true)
    const { type, lab } = action
    try {
      const url = type === 'approve'
        ? `/api/labs/${lab.id}/approve`
        : `/api/labs/${lab.id}/activate`
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
    { key: 'adminUserId',        header: 'Admin',    render: (v) => v ? <Badge variant="success" size="sm" dot>✅</Badge> : <Badge variant="warning" size="sm">⚠️</Badge> },
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

  const labs         = data?.labs || []
  const pendingCount = labs.filter((l) => !l.isApproved).length
  const noAdminCount = labs.filter((l) => !l.adminUserId).length

  return (
    <>
      <style>{KF}</style>
      <div>
        <AdminHeader
          title="Labs" subtitle="Manage lab partners"
          breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Labs' }]}
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {noAdminCount > 0 && (
                <Badge variant="danger" size="lg">{noAdminCount} No Admin</Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="warning" size="lg" dot pulse>{pendingCount} Pending</Badge>
              )}
              <AddBtn onClick={() => setPanelOpen(true)} />
            </div>
          }
        />

        <div style={{ marginBottom: 16 }}>
          <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>

        <DataTable columns={columns} data={labs} loading={isLoading}
          page={page} totalPages={data?.pagination?.totalPages || 1}
          onPageChange={setPage} emptyTitle="No labs found" />

        <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Lab Details" size="lg">
          {viewItem && (
            <LabDetail
              lab={viewItem}
              onUpdate={() => { mutate(); setViewItem(null) }}
            />
          )}
        </Modal>

        <ConfirmModal open={!!action} onClose={() => setAction(null)} onConfirm={doAction}
          title={action?.type === 'approve' ? 'Approve Lab?' : 'Toggle Status?'}
          confirmText="Confirm" loading={loading}
          variant={action?.type === 'approve' ? 'success' : 'warning'}
          details={{ Name: action?.lab?.name }} />

        {panelOpen && (
          <AddLabPanel
            onClose={() => setPanelOpen(false)}
            onSaved={() => { mutate(); setPanelOpen(false) }}
          />
        )}
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADD LAB PANEL
═══════════════════════════════════════════════════════════════════════════ */
function AddLabPanel({ onClose, onSaved }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState({
    name: '', slug: '',
    contactPhone: '', contactEmail: '',
    address: { line1: '', city: '', state: '', pinCode: '' },
    location: { lat: '', lng: '' },
    certifications: [],
    homeCollection: { enabled: false, areaCoverage: '' },
    platformFeePercent: 8,

    createAdmin: true,
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (!form.name) return
    const slug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
    setForm((f) => ({ ...f, slug }))
  }, [form.name])

  useEffect(() => {
    if (form.contactEmail && !form.adminEmail) {
      setForm((f) => ({ ...f, adminEmail: form.contactEmail }))
    }
  }, [form.contactEmail])

  useEffect(() => {
    if (form.name && !form.adminName) {
      setForm((f) => ({ ...f, adminName: `${form.name} Admin` }))
    }
  }, [form.name])

  const toggleCert = (c) => {
    setForm((f) => ({
      ...f,
      certifications: f.certifications.includes(c)
        ? f.certifications.filter((x) => x !== c)
        : [...f.certifications, c],
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim())          { toast.error('Lab name is required'); return }
    if (!form.slug.trim())          { toast.error('Slug is required');     return }
    if (!form.address.city.trim())  { toast.error('City is required');     return }

    if (form.createAdmin) {
      if (!form.adminName.trim())  { toast.error('Admin name is required');     return }
      if (!form.adminEmail.trim()) { toast.error('Admin email is required');    return }
      if (!form.adminPassword || form.adminPassword.length < 6) {
        toast.error('Admin password must be at least 6 characters')
        return
      }
    }

    setSaving(true)
    const result = { lab: null, admin: null, errors: [] }

    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (!meRes.ok) {
        toast.error('Session expired. Please login again.')
        setTimeout(() => { window.location.href = '/auth/login?redirect=/super-admin/labs' }, 1500)
        return
      }
      const me = await meRes.json()
      if (me?.data?.role !== 'super_admin') {
        toast.error(`Access denied. You are: ${me?.data?.role}. Need super_admin.`)
        return
      }

      console.log('[AddLab] Creating lab...')
      const areas = form.homeCollection.areaCoverage
        .split(',').map((a) => a.trim()).filter(Boolean)

      const labPayload = {
        name:         form.name.trim(),
        slug:         form.slug.trim().toLowerCase(),
        contactPhone: form.contactPhone || undefined,
        contactEmail: form.contactEmail || undefined,
        address:      form.address,
        certifications: form.certifications.length > 0 ? form.certifications : ['Diagnostic Services'],
        platformFeePercent: Number(form.platformFeePercent) || 8,
        homeCollection: {
          enabled:      form.homeCollection.enabled,
          areaCoverage: areas,
          slots:        [],
        },
        ...(form.location.lat && form.location.lng && {
          location: {
            type: 'Point',
            coordinates: [Number(form.location.lng), Number(form.location.lat)],
          },
        }),
      }

      const labRes  = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(labPayload),
      })

      if (labRes.status === 401) {
        toast.error('Session expired during lab creation')
        setTimeout(() => { window.location.href = '/auth/login?redirect=/super-admin/labs' }, 1500)
        return
      }

      const labJson = await labRes.json()

      if (!labJson.success) {
        result.errors.push(`Lab: ${labJson.error}`)
        toast.error(`❌ Lab failed: ${labJson.error}`)
        return
      }

      result.lab = labJson.data
      console.log('[AddLab] ✅ Lab created:', result.lab.id)
      toast.success(`✅ Lab "${result.lab.name}" created`)

      if (form.createAdmin) {
        console.log('[AddLab] Creating admin...')
        const adminPayload = {
          name:     form.adminName.trim(),
          email:    form.adminEmail.trim().toLowerCase(),
          phone:    form.adminPhone.trim() || undefined,
          password: form.adminPassword,
          role:     'lab_admin',
          labId:    result.lab.id,
        }

        const adminRes  = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(adminPayload),
        })

        const adminJson = await adminRes.json()
        console.log('[AddLab] Admin response:', adminJson)

        if (adminJson.success) {
          result.admin = adminJson.data
          toast.success(`✅ Admin login created: ${form.adminEmail}`)
        } else {
          result.errors.push(`Admin: ${adminJson.error}`)
          toast.error(`⚠️ Lab created but admin failed: ${adminJson.error}`)
        }
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('[AddLab] FINAL:')
      console.log('  Lab:    ', result.lab ? '✅ ' + result.lab.id : '❌')
      console.log('  Admin:  ', result.admin ? '✅ ' + result.admin.email : (form.createAdmin ? '❌' : '⏭️ Skipped'))

      onSaved()

    } catch (err) {
      console.error('[AddLab] Exception:', err)
      toast.error('Network error. Check console.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        animation: 'lab-fade .2s ease',
      }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 'min(560px, 95vw)',
        background: '#fff', zIndex: 910,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        animation: 'lab-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              🧪 Add New Lab
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Onboard a new diagnostic lab partner + admin
            </p>
          </div>
          <CloseBtn onClick={onClose} />
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: 20,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <SectionTitle>🧪 Lab Information</SectionTitle>
          <FormInput label="Lab Name *" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g., Dr. Lal PathLabs" />
          <FormInput label="URL Slug *" value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="dr-lal-pathlabs"
            hint="Auto-generated, used in URLs" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput label="Contact Phone" type="tel" value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              placeholder="+91 98765 43210" />
            <FormInput label="Contact Email" type="email" value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              placeholder="info@lab.com" />
          </div>

          <SectionTitle>📍 Address</SectionTitle>
          <FormInput label="Address Line" value={form.address.line1}
            onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, line1: e.target.value } }))}
            placeholder="Street, area, landmark" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput label="City *" value={form.address.city}
              onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))} />
            <FormInput label="State" value={form.address.state}
              onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
          </div>
          <FormInput label="PIN Code" value={form.address.pinCode}
            onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, pinCode: e.target.value } }))}
            placeholder="500001" />

          <SectionTitle>🌍 Location (Optional)</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput label="Latitude" type="number" step="any" value={form.location.lat}
              onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, lat: e.target.value } }))}
              placeholder="17.385" />
            <FormInput label="Longitude" type="number" step="any" value={form.location.lng}
              onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, lng: e.target.value } }))}
              placeholder="78.486" />
          </div>

          <SectionTitle>🏆 Certifications</SectionTitle>
          <PillGrid items={CERTIFICATIONS} selected={form.certifications} onToggle={toggleCert} />

          <SectionTitle>🏠 Home Collection</SectionTitle>
          <ToggleRow label="Enable home sample collection?"
            checked={form.homeCollection.enabled}
            onChange={(v) => setForm((f) => ({ ...f, homeCollection: { ...f.homeCollection, enabled: v } }))} />
          {form.homeCollection.enabled && (
            <FormInput label="Coverage Areas (comma-separated)"
              value={form.homeCollection.areaCoverage}
              onChange={(e) => setForm((f) => ({ ...f, homeCollection: { ...f.homeCollection, areaCoverage: e.target.value } }))}
              placeholder="Hyderabad, Secunderabad, Gachibowli"
              hint="Areas where you offer home collection" />
          )}

          <SectionTitle>💰 Platform Fee</SectionTitle>
          <FormInput label="Platform Fee Percent (%)" type="number" min="0" max="100"
            value={form.platformFeePercent}
            onChange={(e) => setForm((f) => ({ ...f, platformFeePercent: e.target.value }))}
            hint="Percentage commission charged by MEDLI" />

          <div style={{
            padding: 16,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(34,197,94,0.03))',
            borderRadius: 12,
            border: '1px solid rgba(16,185,129,0.15)',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.createAdmin}
                onChange={(e) => setForm((f) => ({ ...f, createAdmin: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: '#10b981', cursor: 'pointer' }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', margin: 0 }}>
                  👤 Create Lab Admin Account
                </p>
                <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                  Creates a login account to manage this lab's tests & bookings
                </p>
              </div>
            </label>

            {form.createAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FormInput label="Admin Full Name *" value={form.adminName}
                  onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                  placeholder="Lab Manager Name" />
                <FormInput label="Admin Email *" type="email" value={form.adminEmail}
                  onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                  placeholder="admin@lab.com"
                  hint="Used to login at /auth/login" />
                <FormInput label="Admin Phone (optional)" type="tel" value={form.adminPhone}
                  onChange={(e) => setForm((f) => ({ ...f, adminPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="9876543210"
                  hint="10-digit phone (optional alternative login)" />
                <FormInput label="Admin Password *" type="text" value={form.adminPassword}
                  onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  hint="⚠️ Share this with the lab admin securely" />
              </div>
            )}
          </div>
        </div>

        <div style={{
          padding: '14px 20px', borderTop: '1px solid #f1f5f9',
          flexShrink: 0, display: 'flex', gap: 10,
        }}>
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <SaveBtn onClick={handleSave} loading={saving}
            label={form.createAdmin ? '💾 Create Lab + Admin' : '💾 Create Lab'} />
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   LAB DETAIL VIEW (FIXED — was missing all content!)
═══════════════════════════════════════════════════════════════════════════ */
function LabDetail({ lab: l, onUpdate }) {
  const [showAdminForm, setShowAdminForm] = useState(false)

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
            : '🧪'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{l.name}</h3>
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
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Certifications</p>
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
        {l.regionId    && <IDRow label="Region"     value={l.regionId} />}
      </div>

      {/* Set Admin Section */}
      {!l.adminUserId ? (
        <div style={{
          padding: 16,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,191,36,0.05))',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 12,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: '0 0 4px' }}>
            ⚠️ No Admin Assigned
          </p>
          <p style={{ fontSize: 12, color: '#78350f', margin: '0 0 12px', lineHeight: 1.5 }}>
            This lab has no admin account. Without one, no one can manage tests or bookings.
          </p>
          {!showAdminForm ? (
            <button onClick={() => setShowAdminForm(true)} style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            }}>
              👤 Create Admin Account
            </button>
          ) : (
            <SetAdminForm
              labId={l.id}
              labName={l.name}
              defaultEmail={l.contactEmail}
              onCancel={() => setShowAdminForm(false)}
              onSuccess={() => { setShowAdminForm(false); onUpdate?.() }}
            />
          )}
        </div>
      ) : (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 10,
          fontSize: 12, color: '#059669', fontWeight: 600,
        }}>
          ✅ Has admin user (ID: {l.adminUserId.slice(-6)})
        </div>
      )}
    </div>
  )
}

/* ─── Set Admin Form ─────────────────────────────────────────────────── */
function SetAdminForm({ labId, labName, defaultEmail, onCancel, onSuccess }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState({
    name:     `${labName} Admin`,
    email:    defaultEmail || '',
    phone:    '',
    password: '',
  })

  const handleSubmit = async () => {
    if (!form.name.trim())  { toast.error('Name is required'); return }
    if (!form.email.trim() && !form.phone.trim()) {
      toast.error('Email or phone is required'); return
    }
    if (!form.password || form.password.length < 6) {
      toast.error('Password must be 6+ characters'); return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name:     form.name.trim(),
          email:    form.email.trim().toLowerCase() || undefined,
          phone:    form.phone.trim() || undefined,
          password: form.password,
          role:     'lab_admin',
          labId,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`✅ Admin created. Login: ${form.email || form.phone}`)
        onSuccess()
      } else {
        toast.error(json.error || 'Failed to create admin')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FormInput label="Admin Name *" value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      <FormInput label="Email" type="email" value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        placeholder="admin@lab.com" />
      <FormInput label="Phone (optional)" type="tel" value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
        placeholder="9876543210" />
      <FormInput label="Password *" type="text" value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        placeholder="Min 6 characters"
        hint="⚠️ Share securely with admin" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={onCancel} disabled={saving} style={{
          padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
          background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600,
          cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={handleSubmit} disabled={saving} style={{
          flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none',
          background: saving ? '#cbd5e1' : 'linear-gradient(135deg,#10b981,#059669)',
          color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}>{saving ? 'Creating...' : '✅ Create Admin'}</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED UI HELPERS
═══════════════════════════════════════════════════════════════════════════ */

function FormInput({ label, hint, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>
      )}
      <input {...props} value={props.value ?? ''}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e)  => { setFocused(false); props.onBlur?.(e) }}
        style={{
          padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', width: '100%',
        }}
      />
      {hint && <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{hint}</p>}
    </div>
  )
}

function PillGrid({ items, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item) => {
        const isSel = selected.includes(item)
        return (
          <button key={item} onClick={() => onToggle(item)} style={{
            padding: '6px 12px', borderRadius: 100, border: 'none',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            background: isSel ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f1f5f9',
            color: isSel ? '#fff' : '#64748b',
            transition: 'all .12s ease',
            boxShadow: isSel ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
          }}>{item}</button>
        )
      })}
    </div>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', borderRadius: 12,
      border: `1.5px solid ${checked ? '#6366f1' : '#e2e8f0'}`,
      background: checked ? 'rgba(99,102,241,0.05)' : '#fff',
      cursor: 'pointer', transition: 'all .15s ease',
    }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{label}</span>
      <div style={{
        position: 'relative', width: 42, height: 24, borderRadius: 100,
        background: checked ? '#6366f1' : '#cbd5e1',
        transition: 'background .15s ease',
      }}>
        <input type="checkbox" checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
        <div style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'left .18s ease',
        }} />
      </div>
    </label>
  )
}

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: '1px',
      margin: '4px 0 -4px',
    }}>{children}</p>
  )
}

function CloseBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: 'none',
        background: h ? '#f1f5f9' : 'transparent', cursor: 'pointer',
        fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center',
        justifyContent: 'center', transition: 'background .12s ease',
      }}>✕</button>
  )
}

function SaveBtn({ onClick, loading: isLoading, label = '💾 Save' }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      disabled={isLoading}
      style={{
        flex: 1, padding: '12px', borderRadius: 12, border: 'none',
        background: isLoading ? '#e2e8f0'
          : h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: isLoading ? '#94a3b8' : '#fff',
        fontSize: 13, fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        boxShadow: isLoading ? 'none' : h ? '0 8px 24px rgba(99,102,241,0.5)' : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
      {isLoading && (
        <span style={{
          width: 14, height: 14, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
          animation: 'lab-spin .7s linear infinite', display: 'inline-block',
        }} />
      )}
      {label}
    </button>
  )
}

function SecondaryBtn({ onClick, children }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '12px 20px', borderRadius: 12,
        border: '1.5px solid #e2e8f0',
        background: h ? '#f8fafc' : '#fff',
        color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'all .13s ease',
      }}>{children}</button>
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