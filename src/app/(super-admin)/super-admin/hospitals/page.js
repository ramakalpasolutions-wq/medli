'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader  from '@/components/admin/AdminHeader'
import DataTable    from '@/components/ui/DataTable'
import Badge        from '@/components/ui/Badge'
import Button       from '@/components/ui/Button'
import Input        from '@/components/ui/Input'
import Modal        from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/ToastContext'
import {
  Search, CheckCircle, ToggleLeft, Eye, MapPin, Phone, Mail, Clock, Plus, Pencil,
} from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `
  @keyframes hosp-slide { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes hosp-fade  { from{opacity:0} to{opacity:1} }
  @keyframes hosp-spin  { to{transform:rotate(360deg)} }
`

const DEPARTMENTS = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics',
  'Gynecology', 'Neurology', 'Dermatology', 'ENT',
  'Ophthalmology', 'Psychiatry', 'Surgery', 'Emergency',
  'Radiology', 'Oncology', 'Nephrology', 'Pulmonology',
]

const SERVICES = [
  '24/7 Emergency', 'ICU', 'Pharmacy', 'Diagnostic Lab',
  'Ambulance', 'Blood Bank', 'Operation Theater', 'Maternity',
  'Outpatient', 'Inpatient', 'Telemedicine', 'Insurance Cashless',
]

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function HospitalsPage() {
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [action,     setAction]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [viewItem,   setViewItem]   = useState(null)
  const [editItem,   setEditItem]   = useState(null)   // ← NEW
  const [panelOpen,  setPanelOpen]  = useState(false)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)

  const { data, isLoading, mutate } = useSWR(`/api/hospitals?${qs}`, fetcher)

  const performAction = async () => {
    setLoading(true)
    const { type, hospital } = action
    try {
      const url = type === 'approve'
        ? `/api/hospitals/${hospital.id}/approve`
        : `/api/hospitals/${hospital.id}/activate`
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
      key: 'name', header: 'Hospital',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {row.images?.logo ? (
            <img src={row.images.logo} alt=""
              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>🏥</div>
          )}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{v}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>
              {row.address?.city || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'isApproved', header: 'Approved',
      render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Yes' : 'Pending'}</Badge>,
    },
    {
      key: 'isActive', header: 'Active',
      render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'adminUserId', header: 'Admin',
      render: (v) => v
        ? <Badge variant="success" size="sm" dot>✅ Set</Badge>
        : <Badge variant="warning" size="sm">⚠️ Missing</Badge>,
    },
    {
      key: 'platformFeePercent', header: 'Fee %',
      render: (v) => `${v}%`,
    },
    {
      key: 'createdAt', header: 'Added',
      render: (v) => new Date(v).toLocaleDateString('en-IN'),
    },
    {
      key: 'actions', header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Button size="xs" variant="ghost" leftIcon={<Eye className="w-3 h-3" />}
            onClick={() => setViewItem(row)}>
            View
          </Button>
          {/* ── NEW: Edit button ─────────────────────────────────── */}
          <Button size="xs" variant="ghost" leftIcon={<Pencil className="w-3 h-3" />}
            onClick={() => setEditItem(row)}
            style={{ color: '#6366f1' }}>
            Edit
          </Button>
          {!row.isApproved && (
            <Button size="xs" variant="primary" leftIcon={<CheckCircle className="w-3 h-3" />}
              onClick={() => setAction({ type: 'approve', hospital: row })}>
              Approve
            </Button>
          )}
          <Button size="xs" variant={row.isActive ? 'danger' : 'outline'}
            leftIcon={<ToggleLeft className="w-3 h-3" />}
            onClick={() => setAction({ type: 'toggle', hospital: row })}>
            {row.isActive ? 'Disable' : 'Enable'}
          </Button>
        </div>
      ),
    },
  ]

  const hospitals    = data?.hospitals   || []
  const totalPages   = data?.pagination?.totalPages || 1
  const pendingCount = hospitals.filter((h) => !h.isApproved).length
  const noAdminCount = hospitals.filter((h) => !h.adminUserId).length

  return (
    <>
      <style>{KF}</style>
      <div>
        <AdminHeader
          title="Hospitals" subtitle="Manage hospital partners"
          breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Hospitals' }]}
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {noAdminCount > 0 && (
                <Badge variant="danger" size="lg">{noAdminCount} No Admin</Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="warning" size="lg" dot pulse>{pendingCount} Pending</Badge>
              )}
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setPanelOpen(true)}>
                Add Hospital
              </Button>
            </div>
          }
        />

        <div style={{ marginBottom: 16 }}>
          <Input placeholder="Search hospitals..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leftIcon={<Search className="w-4 h-4" />} className="w-72" />
        </div>

        <DataTable columns={columns} data={hospitals} loading={isLoading}
          page={page} totalPages={totalPages} onPageChange={setPage}
          emptyTitle="No hospitals found" />

        {/* View Detail Modal */}
        <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Hospital Details" size="lg">
          {viewItem && (
            <HospitalDetail
              hospital={viewItem}
              onUpdate={() => { mutate(); setViewItem(null) }}
            />
          )}
        </Modal>

        {/* Confirm Action Modal */}
        <ConfirmModal open={!!action} onClose={() => setAction(null)} onConfirm={performAction}
          title={action?.type === 'approve' ? 'Approve Hospital?' : action?.hospital?.isActive ? 'Disable Hospital?' : 'Enable Hospital?'}
          message={action?.type === 'approve' ? 'This hospital will become visible on the platform.' : 'Toggle hospital active status.'}
          confirmText={action?.type === 'approve' ? 'Approve' : 'Confirm'}
          variant={action?.type === 'approve' ? 'success' : 'warning'}
          loading={loading}
          details={{ Name: action?.hospital?.name, City: action?.hospital?.address?.city || '—' }}
        />

        {/* Add Hospital Slide Panel */}
        {panelOpen && (
          <AddHospitalPanel
            onClose={() => setPanelOpen(false)}
            onSaved={() => { mutate(); setPanelOpen(false) }}
          />
        )}

        {/* ── NEW: Edit Hospital Slide Panel ──────────────────────────── */}
        {editItem && (
          <EditHospitalPanel
            hospital={editItem}
            onClose={() => setEditItem(null)}
            onSaved={() => { mutate(); setEditItem(null) }}
          />
        )}
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   EDIT HOSPITAL PANEL  ← NEW
═══════════════════════════════════════════════════════════════════════════ */
function EditHospitalPanel({ hospital, onClose, onSaved }) {
  const toast   = useToast()
  const [saving, setSaving] = useState(false)
  const [tab,    setTab]    = useState('info') // 'info' | 'location' | 'services' | 'hours'

  // Pre-fill form from existing hospital data
  const [form, setForm] = useState({
    name:               hospital.name              || '',
    slug:               hospital.slug              || '',
    contactPhone:       hospital.contactPhone      || '',
    contactEmail:       hospital.contactEmail      || '',
    address: {
      line1:   hospital.address?.line1   || '',
      city:    hospital.address?.city    || '',
      state:   hospital.address?.state   || '',
      pinCode: hospital.address?.pinCode || '',
    },
    location: {
      lat: hospital.location?.coordinates?.[1] ?? '',
      lng: hospital.location?.coordinates?.[0] ?? '',
    },
    departments:        hospital.departments || [],
    services:           hospital.services    || [],
    platformFeePercent: hospital.platformFeePercent ?? 10,
    operatingHours:     hospital.operatingHours || {
      mon: { open: '09:00', close: '18:00', isOpen: true },
      tue: { open: '09:00', close: '18:00', isOpen: true },
      wed: { open: '09:00', close: '18:00', isOpen: true },
      thu: { open: '09:00', close: '18:00', isOpen: true },
      fri: { open: '09:00', close: '18:00', isOpen: true },
      sat: { open: '09:00', close: '14:00', isOpen: true },
      sun: { open: '00:00', close: '00:00', isOpen: false },
    },
  })

  // Track which fields were actually changed (for diff display)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }))
    setDirty(true)
  }
  const setAddr = (key, val) => {
    setForm((f) => ({ ...f, address: { ...f.address, [key]: val } }))
    setDirty(true)
  }
  const setLoc = (key, val) => {
    setForm((f) => ({ ...f, location: { ...f.location, [key]: val } }))
    setDirty(true)
  }
  const setHour = (day, field, val) => {
    setForm((f) => ({
      ...f,
      operatingHours: {
        ...f.operatingHours,
        [day]: { ...f.operatingHours[day], [field]: val },
      },
    }))
    setDirty(true)
  }
  const toggleDept = (d) => {
    set('departments', form.departments.includes(d)
      ? form.departments.filter((x) => x !== d)
      : [...form.departments, d])
  }
  const toggleService = (s) => {
    set('services', form.services.includes(s)
      ? form.services.filter((x) => x !== s)
      : [...form.services, s])
  }

  const handleSave = async () => {
    if (!form.name.trim())         { toast.error('Hospital name is required'); return }
    if (!form.slug.trim())         { toast.error('Slug is required');           return }
    if (!form.address.city.trim()) { toast.error('City is required');           return }

    setSaving(true)
    try {
      const payload = {
        name:               form.name.trim(),
        slug:               form.slug.trim().toLowerCase(),
        contactPhone:       form.contactPhone || undefined,
        contactEmail:       form.contactEmail || undefined,
        address:            form.address,
        departments:        form.departments,
        services:           form.services,
        platformFeePercent: Number(form.platformFeePercent) || 10,
        operatingHours:     form.operatingHours,
        ...(form.location.lat && form.location.lng
          ? { location: { lat: Number(form.location.lat), lng: Number(form.location.lng) } }
          : {}),
      }

      const res  = await fetch(`/api/hospitals/${hospital.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (json.success) {
        toast.success(`✅ "${form.name}" updated successfully`)
        onSaved()
      } else {
        toast.error(json.error || 'Update failed')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const TABS = [
    { id: 'info',     label: '🏥 Info' },
    { id: 'location', label: '📍 Address' },
    { id: 'services', label: '🛎️ Services' },
    { id: 'hours',    label: '🕐 Hours' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        animation: 'hosp-fade .2s ease',
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 'min(600px, 96vw)',
        background: '#fff', zIndex: 910,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 48px rgba(0,0,0,0.15)',
        animation: 'hosp-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', flexShrink: 0,
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.02))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>✏️</div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Edit Hospital
              </h3>
              <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                {hospital.name}
                {dirty && (
                  <span style={{
                    marginLeft: 8, fontSize: 10, fontWeight: 600,
                    color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
                    padding: '1px 6px', borderRadius: 100,
                  }}>Unsaved changes</span>
                )}
              </p>
            </div>
          </div>
          <CloseBtn onClick={onClose} />
        </div>

        {/* ── Tab Bar ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #f1f5f9',
          background: '#fafafa', flexShrink: 0, overflowX: 'auto',
        }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 18px', border: 'none', background: 'none',
              fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? '#6366f1' : '#64748b',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              borderBottom: `2px solid ${tab === t.id ? '#6366f1' : 'transparent'}`,
              transition: 'all .13s ease',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Scrollable Content ───────────────────────────────────── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 20,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>

          {/* ── Tab: Info ─────────────────────────────────────────── */}
          {tab === 'info' && (
            <>
              <SectionTitle>Basic Information</SectionTitle>

              <FormInput label="Hospital Name *" value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g., Apollo Hospitals" />

              <FormInput label="URL Slug *" value={form.slug}
                onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="apollo-hospitals"
                hint="Used in URLs — lowercase letters, numbers and hyphens only" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormInput label="Contact Phone" type="tel" value={form.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  placeholder="+91 98765 43210" />
                <FormInput label="Contact Email" type="email" value={form.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  placeholder="info@hospital.com" />
              </div>

              <SectionTitle>Platform Settings</SectionTitle>

              <FormInput label="Platform Fee (%)" type="number" min="0" max="100"
                value={form.platformFeePercent}
                onChange={(e) => set('platformFeePercent', e.target.value)}
                hint="Percentage commission charged by MEDLI" />

              {/* Read-only info */}
              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: '#f8fafc', border: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Read-only
                </p>
                <IDRow label="Hospital ID" value={hospital.id} />
                {hospital.adminUserId && <IDRow label="Admin User ID" value={hospital.adminUserId} />}
                <IDRow label="Created" value={new Date(hospital.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} />
              </div>
            </>
          )}

          {/* ── Tab: Address & Location ──────────────────────────── */}
          {tab === 'location' && (
            <>
              <SectionTitle>Address</SectionTitle>

              <FormInput label="Address Line" value={form.address.line1}
                onChange={(e) => setAddr('line1', e.target.value)}
                placeholder="Street, area, landmark" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormInput label="City *" value={form.address.city}
                  onChange={(e) => setAddr('city', e.target.value)} />
                <FormInput label="State" value={form.address.state}
                  onChange={(e) => setAddr('state', e.target.value)} />
              </div>

              <FormInput label="PIN Code" value={form.address.pinCode}
                onChange={(e) => setAddr('pinCode', e.target.value)}
                placeholder="500001" />

              <SectionTitle>GPS Coordinates (Optional)</SectionTitle>

              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)',
                fontSize: 11, color: '#6366f1', marginBottom: 4,
              }}>
                💡 Used for "nearby hospitals" search. Leave blank if unknown.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormInput label="Latitude" type="number" step="any" value={form.location.lat}
                  onChange={(e) => setLoc('lat', e.target.value)}
                  placeholder="17.385" />
                <FormInput label="Longitude" type="number" step="any" value={form.location.lng}
                  onChange={(e) => setLoc('lng', e.target.value)}
                  placeholder="78.486" />
              </div>
            </>
          )}

          {/* ── Tab: Departments & Services ─────────────────────── */}
          {tab === 'services' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionTitle>
                  Departments
                  <span style={{ color: '#6366f1', fontWeight: 700, marginLeft: 4 }}>
                    ({form.departments.length})
                  </span>
                </SectionTitle>
                <button onClick={() => set('departments', [])} style={{
                  fontSize: 11, color: '#ef4444', background: 'none', border: 'none',
                  cursor: 'pointer', fontWeight: 600,
                }}>Clear all</button>
              </div>
              <PillGrid items={DEPARTMENTS} selected={form.departments} onToggle={toggleDept} />

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionTitle>
                  Services
                  <span style={{ color: '#10b981', fontWeight: 700, marginLeft: 4 }}>
                    ({form.services.length})
                  </span>
                </SectionTitle>
                <button onClick={() => set('services', [])} style={{
                  fontSize: 11, color: '#ef4444', background: 'none', border: 'none',
                  cursor: 'pointer', fontWeight: 600,
                }}>Clear all</button>
              </div>
              <PillGrid items={SERVICES} selected={form.services} onToggle={toggleService} color="green" />
            </>
          )}

          {/* ── Tab: Operating Hours ────────────────────────────── */}
          {tab === 'hours' && (
            <>
              <SectionTitle>Operating Hours</SectionTitle>

              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                fontSize: 11, color: '#92400e',
              }}>
                💡 Toggle each day open/closed and set opening times. Times use 24-hour format (e.g. 09:00, 18:30).
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DAYS.map((day) => {
                  const slot = form.operatingHours?.[day] || { open: '09:00', close: '18:00', isOpen: false }
                  return (
                    <div key={day} style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr 1fr',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: slot.isOpen ? '#f0fdf4' : '#f8fafc',
                      border: `1px solid ${slot.isOpen ? '#bbf7d0' : '#e2e8f0'}`,
                      transition: 'all .15s ease',
                    }}>
                      {/* Day toggle */}
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      }}>
                        <div
                          onClick={() => setHour(day, 'isOpen', !slot.isOpen)}
                          style={{
                            width: 36, height: 20, borderRadius: 100,
                            background: slot.isOpen ? '#10b981' : '#cbd5e1',
                            position: 'relative', cursor: 'pointer', flexShrink: 0,
                            transition: 'background .15s ease',
                          }}>
                          <div style={{
                            position: 'absolute',
                            top: 2, left: slot.isOpen ? 18 : 2,
                            width: 16, height: 16,
                            borderRadius: '50%', background: '#fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            transition: 'left .15s ease',
                          }} />
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: slot.isOpen ? '#166534' : '#94a3b8',
                        }}>{DAY_LABELS[day].slice(0, 3)}</span>
                      </label>

                      {/* Open time */}
                      <div>
                        <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 3px', fontWeight: 600 }}>OPEN</p>
                        <input type="time" value={slot.open || '09:00'}
                          disabled={!slot.isOpen}
                          onChange={(e) => setHour(day, 'open', e.target.value)}
                          style={{
                            width: '100%', padding: '6px 8px', fontSize: 12,
                            borderRadius: 8, border: '1.5px solid #e2e8f0',
                            background: slot.isOpen ? '#fff' : '#f1f5f9',
                            color: slot.isOpen ? '#0f172a' : '#94a3b8',
                            outline: 'none', fontFamily: 'inherit',
                            cursor: slot.isOpen ? 'default' : 'not-allowed',
                          }} />
                      </div>

                      {/* Close time */}
                      <div>
                        <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 3px', fontWeight: 600 }}>CLOSE</p>
                        <input type="time" value={slot.close || '18:00'}
                          disabled={!slot.isOpen}
                          onChange={(e) => setHour(day, 'close', e.target.value)}
                          style={{
                            width: '100%', padding: '6px 8px', fontSize: 12,
                            borderRadius: 8, border: '1.5px solid #e2e8f0',
                            background: slot.isOpen ? '#fff' : '#f1f5f9',
                            color: slot.isOpen ? '#0f172a' : '#94a3b8',
                            outline: 'none', fontFamily: 'inherit',
                            cursor: slot.isOpen ? 'default' : 'not-allowed',
                          }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #f1f5f9',
          flexShrink: 0, display: 'flex', gap: 10,
          background: '#fafafa',
        }}>
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <SaveBtn
            onClick={handleSave}
            loading={saving}
            label={saving ? 'Saving...' : '💾 Save Changes'}
          />
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADD HOSPITAL PANEL  (unchanged)
═══════════════════════════════════════════════════════════════════════════ */
function AddHospitalPanel({ onClose, onSaved }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState({
    name: '', slug: '',
    contactPhone: '', contactEmail: '',
    address: { line1: '', city: '', state: '', pinCode: '' },
    location: { lat: '', lng: '' },
    departments: [], services: [],
    platformFeePercent: 10,

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

  const toggleDept = (d) => {
    setForm((f) => ({
      ...f,
      departments: f.departments.includes(d)
        ? f.departments.filter((x) => x !== d)
        : [...f.departments, d],
    }))
  }

  const toggleService = (s) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(s)
        ? f.services.filter((x) => x !== s)
        : [...f.services, s],
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim())          { toast.error('Hospital name is required'); return }
    if (!form.slug.trim())          { toast.error('Slug is required');           return }
    if (!form.address.city.trim())  { toast.error('City is required');           return }

    if (form.createAdmin) {
      if (!form.adminName.trim())  { toast.error('Admin name is required');     return }
      if (!form.adminEmail.trim()) { toast.error('Admin email is required');    return }
      if (!form.adminPassword || form.adminPassword.length < 6) {
        toast.error('Admin password must be at least 6 characters')
        return
      }
    }

    setSaving(true)
    const result = { hospital: null, admin: null, errors: [] }

    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (!meRes.ok) {
        toast.error('Session expired. Please login again.')
        setTimeout(() => { window.location.href = '/auth/login?redirect=/super-admin/hospitals' }, 1500)
        return
      }
      const me = await meRes.json()
      if (me?.data?.role !== 'super_admin') {
        toast.error(`Access denied. You are: ${me?.data?.role}. Need super_admin.`)
        return
      }

      const hospitalPayload = {
        name:         form.name.trim(),
        slug:         form.slug.trim().toLowerCase(),
        contactPhone: form.contactPhone || undefined,
        contactEmail: form.contactEmail || undefined,
        address:      form.address,
        departments:  form.departments.length > 0 ? form.departments : ['General Medicine'],
        services:     form.services.length > 0 ? form.services : ['Outpatient', 'Inpatient'],
        platformFeePercent: Number(form.platformFeePercent) || 10,
        ...(form.location.lat && form.location.lng && {
          location: {
            type: 'Point',
            coordinates: [Number(form.location.lng), Number(form.location.lat)],
          },
        }),
      }

      const hospRes  = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(hospitalPayload),
      })

      if (hospRes.status === 401) {
        toast.error('Session expired during hospital creation')
        setTimeout(() => { window.location.href = '/auth/login?redirect=/super-admin/hospitals' }, 1500)
        return
      }

      const hospJson = await hospRes.json()

      if (!hospJson.success) {
        result.errors.push(`Hospital: ${hospJson.error}`)
        toast.error(`❌ Hospital failed: ${hospJson.error}`)
        return
      }

      result.hospital = hospJson.data
      toast.success(`✅ Hospital "${result.hospital.name}" created`)

      if (form.createAdmin) {
        const adminPayload = {
          name:       form.adminName.trim(),
          email:      form.adminEmail.trim().toLowerCase(),
          phone:      form.adminPhone.trim() || undefined,
          password:   form.adminPassword,
          role:       'hospital_admin',
          hospitalId: result.hospital.id,
        }

        const adminRes  = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(adminPayload),
        })

        const adminJson = await adminRes.json()

        if (adminJson.success) {
          result.admin = adminJson.data
          toast.success(`✅ Admin login created: ${form.adminEmail}`)
        } else {
          result.errors.push(`Admin: ${adminJson.error}`)
          toast.error(`⚠️ Hospital created but admin failed: ${adminJson.error}`)
        }
      }

      onSaved()

    } catch (err) {
      console.error('[AddHospital] Exception:', err)
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
        animation: 'hosp-fade .2s ease',
      }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 'min(560px, 95vw)',
        background: '#fff', zIndex: 910,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        animation: 'hosp-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              🏥 Add New Hospital
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Fill in hospital + admin user details
            </p>
          </div>
          <CloseBtn onClick={onClose} />
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: 20,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <SectionTitle>🏥 Hospital Information</SectionTitle>
          <FormInput label="Hospital Name *" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g., Apollo Hospitals" />
          <FormInput label="URL Slug *" value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="apollo-hospitals"
            hint="Auto-generated, used in URLs" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput label="Contact Phone" type="tel" value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              placeholder="+91 98765 43210" />
            <FormInput label="Contact Email" type="email" value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              placeholder="info@hospital.com" />
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

          <SectionTitle>🏥 Departments {form.departments.length === 0 && <span style={{ color:'#f59e0b', fontWeight: 500 }}>(default: General Medicine)</span>}</SectionTitle>
          <PillGrid items={DEPARTMENTS} selected={form.departments} onToggle={toggleDept} />

          <SectionTitle>🛎️ Services {form.services.length === 0 && <span style={{ color:'#f59e0b', fontWeight: 500 }}>(default: Outpatient, Inpatient)</span>}</SectionTitle>
          <PillGrid items={SERVICES} selected={form.services} onToggle={toggleService} />

          <SectionTitle>💰 Platform Fee</SectionTitle>
          <FormInput label="Platform Fee Percent (%)" type="number" min="0" max="100"
            value={form.platformFeePercent}
            onChange={(e) => setForm((f) => ({ ...f, platformFeePercent: e.target.value }))}
            hint="Percentage commission charged by MEDLI" />

          <div style={{
            padding: 16,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.03))',
            borderRadius: 12,
            border: '1px solid rgba(99,102,241,0.15)',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.createAdmin}
                onChange={(e) => setForm((f) => ({ ...f, createAdmin: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: '#6366f1', cursor: 'pointer' }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', margin: 0 }}>
                  👤 Create Hospital Admin Account
                </p>
                <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                  Creates a login account to manage this hospital's doctors & bookings
                </p>
              </div>
            </label>

            {form.createAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FormInput label="Admin Full Name *" value={form.adminName}
                  onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                  placeholder="Dr. Hospital Manager" />
                <FormInput label="Admin Email *" type="email" value={form.adminEmail}
                  onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                  placeholder="admin@hospital.com"
                  hint="Used to login at /auth/login" />
                <FormInput label="Admin Phone (optional)" type="tel" value={form.adminPhone}
                  onChange={(e) => setForm((f) => ({ ...f, adminPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="9876543210"
                  hint="10-digit phone (optional alternative login)" />
                <FormInput label="Admin Password *" type="text" value={form.adminPassword}
                  onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  hint="⚠️ Share this with the hospital admin securely" />
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
            label={form.createAdmin ? '💾 Create Hospital + Admin' : '💾 Create Hospital'} />
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOSPITAL DETAIL VIEW  (unchanged)
═══════════════════════════════════════════════════════════════════════════ */
function HospitalDetail({ hospital: h, onUpdate }) {
  const [showAdminForm, setShowAdminForm] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
        padding: 16, background: '#f8fafc', borderRadius: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(135deg,#dbeafe,#c7d2fe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, flexShrink: 0,
        }}>
          {h.images?.logo
            ? <img src={h.images.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '🏥'
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{h.name}</h3>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>{h.slug}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant={h.isApproved ? 'success' : 'warning'} size="sm" dot>
              {h.isApproved ? 'Approved' : 'Pending'}
            </Badge>
            <Badge variant={h.isActive ? 'success' : 'neutral'} size="sm">
              {h.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="info" size="sm">Fee: {h.platformFeePercent}%</Badge>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoCard icon={<MapPin style={{ width: 16, height: 16, color: '#6366f1' }} />} label="Address"
          value={[h.address?.line1, h.address?.city, h.address?.state, h.address?.pinCode].filter(Boolean).join(', ') || '—'} />
        <InfoCard icon={<Phone style={{ width: 16, height: 16, color: '#10b981' }} />} label="Phone"
          value={h.contactPhone || '—'} />
        <InfoCard icon={<Mail style={{ width: 16, height: 16, color: '#8b5cf6' }} />} label="Email"
          value={h.contactEmail || '—'} />
        <InfoCard icon={<Clock style={{ width: 16, height: 16, color: '#f59e0b' }} />} label="Added"
          value={new Date(h.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} />
      </div>

      {h.rating?.average > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
          <span style={{ fontSize: 24 }}>⭐</span>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#92400e', margin: 0 }}>{h.rating.average.toFixed(1)}</p>
            <p style={{ fontSize: 11, color: '#b45309', margin: 0 }}>{h.rating.count} reviews</p>
          </div>
        </div>
      )}

      {h.departments?.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Departments ({h.departments.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {h.departments.map((d) => (
              <span key={d} style={{
                fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(99,102,241,0.08)', color: '#6366f1',
              }}>{d}</span>
            ))}
          </div>
        </div>
      )}

      {h.services?.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Services ({h.services.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {h.services.map((s) => (
              <span key={s} style={{
                fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(16,185,129,0.08)', color: '#059669',
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {h.operatingHours && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Operating Hours
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {DAYS.map((day) => {
              const slot = h.operatingHours?.[day]
              return (
                <div key={day} style={{
                  padding: '8px 12px', borderRadius: 10,
                  background: slot?.isOpen ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${slot?.isOpen ? '#bbf7d0' : '#e2e8f0'}`,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 2px' }}>
                    {DAY_LABELS[day]}
                  </p>
                  <p style={{ fontSize: 11, margin: 0, color: slot?.isOpen ? '#16a34a' : '#94a3b8' }}>
                    {slot?.isOpen ? `${slot.open} – ${slot.close}` : 'Closed'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{
        padding: '10px 14px', background: '#f8fafc', borderRadius: 12,
        border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <IDRow label="Hospital ID" value={h.id} />
        {h.adminUserId   && <IDRow label="Admin User ID"   value={h.adminUserId} />}
        {h.regionId      && <IDRow label="Region ID"       value={h.regionId} />}
        {h.bankAccountId && <IDRow label="Bank Account ID" value={h.bankAccountId} />}
      </div>

      {!h.adminUserId ? (
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
            This hospital has no admin account. Without one, no one can manage doctors or bookings.
          </p>
          {!showAdminForm ? (
            <button onClick={() => setShowAdminForm(true)} style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>
              👤 Create Admin Account
            </button>
          ) : (
            <SetEntityAdminForm
              entityType="hospital"
              entityId={h.id}
              entityName={h.name}
              defaultEmail={h.contactEmail}
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
          ✅ Has admin user (ID: {h.adminUserId.slice(-6)})
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SET ADMIN FORM  (unchanged)
═══════════════════════════════════════════════════════════════════════════ */
function SetEntityAdminForm({ entityType, entityId, entityName, defaultEmail, onCancel, onSuccess }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState({
    name:     `${entityName} Admin`,
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
      const role = entityType === 'hospital' ? 'hospital_admin' : 'lab_admin'
      const payload = {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase() || undefined,
        phone:    form.phone.trim() || undefined,
        password: form.password,
        role,
      }
      if (entityType === 'hospital') payload.hospitalId = entityId
      if (entityType === 'lab')      payload.labId      = entityId

      const res  = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
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
        placeholder={`admin@${entityType}.com`} />
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
          background: saving ? '#cbd5e1' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}>{saving ? 'Creating...' : '✅ Create Admin'}</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED UI HELPERS  (unchanged)
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

function PillGrid({ items, selected, onToggle, color = 'indigo' }) {
  const activeGrad = color === 'green'
    ? 'linear-gradient(135deg,#059669,#10b981)'
    : 'linear-gradient(135deg,#6366f1,#8b5cf6)'
  const activeShadow = color === 'green'
    ? '0 2px 8px rgba(16,185,129,0.3)'
    : '0 2px 8px rgba(99,102,241,0.3)'

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item) => {
        const isSel = selected.includes(item)
        return (
          <button key={item} onClick={() => onToggle(item)} style={{
            padding: '6px 12px', borderRadius: 100, border: 'none',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            background: isSel ? activeGrad : '#f1f5f9',
            color: isSel ? '#fff' : '#64748b',
            transition: 'all .12s ease',
            boxShadow: isSel ? activeShadow : 'none',
          }}>{item}</button>
        )
      })}
    </div>
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
          animation: 'hosp-spin .7s linear infinite', display: 'inline-block',
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

function InfoCard({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '12px 14px',
      background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, wordBreak: 'break-word' }}>{value}</p>
      </div>
    </div>
  )
}

function IDRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{value}</span>
    </div>
  )
}