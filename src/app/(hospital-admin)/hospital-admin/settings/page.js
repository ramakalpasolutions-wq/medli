// C:\Users\ASUS\medli2\src\app\(hospital-admin)\hospital-admin\settings\page.js
'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `@keyframes st-spin{to{transform:rotate(360deg)}}`

/* ─── Input ──────────────────────────────────────────────────────────── */
function SInput({ label, hint, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        value={props.value ?? ''}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e)  => { setFocused(false); props.onBlur?.(e) }}
        style={{
          padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: focused
            ? '0 0 0 3px rgba(99,102,241,0.12)'
            : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', width: '100%',
        }}
      />
      {hint && (
        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{hint}</p>
      )}
    </div>
  )
}

/* ─── Save button ────────────────────────────────────────────────────── */
function SaveBtn({ onClick, loading: isLoading, disabled }) {
  const [h, setH] = useState(false)
  const isDisabled = isLoading || disabled
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 18px', borderRadius: 12, border: 'none',
        background: isDisabled
          ? '#e2e8f0'
          : h
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: isDisabled ? '#94a3b8' : '#fff',
        fontSize: 13, fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isDisabled
          ? 'none'
          : h
            ? '0 6px 20px rgba(99,102,241,0.45)'
            : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
      }}
    >
      {isLoading && (
        <span style={{
          width: 14, height: 14, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: '#fff',
          animation: 'st-spin .7s linear infinite',
          display: 'inline-block',
        }} />
      )}
      💾 Save Changes
    </button>
  )
}

/* ─── Section Card ───────────────────────────────────────────────────── */
function SCard({ title, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid #f1f5f9',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #f8fafc',
      }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0,
        }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

