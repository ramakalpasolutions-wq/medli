'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import FileUpload from '@/components/ui/FileUpload'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import {
  Save,
  Award,
  Star,
  FileText,
  BadgeCheck,
  Clock3,
  UserRound,
  BriefcaseMedical,
  IndianRupee,
  Building2,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Video,
  X,
} from 'lucide-react'

const KF = `
  @keyframes dp-spin { to { transform: rotate(360deg) } }
  @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
`

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const SPECIALIZATIONS = [
  'Cardiologist',
  'Neurologist',
  'Gynecologist',
  'Dermatologist',
  'Orthopedic Surgeon',
  'General Physician',
  'Pediatrician',
  'Diabetologist',
  'Interventional Cardiology',
  'ENT Specialist',
  'Psychiatrist',
  'Oncologist',
  'Urologist',
  'Nephrologist',
  'Gastroenterologist',
  'Endocrinologist',
]

function ProfileInput({ label, disabled, value, type = 'text', ...props }) {
  const [focused, setFocused] = useState(false)
  const safeValue = value ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        type={type}
        value={safeValue}
        disabled={disabled}
        onFocus={(e) => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          props.onBlur?.(e)
        }}
        style={{
          padding: '10px 13px',
          fontSize: 13,
          fontFamily: 'inherit',
          borderRadius: 12,
          boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: disabled ? '#f8fafc' : '#fff',
          color: disabled ? '#94a3b8' : '#0f172a',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
          cursor: disabled ? 'not-allowed' : 'text',
          width: '100%',
        }}
      />
    </div>
  )
}

function TagInput({ label, tags, onChange, placeholder, suggestions = [] }) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)

  const addTag = (val) => {
    const trimmed = val.trim()
    if (!trimmed) return
    if (tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setInput('')
  }

  const removeTag = (i) => onChange(tags.filter((_, idx) => idx !== i))

  const filteredSuggestions = suggestions
    .filter((s) => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>
      )}

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
          {tags.map((t, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 100,
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#6366f1',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {t}
              <button
                onClick={() => removeTag(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6366f1',
                  padding: 0,
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={`Remove ${t}`}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(input)
          }
        }}
        placeholder={placeholder}
        style={{
          padding: '10px 13px',
          fontSize: 13,
          fontFamily: 'inherit',
          borderRadius: 12,
          boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff',
          color: '#0f172a',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
          width: '100%',
        }}
      />

      {focused && input && filteredSuggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            marginTop: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {filteredSuggestions.map((s) => (
            <div
              key={s}
              onMouseDown={() => addTag(s)}
              style={{
                padding: '10px 13px',
                fontSize: 13,
                cursor: 'pointer',
                color: '#334155',
                borderBottom: '1px solid #f8fafc',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
            >
              + {s}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>Press Enter or comma to add</p>
    </div>
  )
}

function SaveBtn({ onClick, loading: isLoading, label = 'Save' }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 18px',
        borderRadius: 12,
        border: 'none',
        background: isLoading
          ? '#cbd5e1'
          : h
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        boxShadow: isLoading
          ? 'none'
          : h
            ? '0 6px 20px rgba(99,102,241,0.45)'
            : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
      }}
    >
      {isLoading ? (
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: '#fff',
            animation: 'dp-spin .7s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : (
        <Save size={14} strokeWidth={2.4} />
      )}
      {isLoading ? 'Saving…' : label}
    </button>
  )
}

function PCard({ title, subtitle, action, children, icon }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #f8fafc',
            gap: 12,
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#1e293b',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {icon}
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

function SkeletonField() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div
        style={{
          width: 80,
          height: 12,
          borderRadius: 6,
          background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }}
      />
      <div
        style={{
          height: 42,
          borderRadius: 12,
          background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }}
      />
    </div>
  )
}

function StatTile({ icon, label, value, color = '#6366f1' }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 14,
        background: `${color}08`,
        border: `1px solid ${color}20`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontSize: 11,
            color: '#94a3b8',
            margin: 0,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </p>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '2px 0 0' }}>{value}</p>
      </div>
    </div>
  )
}

