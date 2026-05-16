// C:\Users\ASUS\medli2\src\app\(hospital-admin)\hospital-admin\doctors\page.js
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
  'Surgery', 'Oncology', 'Radiology', 'Anesthesia', 'Emergency Medicine',
]

const QUALIFICATIONS = [
  'MBBS', 'MD', 'MS', 'DM', 'MCh', 'DNB', 'PhD', 'BAMS', 'BHMS', 'BDS', 'MDS',
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

/* ─── Spec/Qualification Pill ────────────────────────────────────────── */
function Pill({ label, selected, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', borderRadius: 8, border: 'none',
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
        background: selected
          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
          : h ? '#e2e8f0' : '#f1f5f9',
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
function FormInput({ label, hint, ...props }) {
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
      {hint && <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{hint}</p>}
    </div>
  )
}

/* ─── Section Title ──────────────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: '1px',
      margin: '4px 0 -4px',
    }}>
      {children}
    </p>
  )
}

/* ─── Save Button ────────────────────────────────────────────────────── */
function SaveBtn({ onClick, loading: isLoading, label = '💾 Save' }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !isLoading && setH(true)}
      onMouseLeave={() => setH(false)}
      disabled={isLoading}
      style={{
        flex: 1, padding: '13px', borderRadius: 12, border: 'none',
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
      {label}
    </button>
  )
}

function SecondaryBtn({ onClick, children }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '13px 20px', borderRadius: 12,
        border: '1.5px solid #e2e8f0',
        background: h ? '#f8fafc' : '#fff',
        color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'all .13s ease',
      }}
    >
      {children}
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

/* ─── Copy-to-clipboard helper ───────────────────────────────────────── */
function CopyableField({ icon, label, value, accentColor = '#6366f1' }) {
  const toast = useToast()
  const [hov, setHov] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copied!`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div
      onClick={handleCopy}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 12,
        background: hov ? `${accentColor}10` : '#fff',
        border: `1.5px solid ${hov ? accentColor : '#e2e8f0'}`,
        cursor: 'pointer',
        transition: 'all .15s ease',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${accentColor}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 11, color: '#94a3b8', margin: '0 0 2px',
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {label}
        </p>
        <p style={{
          fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value}
        </p>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: copied ? '#10b981' : accentColor,
        opacity: hov || copied ? 1 : 0,
        transition: 'opacity .15s ease',
        flexShrink: 0,
      }}>
        {copied ? '✓ Copied' : '📋 Copy'}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCTOR DETAIL VIEW — ✅ Now fetches & shows login credentials
═══════════════════════════════════════════════════════════════════════════ */
function DoctorDetail({ d }) {
  /* ✅ Fetch user data ONLY if doctor has a linked user account */
  const { data: userData, isLoading: userLoading } = useSWR(
    d.userId ? `/api/users/${d.userId}` : null,
    fetcher
  )

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
            {d.experience ? `${d.experience} years experience` : 'Experience not set'}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant={d.isVerified ? 'success' : 'warning'} size="sm" dot>
              {d.isVerified ? 'Verified' : 'Pending'}
            </Badge>
            <Badge variant={d.isActive ? 'success' : 'neutral'} size="sm">
              {d.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {d.userId && (
              <Badge variant="info" size="sm">🔑 Has Login</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ✅ LOGIN CREDENTIALS (only if doctor has a user account)
      ═══════════════════════════════════════════════════════════════ */}
      {d.userId && (
        <div style={{
          padding: 16,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
          border: '1.5px solid rgba(99,102,241,0.2)',
          borderRadius: 16,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔑</span>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5', margin: 0 }}>
                Login Credentials
              </h4>
            </div>
            <Badge variant="info" size="sm">Click to copy</Badge>
          </div>

          {userLoading ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: 12, color: '#94a3b8', fontSize: 12,
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                border: '2px solid #94a3b8', borderTopColor: 'transparent',
                animation: 'dr-spin .8s linear infinite', display: 'inline-block',
              }} />
              Loading credentials...
            </div>
          ) : userData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {userData.email && (
                <CopyableField
                  icon="✉️"
                  label="Email (login)"
                  value={userData.email}
                  accentColor="#6366f1"
                />
              )}
              {userData.phone && (
                <CopyableField
                  icon="📱"
                  label="Phone (login)"
                  value={`+91 ${userData.phone}`}
                  accentColor="#8b5cf6"
                />
              )}
              {!userData.email && !userData.phone && (
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, padding: 8 }}>
                  No contact info on file
                </p>
              )}

             
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>
              ⚠️ Could not load user info
            </p>
          )}
        </div>
      )}

      {/* No login warning */}
      {!d.userId && (
        <div style={{
          padding: 14,
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', margin: 0 }}>
              No Login Account
            </p>
            <p style={{ fontSize: 11, color: '#78350f', margin: '2px 0 0' }}>
              This doctor cannot sign in to manage their appointments
            </p>
          </div>
        </div>
      )}

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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function HospitalDoctors() {
  const toast = useToast()
  const [panelOpen, setPanelOpen] = useState(false)
  const [viewItem,  setViewItem]  = useState(null)

  const { data: hospitalData } = useSWR('/api/hospitals?adminOnly=true', fetcher)
  const hospitalId = hospitalData?.hospitals?.[0]?.id

  const { data, isLoading, mutate } = useSWR(
    hospitalId ? `/api/hospitals/${hospitalId}/doctors` : null,
    fetcher
  )
  const doctors = Array.isArray(data) ? data : (data?.doctors || [])

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
      key: 'userId', header: 'Login',
      render: (v) => v
        ? <Badge variant="success" size="sm" dot>🔑 Yes</Badge>
        : <Badge variant="neutral" size="sm">No</Badge>,
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
        <AddDoctorPanel
          hospitalId={hospitalId}
          onClose={() => setPanelOpen(false)}
          onSaved={() => { mutate(); setPanelOpen(false) }}
        />
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADD DOCTOR PANEL — unchanged
═══════════════════════════════════════════════════════════════════════════ */
function AddDoctorPanel({ hospitalId, onClose, onSaved }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState({
    name: '',
    specialization: [],
    qualifications: [],
    experience: '',
    consultationFee: { online: '', offline: '' },
    consultationTypes: ['offline'],

    createLogin: true,
    loginEmail: '',
    loginPhone: '',
    loginPassword: '',
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const toggleSpec = (spec) => {
    setForm((f) => ({
      ...f,
      specialization: f.specialization.includes(spec)
        ? f.specialization.filter((s) => s !== spec)
        : [...f.specialization, spec],
    }))
  }

  const toggleQualification = (q) => {
    setForm((f) => ({
      ...f,
      qualifications: f.qualifications.includes(q)
        ? f.qualifications.filter((x) => x !== q)
        : [...f.qualifications, q],
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
    if (!form.name.trim())  { toast.error('Doctor name is required'); return }
    if (!hospitalId)        { toast.error('Hospital not found'); return }

    if (form.createLogin) {
      if (!form.loginEmail.trim() && !form.loginPhone.trim()) {
        toast.error('Doctor login requires email or phone')
        return
      }
      if (!form.loginPassword || form.loginPassword.length < 6) {
        toast.error('Login password must be at least 6 characters')
        return
      }
      if (form.loginPhone && !/^[6-9]\d{9}$/.test(form.loginPhone)) {
        toast.error('Phone must be 10 digits starting with 6-9')
        return
      }
      if (form.loginEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.loginEmail)) {
        toast.error('Invalid email format')
        return
      }
    }

    setSaving(true)
    try {
      let userId = undefined

      if (form.createLogin) {
        const userPayload = {
          name:     `Dr. ${form.name.trim()}`,
          email:    form.loginEmail.trim().toLowerCase() || undefined,
          phone:    form.loginPhone.trim() || undefined,
          password: form.loginPassword,
          role:     'doctor',
        }

        const userRes  = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(userPayload),
        })
        const userJson = await userRes.json()

        if (!userJson.success) {
          toast.error(`Login creation failed: ${userJson.error}`)
          setSaving(false)
          return
        }

        userId = userJson.data.id
        toast.success(`✅ Login created`)
      }

      const doctorPayload = {
        hospitalId,
        userId,
        name:              form.name.trim(),
        specialization:    form.specialization,
        qualifications:    form.qualifications,
        experience:        Number(form.experience) || 0,
        consultationTypes: form.consultationTypes,
        consultationFee: {
          online:  Number(form.consultationFee.online)  || 0,
          offline: Number(form.consultationFee.offline) || 0,
        },
      }

      const docRes  = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(doctorPayload),
      })
      const docJson = await docRes.json()

      if (docJson.success) {
        const loginInfo = form.createLogin
          ? ` — Login: ${form.loginEmail || form.loginPhone}`
          : ''
        toast.success(`✅ Doctor added${loginInfo}`)
        onSaved()
      } else {
        toast.error(docJson.error || 'Failed to add doctor')
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        animation: 'dr-fade .2s ease',
      }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 'min(520px, 95vw)',
        background: '#fff', zIndex: 910,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        animation: 'dr-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              👨‍⚕️ Add New Doctor
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Create profile + optional login account
            </p>
          </div>
          <PanelCloseBtn onClick={onClose} />
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: 20,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <SectionTitle>👨‍⚕️ Doctor Profile</SectionTitle>

          <FormInput
            label="Doctor Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Full name without 'Dr.' prefix"
            hint="e.g., Rajesh Kumar (will display as Dr. Rajesh Kumar)"
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
                <Pill
                  key={spec} label={spec}
                  selected={form.specialization.includes(spec)}
                  onClick={() => toggleSpec(spec)}
                />
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
              Qualifications
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUALIFICATIONS.map((q) => (
                <Pill
                  key={q} label={q}
                  selected={form.qualifications.includes(q)}
                  onClick={() => toggleQualification(q)}
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

          <div style={{
            padding: 16,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.03))',
            borderRadius: 12,
            border: '1px solid rgba(99,102,241,0.15)',
          }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={form.createLogin}
                onChange={(e) => setForm((f) => ({ ...f, createLogin: e.target.checked }))}
                style={{
                  width: 16, height: 16, accentColor: '#6366f1', cursor: 'pointer',
                }}
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', margin: 0 }}>
                  🔑 Create Doctor Login Account
                </p>
                <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                  Lets the doctor login at /auth/login to manage appointments
                </p>
              </div>
            </label>

            {form.createLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FormInput
                  label="Login Email"
                  type="email"
                  value={form.loginEmail}
                  onChange={(e) => setForm((f) => ({ ...f, loginEmail: e.target.value }))}
                  placeholder="doctor@hospital.com"
                  hint="Doctor will use this to login"
                />
                <FormInput
                  label="Login Phone (optional)"
                  type="tel"
                  value={form.loginPhone}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    loginPhone: e.target.value.replace(/\D/g, '').slice(0, 10),
                  }))}
                  placeholder="9876543210"
                  hint="10-digit phone (alternative login)"
                />
                <FormInput
                  label="Login Password *"
                  type="text"
                  value={form.loginPassword}
                  onChange={(e) => setForm((f) => ({ ...f, loginPassword: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  hint="⚠️ Share this with the doctor securely"
                />
              </div>
            )}
          </div>
        </div>

        <div style={{
          padding: '14px 20px', borderTop: '1px solid #f1f5f9',
          flexShrink: 0, display: 'flex', gap: 10,
        }}>
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <SaveBtn
            onClick={handleSave}
            loading={saving}
            label={form.createLogin ? '💾 Add Doctor + Login' : '💾 Add Doctor'}
          />
        </div>
      </div>
    </>
  )
}