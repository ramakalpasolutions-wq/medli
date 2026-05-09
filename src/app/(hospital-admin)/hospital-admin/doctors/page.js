'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes dr-slide { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes dr-fade  { from{opacity:0} to{opacity:1} }
  @keyframes dr-spin  { to{transform:rotate(360deg)} }
`

const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics',
  'Gynecology', 'Neurology', 'Dermatology', 'ENT', 'Ophthalmology', 'Psychiatry',
]

const DAY_MAP = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }

/* ─── Add Button ─────────────────────────────────────────────────────── */
function AddBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 16px', borderRadius: 12, border: 'none',
        background: h
          ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        boxShadow: h ? '0 6px 20px rgba(99,102,241,0.45)' : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
      }}
    >
      + Add Doctor
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
        padding: '4px 9px', borderRadius: 7, border: 'none',
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'background .13s ease',
      }}
    >
      👁 View
    </button>
  )
}

/* ─── Spec Pill ──────────────────────────────────────────────────────── */
function SpecPill({ label, selected, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', borderRadius: 8, border: 'none',
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
        background: selected ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : h ? '#e2e8f0' : '#f1f5f9',
        color: selected ? '#fff' : '#64748b',
        transition: 'all .12s ease',
      }}
    >
      {label}
    </button>
  )
}

/* ─── Type Pill ──────────────────────────────────────────────────────── */
function TypePill({ label, selected, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1, padding: '10px', borderRadius: 12,
        border: `2px solid ${selected ? '#6366f1' : h ? '#c7d2fe' : '#e2e8f0'}`,
        background: selected ? 'rgba(99,102,241,0.08)' : h ? 'rgba(99,102,241,0.03)' : '#fff',
        color: selected ? '#6366f1' : '#64748b',
        fontSize: 13, fontWeight: selected ? 600 : 500, cursor: 'pointer',
        transition: 'all .15s ease',
      }}
    >
      {label}
    </button>
  )
}

/* ─── Form Input ─────────────────────────────────────────────────────── */
function FormInput({ label, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>}
      <input
        {...props}
        value={props.value ?? ''}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        style={{
          padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', width: '100%',
        }}
      />
    </div>
  )
}

/* ─── Save Button ────────────────────────────────────────────────────── */
function SaveBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !isLoading && setH(true)}
      onMouseLeave={() => setH(false)}
      disabled={isLoading}
      style={{
        width: '100%', padding: '13px', borderRadius: 12, border: 'none',
        background: isLoading
          ? '#e2e8f0'
          : h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: isLoading ? '#94a3b8' : '#fff',
        fontSize: 14, fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        boxShadow: isLoading ? 'none' : h ? '0 8px 24px rgba(99,102,241,0.5)' : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      {isLoading && (
        <span style={{
          width: 14, height: 14, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
          animation: 'dr-spin .7s linear infinite', display: 'inline-block',
        }} />
      )}
      💾 Save Doctor
    </button>
  )
}

/* ─── Panel Close Button ─────────────────────────────────────────────── */
function PanelCloseBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: 'none',
        background: h ? '#f1f5f9' : 'transparent', cursor: 'pointer',
        fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center',
        justifyContent: 'center', transition: 'background .12s ease',
      }}
    >
      ✕
    </button>
  )
}

/* ─── Doctor Detail ──────────────────────────────────────────────────── */
function DoctorDetail({ d }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Avatar + Name */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
        padding: 16, background: '#f8fafc', borderRadius: 16,
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 24, fontWeight: 700,
        }}>
          {d.avatar
            ? <img src={d.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : d.name?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
            Dr. {d.name}
          </h3>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>
            {d.experience ? `${d.experience} years experience` : ''}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant={d.isVerified ? 'success' : 'warning'} size="sm" dot>
              {d.isVerified ? 'Verified' : 'Pending'}
            </Badge>
            <Badge variant={d.isActive ? 'success' : 'neutral'} size="sm">
              {d.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Specializations */}
      {d.specialization?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Specializations
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {d.specialization.map((s) => (
              <span key={s} style={{
                fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(99,102,241,0.08)', color: '#6366f1',
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Qualifications */}
      {d.qualifications?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Qualifications
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {d.qualifications.map((q) => (
              <span key={q} style={{
                fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 100,
                background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
              }}>{q}</span>
            ))}
          </div>
        </div>
      )}

      {/* Consultation types */}
      {d.consultationTypes?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Consultation Types
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {d.consultationTypes.map((t) => (
              <Badge key={t} variant="info" size="sm">{t}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Fees */}
      {d.consultationFee && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12,
        }}>
          <div style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#16a34a', margin: '0 0 4px', fontWeight: 600 }}>Offline Fee</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#15803d', margin: 0 }}>
              ₹{d.consultationFee.offline || 0}
            </p>
          </div>
          <div style={{ padding: '12px 14px', background: '#f5f3ff', borderRadius: 12, border: '1px solid #ddd6fe', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#7c3aed', margin: '0 0 4px', fontWeight: 600 }}>Online Fee</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#6d28d9', margin: 0 }}>
              ₹{d.consultationFee.online || 0}
            </p>
          </div>
        </div>
      )}

      {/* Rating */}
      {d.rating?.average > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a',
        }}>
          <span style={{ fontSize: 22 }}>⭐</span>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#92400e', margin: 0 }}>
              {d.rating.average.toFixed(1)}
              <span style={{ fontSize: 13, fontWeight: 400, color: '#b45309' }}>
                {' '}({d.rating.count} reviews)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Availability */}
      {d.availability?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Availability Slots
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8,
          }}>
            {d.availability.map((slot, i) => (
              <div key={i} style={{
                padding: '10px 14px', background: '#f0fdf4', borderRadius: 10,
                border: '1px solid #bbf7d0',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', margin: '0 0 3px' }}>
                  {DAY_MAP[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`}
                </p>
                <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>
                  {slot.startTime} – {slot.endTime}
                </p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>
                  {slot.slotDuration} min slots
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IDs */}
      <div style={{
        padding: '10px 14px', background: '#f8fafc',
        borderRadius: 12, border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        {[
          { l: 'Doctor ID',   v: d.id          },
          { l: 'User ID',     v: d.userId       || '—' },
          { l: 'Hospital ID', v: d.hospitalId   },
        ].map((r) => (
          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.l}</span>
            <span style={{
              fontSize: 11, fontFamily: 'monospace', color: '#64748b',
              wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%',
            }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HospitalDoctors() {
  const toast = useToast()
  const [panelOpen, setPanelOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [viewItem,  setViewItem]  = useState(null)
  const [form,      setForm]      = useState({
    name: '', specialization: [], experience: '',
    consultationFee: { online: '', offline: '' },
    consultationTypes: ['offline'],
  })

  const { data: hospitalData } = useSWR('/api/hospitals?adminOnly=true', fetcher)
  const hospitalId = hospitalData?.hospitals?.[0]?.id

  const { data, isLoading, mutate } = useSWR(
    hospitalId ? `/api/hospitals/${hospitalId}/doctors` : null,
    fetcher
  )
  const doctors = Array.isArray(data) ? data : (data?.doctors || [])

  useEffect(() => {
    document.body.style.overflow = panelOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [panelOpen])

  const toggleSpec = (spec) => {
    setForm((f) => ({
      ...f,
      specialization: f.specialization.includes(spec)
        ? f.specialization.filter((s) => s !== spec)
        : [...f.specialization, spec],
    }))
  }

  const toggleConsult = (t) => {
    setForm((f) => ({
      ...f,
      consultationTypes: f.consultationTypes.includes(t)
        ? f.consultationTypes.filter((x) => x !== t)
        : [...f.consultationTypes, t],
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Doctor name is required'); return }
    if (!hospitalId) { toast.error('Hospital not found'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/doctors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          hospitalId,
          name:              form.name,
          specialization:    form.specialization,
          experience:        Number(form.experience) || 0,
          consultationTypes: form.consultationTypes,
          consultationFee: {
            online:  Number(form.consultationFee.online)  || 0,
            offline: Number(form.consultationFee.offline) || 0,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Doctor added')
        mutate()
        setPanelOpen(false)
        setForm({
          name: '', specialization: [], experience: '',
          consultationFee: { online: '', offline: '' },
          consultationTypes: ['offline'],
        })
      } else {
        toast.error(json.error || 'Failed to add doctor')
      }
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  const columns = [
    {
      key: 'name', header: 'Doctor',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#6366f1', overflow: 'hidden',
          }}>
            {row.avatar
              ? <img src={row.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : v?.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>Dr. {v}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(row.specialization || []).join(', ') || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'experience', header: 'Exp',
      render: (v) => v ? `${v} yrs` : '—',
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
      key: 'isActive', header: 'Status',
      render: (v) => (
        <Badge variant={v ? 'success' : 'danger'} size="sm">{v ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'consultationFee', header: 'Fee',
      render: (v) => v?.offline ? `₹${v.offline}` : '—',
    },
    {
      key: 'actions', header: '',
      render: (_, row) => <ViewBtn onClick={() => setViewItem(row)} />,
    },
  ]

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Doctors"
        subtitle={`${doctors.length} doctor${doctors.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Doctors' }]}
        actions={<AddBtn onClick={() => setPanelOpen(true)} />}
      />

      <DataTable
        columns={columns}
        data={doctors}
        loading={isLoading}
        emptyTitle="No doctors yet"
        emptyMessage="Add your first doctor using the button above"
      />

      {/* View Detail Modal */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Doctor Details"
        size="md"
      >
        {viewItem && <DoctorDetail d={viewItem} />}
      </Modal>

      {/* Add Doctor Slide Panel */}
      {panelOpen && (
        <>
          <div
            onClick={() => setPanelOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 900,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              animation: 'dr-fade .2s ease',
            }}
          />
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0,
            width: 'min(440px, 92vw)',
            background: '#fff', zIndex: 910,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
            animation: 'dr-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {/* Panel header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Add New Doctor
              </h3>
              <PanelCloseBtn onClick={() => setPanelOpen(false)} />
            </div>

            {/* Body */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: 20,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <FormInput
                label="Doctor Name *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name without Dr."
              />
              <FormInput
                label="Experience (years)"
                type="number"
                value={form.experience}
                onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                placeholder="0"
              />

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                  Specializations
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SPECIALIZATIONS.map((spec) => (
                    <SpecPill
                      key={spec} label={spec}
                      selected={form.specialization.includes(spec)}
                      onClick={() => toggleSpec(spec)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                  Consultation Types
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <TypePill
                    label="In-Person"
                    selected={form.consultationTypes.includes('offline')}
                    onClick={() => toggleConsult('offline')}
                  />
                  <TypePill
                    label="Online"
                    selected={form.consultationTypes.includes('online')}
                    onClick={() => toggleConsult('online')}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormInput
                  label="Offline Fee (₹)"
                  type="number"
                  value={form.consultationFee.offline}
                  onChange={(e) => setForm((f) => ({
                    ...f, consultationFee: { ...f.consultationFee, offline: e.target.value },
                  }))}
                />
                <FormInput
                  label="Online Fee (₹)"
                  type="number"
                  value={form.consultationFee.online}
                  onChange={(e) => setForm((f) => ({
                    ...f, consultationFee: { ...f.consultationFee, online: e.target.value },
                  }))}
                />
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
              <SaveBtn onClick={handleSave} loading={saving} />
            </div>
          </div>
        </>
      )}
    </>
  )
}