export default function DoctorProfilePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()

  const { data: doctor, isLoading: doctorLoading, mutate: mutateDoctor } = useSWR(
    () => (user?.id ? `/api/doctors/by-user/${user.id}` : null),
    fetcher
  )

  const doctorId = doctor?.id

  const { data: fullDoctor, mutate: mutateFull } = useSWR(
    () => (doctorId ? `/api/doctors/${doctorId}` : null),
    fetcher
  )

  const { data: hospital } = useSWR(
    () => (fullDoctor?.hospitalId ? `/api/hospitals/${fullDoctor.hospitalId}` : null),
    fetcher
  )

  const [userForm, setUserForm] = useState({ name: '', email: '' })

  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialization: [],
    qualifications: [],
    experience: '',
    consultationFee: { online: 0, offline: 0 },
  })

  const [savingUser, setSavingUser] = useState(false)
  const [savingDoctor, setSavingDoctor] = useState(false)

  useEffect(() => {
    if (user) {
      setUserForm({
        name: user.name || '',
        email: user.email || '',
      })
    }
  }, [user])

  useEffect(() => {
    if (fullDoctor) {
      setDoctorForm({
        name: fullDoctor.name || '',
        specialization: fullDoctor.specialization || [],
        qualifications: fullDoctor.qualifications || [],
        experience: fullDoctor.experience ?? '',
        consultationFee: {
          online: fullDoctor.consultationFee?.online ?? 0,
          offline: fullDoctor.consultationFee?.offline ?? 0,
        },
      })
    }
  }, [fullDoctor])

  const handleSaveUser = async () => {
    if (!user?.id) return
    setSavingUser(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userForm.name.trim(),
          email: userForm.email.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('User info updated')
        refreshUser?.()
      } else {
        toast.error(json.error || 'Failed to update user')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSavingUser(false)
    }
  }

  const handleSaveDoctor = async () => {
    if (!doctorId) return

    if (!doctorForm.name.trim()) {
      toast.error('Doctor name is required')
      return
    }
    if (doctorForm.specialization.length === 0) {
      toast.error('At least one specialization is required')
      return
    }

    setSavingDoctor(true)
    try {
      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: doctorForm.name.trim(),
          specialization: doctorForm.specialization,
          qualifications: doctorForm.qualifications,
          experience: doctorForm.experience ? Number(doctorForm.experience) : 0,
          consultationFee: {
            online: Number(doctorForm.consultationFee.online) || 0,
            offline: Number(doctorForm.consultationFee.offline) || 0,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Doctor profile updated')
        mutateFull()
        mutateDoctor()
      } else {
        toast.error(json.error || 'Failed to update doctor')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSavingDoctor(false)
    }
  }

  const loading = !user || doctorLoading || !fullDoctor

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Profile"
        subtitle="Manage your personal and professional information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/doctor/dashboard' },
          { label: 'Profile' },
        ]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {!loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <StatTile
              icon={<Award size={18} strokeWidth={2.3} />}
              label="Experience"
              value={`${fullDoctor.experience || 0} yrs`}
              color="#6366f1"
            />
            <StatTile
              icon={<Star size={18} strokeWidth={2.3} />}
              label="Rating"
              value={fullDoctor.rating?.average?.toFixed(1) || 'N/A'}
              color="#f59e0b"
            />
            <StatTile
              icon={<FileText size={18} strokeWidth={2.3} />}
              label="Reviews"
              value={fullDoctor.rating?.count || 0}
              color="#10b981"
            />
            <StatTile
              icon={
                fullDoctor.isVerified ? (
                  <BadgeCheck size={18} strokeWidth={2.3} />
                ) : (
                  <Clock3 size={18} strokeWidth={2.3} />
                )
              }
              label="Status"
              value={fullDoctor.isVerified ? 'Verified' : 'Pending'}
              color={fullDoctor.isVerified ? '#10b981' : '#f59e0b'}
            />
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          <PCard title="Profile Photo" icon={<UserRound size={16} strokeWidth={2.3} />}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 32,
                margin: '0 auto 16px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
              }}
            >
              {fullDoctor?.avatar || user?.avatar ? (
                <img
                  src={`${fullDoctor?.avatar || user?.avatar}?t=${fullDoctor?.updatedAt || Date.now()}`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                fullDoctor?.name?.charAt(0)?.toUpperCase() ||
                user?.name?.charAt(0)?.toUpperCase() ||
                'D'
              )}
            </div>

            <FileUpload
              purpose="doctor_avatar"
              entityId={doctorId}
              accept="image/*"
              label="Upload Profile Photo"
              currentUrl={fullDoctor?.avatar || null}
              showPreview
              onSuccess={() => {
                toast.success('Photo uploaded')
                refreshUser?.()
                mutateFull()
                mutateDoctor()
              }}
            />
          </PCard>

          <PCard
            title="Account Info"
            subtitle="Login & contact details"
            icon={<UserRound size={16} strokeWidth={2.3} />}
            action={<SaveBtn onClick={handleSaveUser} loading={savingUser} />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loading ? (
                <>
                  <SkeletonField />
                  <SkeletonField />
                </>
              ) : (
                <>
                  <ProfileInput
                    label="Full Name"
                    value={userForm.name}
                    onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                  />
                  <ProfileInput
                    label="Email Address"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="doctor@example.com"
                  />
                  <ProfileInput
                    label="Phone Number"
                    value={user?.phone ? `+91 ${user.phone}` : '—'}
                    disabled
                  />
                  <ProfileInput
                    label="Role"
                    value={user?.role?.replace(/_/g, ' ') || ''}
                    disabled
                  />
                </>
              )}
            </div>
          </PCard>

          <PCard title="System Details" icon={<FileText size={16} strokeWidth={2.3} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loading ? (
                <>
                  <SkeletonField />
                  <SkeletonField />
                </>
              ) : (
                <>
                  <ProfileInput label="User ID" value={user?.id || '—'} disabled />
                  <ProfileInput label="Doctor ID" value={doctorId || '—'} disabled />
                  <ProfileInput
                    label="Member Since"
                    value={
                      user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })
                        : '—'
                    }
                    disabled
                  />
                  <ProfileInput
                    label="Last Updated"
                    value={
                      fullDoctor?.updatedAt
                        ? new Date(fullDoctor.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })
                        : '—'
                    }
                    disabled
                  />
                </>
              )}
            </div>
          </PCard>
        </div>

        <PCard
          title="Professional Information"
          subtitle="Your specialization, qualifications & experience"
          icon={<BriefcaseMedical size={16} strokeWidth={2.3} />}
          action={<SaveBtn onClick={handleSaveDoctor} loading={savingDoctor} />}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {loading ? (
              <>
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
              </>
            ) : (
              <>
                <ProfileInput
                  label="Doctor Name (as shown to patients)"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Venkata Rao Manikanta"
                />
                <ProfileInput
                  label="Years of Experience"
                  type="number"
                  min="0"
                  max="80"
                  value={doctorForm.experience}
                  onChange={(e) => setDoctorForm((f) => ({ ...f, experience: e.target.value }))}
                  placeholder="e.g., 15"
                />

                <div style={{ gridColumn: '1 / -1' }}>
                  <TagInput
                    label="Specializations"
                    tags={doctorForm.specialization}
                    onChange={(tags) => setDoctorForm((f) => ({ ...f, specialization: tags }))}
                    placeholder="e.g., Cardiologist"
                    suggestions={SPECIALIZATIONS}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <TagInput
                    label="Qualifications"
                    tags={doctorForm.qualifications}
                    onChange={(tags) => setDoctorForm((f) => ({ ...f, qualifications: tags }))}
                    placeholder="e.g., MBBS, MD, DM"
                  />
                </div>
              </>
            )}
          </div>
        </PCard>

        <PCard
          title="Consultation Fees"
          subtitle="Set your fees for in-person and online consultations"
          icon={<IndianRupee size={16} strokeWidth={2.3} />}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {loading ? (
              <>
                <SkeletonField />
                <SkeletonField />
              </>
            ) : (
              <>
                <ProfileInput
                  label="In-Person Fee (₹)"
                  type="number"
                  min="0"
                  value={doctorForm.consultationFee.offline}
                  onChange={(e) =>
                    setDoctorForm((f) => ({
                      ...f,
                      consultationFee: { ...f.consultationFee, offline: e.target.value },
                    }))
                  }
                  placeholder="500"
                />
                <ProfileInput
                  label="Online Fee (₹)"
                  type="number"
                  min="0"
                  value={doctorForm.consultationFee.online}
                  onChange={(e) =>
                    setDoctorForm((f) => ({
                      ...f,
                      consultationFee: { ...f.consultationFee, online: e.target.value },
                    }))
                  }
                  placeholder="700"
                />
              </>
            )}
          </div>

          <p
            style={{
              fontSize: 11,
              color: '#94a3b8',
              margin: '12px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Stethoscope size={13} strokeWidth={2.3} />
            Set to 0 to disable that consultation type. Hospital platform fee will be added on top.
          </p>
        </PCard>

        {hospital && (
          <PCard
            title="Affiliated Hospital"
            subtitle="Set by hospital admin"
            icon={<Building2 size={16} strokeWidth={2.3} />}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: 16,
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #f1f5f9',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1',
                  flexShrink: 0,
                }}
              >
                <Building2 size={26} strokeWidth={2.1} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  {hospital.name}
                </h4>

                {hospital.address && (
                  <p
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      margin: '0 0 4px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                    }}
                  >
                    <MapPin size={13} strokeWidth={2.3} style={{ flexShrink: 0, marginTop: 1 }} />
                    {[
                      hospital.address.line1,
                      hospital.address.city,
                      hospital.address.state,
                      hospital.address.pinCode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
                  {hospital.contactPhone && (
                    <span
                      style={{
                        fontSize: 12,
                        color: '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Phone size={13} strokeWidth={2.3} />
                      {hospital.contactPhone}
                    </span>
                  )}
                  {hospital.contactEmail && (
                    <span
                      style={{
                        fontSize: 12,
                        color: '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Mail size={13} strokeWidth={2.3} />
                      {hospital.contactEmail}
                    </span>
                  )}
                </div>

                {hospital.departments?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {hospital.departments.slice(0, 5).map((d) => (
                      <span
                        key={d}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 100,
                          background: 'rgba(99,102,241,0.08)',
                          color: '#6366f1',
                        }}
                      >
                        {d}
                      </span>
                    ))}
                    {hospital.departments.length > 5 && (
                      <span style={{ fontSize: 10, color: '#94a3b8', padding: '3px 0' }}>
                        +{hospital.departments.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p style={{ fontSize: 11, color: '#94a3b8', margin: '12px 0 0' }}>
              Contact your hospital admin to change affiliation
            </p>
          </PCard>
        )}

        {!loading && fullDoctor?.consultationTypes && (
          <PCard
            title="Active Consultation Types"
            subtitle="Manage in Availability page"
            icon={<Stethoscope size={16} strokeWidth={2.3} />}
          >
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {fullDoctor.consultationTypes.includes('offline') && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 12,
                    background: 'rgba(99,102,241,0.08)',
                    border: '1.5px solid rgba(99,102,241,0.2)',
                    color: '#6366f1',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <Building2 size={15} strokeWidth={2.3} />
                  In-Person Available
                </div>
              )}

              {fullDoctor.consultationTypes.includes('online') && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 12,
                    background: 'rgba(16,185,129,0.08)',
                    border: '1.5px solid rgba(16,185,129,0.2)',
                    color: '#10b981',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <Video size={15} strokeWidth={2.3} />
                  Online Available
                </div>
              )}

              {fullDoctor.consultationTypes.length === 0 && (
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                  No consultation types enabled. Go to Availability page to enable.
                </p>
              )}
            </div>
          </PCard>
        )}
      </div>
    </>
  )
}