/* ─── Loading Skeleton ───────────────────────────────────────────────── */
function LoadingState() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
      gap: 20,
    }}>
      {[1, 2].map((i) => (
        <div key={i} style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #f1f5f9', padding: 20,
          minHeight: 280,
        }}>
          <div style={{
            height: 16, width: '40%', borderRadius: 6,
            background: '#f1f5f9', marginBottom: 20,
          }} />
          {[1, 2, 3, 4].map((j) => (
            <div key={j} style={{ marginBottom: 14 }}>
              <div style={{
                height: 10, width: '30%', borderRadius: 4,
                background: '#f8fafc', marginBottom: 6,
              }} />
              <div style={{
                height: 38, borderRadius: 12, background: '#f1f5f9',
              }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─── No Hospital State ──────────────────────────────────────────────── */
function NoHospitalState() {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, border: '1px solid #fde68a',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#92400e', margin: '0 0 6px' }}>
        No Hospital Linked
      </h3>
      <p style={{ fontSize: 13, color: '#78350f', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
        Your account is not yet linked to a hospital. Please contact MEDLI super admin to assign you as the admin of a hospital.
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export default function HospitalSettings() {
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const {
    data: hospitalData,
    isLoading,
    mutate,
  } = useSWR('/api/hospitals?adminOnly=true', fetcher)

  const hospital   = hospitalData?.hospitals?.[0]
  const hospitalId = hospital?.id

  /* ─────────────────────────────────────────────────────────────
     ✅ Initialize form with empty values
  ───────────────────────────────────────────────────────────── */
  const [form, setForm] = useState({
    name:         '',
    contactPhone: '',
    contactEmail: '',
    departments:  '',
    services:     '',
    address: {
      line1:   '',
      city:    '',
      state:   '',
      pinCode: '',
    },
  })

  /* ─────────────────────────────────────────────────────────────
     ✅ Populate form ONCE hospital data arrives
  ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!hospital) return

    setForm({
      name:         hospital.name         || '',
      contactPhone: hospital.contactPhone || '',
      contactEmail: hospital.contactEmail || '',
      departments:  Array.isArray(hospital.departments)
                      ? hospital.departments.join(', ')
                      : '',
      services:     Array.isArray(hospital.services)
                      ? hospital.services.join(', ')
                      : '',
      address: {
        line1:   hospital.address?.line1   || '',
        city:    hospital.address?.city    || '',
        state:   hospital.address?.state   || '',
        pinCode: hospital.address?.pinCode || '',
      },
    })
  }, [hospital])

  /* ─── Save handler ─── */
  const save = async () => {
    if (!hospitalId) {
      toast.error('Hospital not found')
      return
    }

    /* ── Validate ── */
    if (!form.name.trim()) {
      toast.error('Hospital name is required')
      return
    }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      toast.error('Invalid email address')
      return
    }
    if (form.address.pinCode && !/^\d{6}$/.test(form.address.pinCode)) {
      toast.error('PIN code must be 6 digits')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name:         form.name.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        departments:  form.departments
                        .split(',')
                        .map((d) => d.trim())
                        .filter(Boolean),
        services:     form.services
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
        address: {
          line1:   form.address.line1.trim()   || undefined,
          city:    form.address.city.trim()    || undefined,
          state:   form.address.state.trim()   || undefined,
          pinCode: form.address.pinCode.trim() || undefined,
        },
      }

      const res  = await fetch(`/api/hospitals/${hospitalId}`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(payload),
      })
      const json = await res.json()

      if (json.success) {
        toast.success('✅ Settings saved successfully')
        mutate()
      } else {
        toast.error(json.error || 'Failed to save')
      }
    } catch (err) {
      console.error('[Hospital Settings] Save error:', err)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Render ─── */
  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Settings"
        subtitle={
          hospital
            ? `Manage ${hospital.name}`
            : 'Hospital configuration'
        }
        breadcrumbs={[
          { label: 'Hospital Admin' },
          { label: 'Settings' },
        ]}
        actions={
          hospital && (
            <SaveBtn
              onClick={save}
              loading={saving}
              disabled={!hospitalId}
            />
          )
        }
      />

      {/* Loading state */}
      {isLoading && <LoadingState />}

      {/* No hospital linked */}
      {!isLoading && !hospital && <NoHospitalState />}

      {/* Settings forms */}
      {!isLoading && hospital && (
        <>
          {/* Status banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: hospital.isApproved
              ? 'rgba(16,185,129,0.06)'
              : 'rgba(245,158,11,0.06)',
            border: `1px solid ${hospital.isApproved
              ? 'rgba(16,185,129,0.2)'
              : 'rgba(245,158,11,0.2)'}`,
            borderRadius: 14, padding: '10px 16px',
            marginBottom: 20, fontSize: 13,
          }}>
            <span style={{ fontSize: 16 }}>
              {hospital.isApproved ? '✅' : '⏳'}
            </span>
            <span style={{
              color: hospital.isApproved ? '#059669' : '#92400e',
              fontWeight: 600,
            }}>
              {hospital.isApproved ? 'Approved & Live' : 'Pending Approval'}
            </span>
            <span style={{ color: '#94a3b8', marginLeft: 'auto' }}>
              ID: {hospitalId?.slice(-8)}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
            gap: 20,
          }}>

            {/* Basic Info Card */}
            <SCard title="🏥 Basic Information">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SInput
                  label="Hospital Name *"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g., Apollo Hospitals"
                />
                <SInput
                  label="Contact Phone"
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactPhone: e.target.value }))
                  }
                  placeholder="+91 9876543210"
                />
                <SInput
                  label="Contact Email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactEmail: e.target.value }))
                  }
                  placeholder="info@hospital.com"
                />
                <SInput
                  label="Departments"
                  value={form.departments}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, departments: e.target.value }))
                  }
                  placeholder="Cardiology, Orthopedics, Pediatrics"
                  hint="Comma-separated list of departments"
                />
                <SInput
                  label="Services"
                  value={form.services}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, services: e.target.value }))
                  }
                  placeholder="24/7 Emergency, ICU, Pharmacy"
                  hint="Comma-separated list of services offered"
                />
              </div>
            </SCard>

            {/* Address Card */}
            <SCard title="📍 Address">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SInput
                  label="Street Address"
                  value={form.address.line1}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: { ...f.address, line1: e.target.value },
                    }))
                  }
                  placeholder="123, Main Road"
                />
                <SInput
                  label="City"
                  value={form.address.city}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: { ...f.address, city: e.target.value },
                    }))
                  }
                  placeholder="Guntur"
                />
                <SInput
                  label="State"
                  value={form.address.state}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: { ...f.address, state: e.target.value },
                    }))
                  }
                  placeholder="Andhra Pradesh"
                />
                <SInput
                  label="PIN Code"
                  value={form.address.pinCode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: {
                        ...f.address,
                        pinCode: e.target.value.replace(/\D/g, '').slice(0, 6),
                      },
                    }))
                  }
                  placeholder="522001"
                  maxLength={6}
                />
              </div>
            </SCard>
          </div>

          {/* Read-only info */}
          <div style={{ marginTop: 20 }}>
            <SCard title="ℹ️ Read-only Information">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
                gap: 12,
              }}>
                {[
                  { l: 'Slug',         v: hospital.slug || '—' },
                  { l: 'Platform Fee', v: `${hospital.platformFeePercent || 0}%` },
                  { l: 'Region ID',    v: hospital.regionId?.slice(-8) || 'Not set' },
                  { l: 'Bank Account', v: hospital.bankAccountId ? '✓ Linked' : 'Not set' },
                  { l: 'Status',       v: hospital.isActive ? 'Active' : 'Inactive' },
                  { l: 'Created',      v: new Date(hospital.createdAt).toLocaleDateString('en-IN') },
                ].map((item) => (
                  <div key={item.l} style={{
                    padding: '10px 14px',
                    background: '#f8fafc', borderRadius: 10,
                    border: '1px solid #f1f5f9',
                  }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>
                      {item.l}
                    </p>
                    <p style={{
                      fontSize: 12, fontWeight: 600, color: '#1e293b', margin: 0,
                    }}>
                      {item.v}
                    </p>
                  </div>
                ))}
              </div>
              <p style={{
                fontSize: 11, color: '#94a3b8', margin: '12px 0 0',
                textAlign: 'center',
              }}>
                These fields can only be modified by MEDLI super admin
              </p>
            </SCard>
          </div>
        </>
      )}
    </>
  )
}