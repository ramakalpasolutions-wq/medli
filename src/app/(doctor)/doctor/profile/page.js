'use client'

import { useState, useEffect } from 'react'
import AdminHeader  from '@/components/admin/AdminHeader'
import FileUpload   from '@/components/ui/FileUpload'
import { useAuth }  from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'

const KF = `@keyframes dp-spin { to { transform: rotate(360deg) } }`

/* ─── Input ──────────────────────────────────────────────────────────── */
function ProfileInput({ label, disabled, value, ...props }) {
  const [focused, setFocused] = useState(false)

  // ✅ Always pass a string — never undefined
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
        value={safeValue}
        disabled={disabled}
        onFocus={(e) => { setFocused(true);  props.onFocus?.(e) }}
        onBlur={(e)  => { setFocused(false); props.onBlur?.(e)  }}
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
          boxShadow: focused
            ? '0 0 0 3px rgba(99,102,241,0.12)'
            : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
          cursor: disabled ? 'not-allowed' : 'text',
          width: '100%',
        }}
      />
    </div>
  )
}

/* ─── Save button ────────────────────────────────────────────────────── */
function SaveBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 18px',
        borderRadius: 12,
        border: 'none',
        background: h
          ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.8 : 1,
        boxShadow: h
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
          animation: 'dp-spin .7s linear infinite',
          display: 'inline-block',
        }} />
      )}
      {isLoading ? 'Saving…' : '💾 Save'}
    </button>
  )
}

/* ─── Section Card ───────────────────────────────────────────────────── */
function PCard({ title, action, children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      border: '1px solid #f1f5f9',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {(title || action) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid #f8fafc',
        }}>
          {title && (
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

/* ─── Skeleton row ───────────────────────────────────────────────────── */
function SkeletonField() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{
        width: 80, height: 12, borderRadius: 6,
        background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }} />
      <div style={{
        height: 42, borderRadius: 12,
        background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }} />
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function DoctorProfilePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()

  // ✅ Always initialize with empty strings — NEVER undefined
  const [form, setForm] = useState({
    name:  '',
    email: '',
  })
  const [saving,    setSaving]    = useState(false)
  const [hydrated,  setHydrated]  = useState(false)

  // ✅ Sync form when user loads from auth context
  useEffect(() => {
    if (user) {
      setForm({
        name:  user.name  || '',
        email: user.email || '',
      })
      setHydrated(true)
    }
  }, [user])

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const res  = await fetch(`/api/users/${user.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name:  form.name.trim(),
          email: form.email.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Profile updated')
        refreshUser?.()
      } else {
        toast.error(json.error || 'Failed to update')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const shimmerKF = `
    @keyframes shimmer {
      0%   { background-position: -200% 0 }
      100% { background-position:  200% 0 }
    }
  `

  return (
    <>
      <style>{KF + shimmerKF}</style>
      <AdminHeader
        title="Profile"
        subtitle="Update your profile information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/doctor/dashboard' },
          { label: 'Profile' },
        ]}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
      }}>

        {/* ── Photo ─────────────────────────────────────────────────── */}
        <PCard title="Profile Photo">
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 26,
            margin: '0 auto 16px', overflow: 'hidden',
          }}>
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (user?.name?.charAt(0)?.toUpperCase() || 'D')
            }
          </div>
          <FileUpload
            purpose="doctor_avatar"
            accept="image/*"
            label="Upload Profile Photo"
            onSuccess={() => { toast.success('Photo uploaded'); refreshUser?.() }}
          />
        </PCard>

        {/* ── Personal info ─────────────────────────────────────────── */}
        <PCard
          title="Personal Information"
          action={<SaveBtn onClick={handleSave} loading={saving} />}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!hydrated ? (
              // Show skeletons while auth loads
              <>
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
              </>
            ) : (
              <>
                <ProfileInput
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Dr. Full Name"
                />
                <ProfileInput
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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

        {/* ── Account details ───────────────────────────────────────── */}
        <PCard title="Account Details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!hydrated ? (
              <>
                <SkeletonField />
                <SkeletonField />
              </>
            ) : (
              <>
                <ProfileInput
                  label="User ID"
                  value={user?.id || '—'}
                  disabled
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                    Verification Status
                  </label>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 10,
                    background: user?.isVerified ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${user?.isVerified ? '#bbf7d0' : '#fde68a'}`,
                    fontSize: 13, fontWeight: 600,
                    color: user?.isVerified ? '#16a34a' : '#d97706',
                    width: 'fit-content',
                  }}>
                    <span>{user?.isVerified ? '✅' : '⏳'}</span>
                    {user?.isVerified ? 'Verified' : 'Pending Verification'}
                  </div>
                </div>
                <ProfileInput
                  label="Member Since"
                  value={user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })
                    : '—'
                  }
                  disabled
                />
              </>
            )}
          </div>
        </PCard>

      </div>
    </>
  )
}