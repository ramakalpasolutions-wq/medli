'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard   from '@/components/ui/StatsCard'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { useAuth }  from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

// ✅ Returns j.data = { bookings: [], pagination: {} }
const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `
  @keyframes dd-spin     { to { transform: rotate(360deg) } }
  @keyframes dd-in       { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dd-shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`
const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%', animation: 'dd-shimmer 1.5s linear infinite',
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

/* ─── Join Button ────────────────────────────────────────────────────── */
function JoinBtn({ meetLink }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={() => window.open(meetLink, '_blank')}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '7px 12px', borderRadius: 10, border: 'none',
        background: h
          ? 'linear-gradient(135deg,#059669,#047857)'
          : 'linear-gradient(135deg,#10b981,#059669)',
        color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 3px 10px rgba(16,185,129,0.35)', transition: 'all .15s ease',
      }}
    >
      🎥 JOIN MEET
    </button>
  )
}

/* ─── Action Button ──────────────────────────────────────────────────── */
function ABtn({ children, onClick, variant = 'primary' }) {
  const [h, setH] = useState(false)
  const V = {
    primary: {
      base: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      hov:  'linear-gradient(135deg,#7c3aed,#6d28d9)',
      color: '#fff',
    },
    danger: {
      base:   'rgba(239,68,68,0.08)',
      hov:    'rgba(239,68,68,0.14)',
      color:  '#ef4444',
      border: '1px solid rgba(239,68,68,0.2)',
    },
  }
  const s = V[variant] || V.primary
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '7px 12px', borderRadius: 10, border: s.border || 'none',
        background: h ? s.hov : s.base, color: s.color,
        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s ease',
      }}
    >
      {children}
    </button>
  )
}

/* ─── Quick Stat ─────────────────────────────────────────────────────── */
function QuickStat({ icon, label, value, color }) {
  const COLORS = {
    blue:   { bg: '#eff6ff', border: '#bfdbfe', val: '#2563eb', text: '#1e40af' },
    green:  { bg: '#f0fdf4', border: '#bbf7d0', val: '#16a34a', text: '#15803d' },
    purple: { bg: '#f5f3ff', border: '#ddd6fe', val: '#7c3aed', text: '#6d28d9' },
    orange: { bg: '#fff7ed', border: '#fed7aa', val: '#ea580c', text: '#c2410c' },
  }
  const c = COLORS[color] || COLORS.blue
  return (
    <div style={{
      background: c.bg, borderRadius: 16, padding: '16px 18px',
      border: `1px solid ${c.border}`, animation: 'dd-in .3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: c.text }}>{label}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 900, color: c.val, margin: 0, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )
}

/* ─── Appointment Row ────────────────────────────────────────────────── */
function AppRow({ b, mounted, now, onComplete, onNoShow }) {
  const [h, setH] = useState(false)
  const diffMins  = mounted && now ? (new Date(b.startTime) - now) / 60_000 : null
  const showJoin  = b.type === 'online' && b.meetLink &&
                    diffMins !== null && diffMins <= 15 && diffMins >= -30

  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: h ? '#fafafa' : '#fff',
        borderRadius: 16,
        border: `1px solid ${h ? '#e0e7ff' : '#f1f5f9'}`,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all .15s ease',
        animation: 'dd-in .2s ease',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 3px' }}>
            {b.userName || 'Patient'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
              {b.bookingId}
            </span>
            {mounted && (
              <>
                <span style={{ color: '#e2e8f0' }}>·</span>
                <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
                  {formatTime(b.startTime)}
                  {b.endTime && ` – ${formatTime(b.endTime)}`}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge
              variant={b.type === 'online' ? 'purple' : 'info'}
              size="sm"
            >
              {b.type}
            </Badge>
            <Badge variant={getStatusVariant(b.status)} size="sm" dot>
              {b.status?.replace(/_/g, ' ')}
            </Badge>
            {b.totalAmount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#16a34a',
                background: '#f0fdf4', borderRadius: 100, padding: '2px 8px',
                border: '1px solid #bbf7d0',
              }}>
                ₹{Number(b.totalAmount).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {mounted && showJoin && <JoinBtn meetLink={b.meetLink} />}
          {b.status === 'confirmed' && (
            <>
              <ABtn variant="primary" onClick={() => onComplete(b.id)}>✓ Complete</ABtn>
              <ABtn variant="danger"  onClick={() => onNoShow(b.id)}>✕ Not-Attended</ABtn>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const toast    = useToast()
  const router   = useRouter()
  const mounted  = useMounted()

  const [now, setNow] = useState(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const todayStr = mounted ? new Date().toISOString().split('T')[0] : ''

  // ✅ Fetch today's confirmed bookings
  const { data, isLoading, mutate } = useSWR(
    mounted && todayStr
      ? `/api/bookings?limit=50&status=confirmed&dateFrom=${todayStr}&dateTo=${todayStr}`
      : null,
    fetcher
  )

  // ✅ Correctly read from paginatedResponse shape
  const bookings = data?.bookings || []

  const onlineCount    = bookings.filter((b) => b.type === 'online').length
  const inPersonCount  = bookings.filter((b) => b.type === 'hospital').length

  const greeting = mounted && now
    ? now.getHours() < 12 ? 'Good morning'
      : now.getHours() < 17 ? 'Good afternoon'
      : 'Good evening'
    : 'Hello'

  const updateStatus = async (id, status) => {
    try {
      const res  = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ status }),
      })
      const json = await res.json()
      json.success
        ? toast.success(`Marked as ${status.replace('_', ' ')}`)
        : toast.error(json.error || 'Failed')
      mutate()
    } catch { toast.error('Failed to update status') }
  }

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title={`${greeting}, Dr. ${user?.name?.split(' ').pop() || ''} 👋`}
        subtitle="Your appointments for today"
        breadcrumbs={[{ label: 'Doctor' }, { label: 'Dashboard' }]}
      />

      {/* ── Stats ── */}
      {isLoading ? (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 90, borderRadius: 16, ...SHIMMER }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          <QuickStat icon="📅" label="Today's Appointments" value={bookings.length} color="blue" />
          <QuickStat icon="🎥" label="Online Consults"       value={onlineCount}     color="green"  />
          <QuickStat icon="🏥" label="In-Person"             value={inPersonCount}   color="purple" />
          <QuickStat icon="⏳" label="Pending"               value={bookings.filter((b) => b.status === 'confirmed').length} color="orange" />
        </div>
      )}

      {/* ── Quick Navigation ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 10, marginBottom: 20,
      }}>
        {[
          { label: '📅 All Appointments',  href: '/doctor/appointments' },
          { label: '🗓️ My Availability',   href: '/doctor/availability' },
          { label: '👤 My Profile',        href: '/doctor/profile'      },
        ].map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{
              padding: '11px 14px', borderRadius: 12, border: '1px solid #e0e7ff',
              background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', textAlign: 'left', transition: 'all .13s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#eff6ff'
              e.currentTarget.style.borderColor = '#6366f1'
              e.currentTarget.style.color = '#4f46e5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.borderColor = '#e0e7ff'
              e.currentTarget.style.color = '#374151'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Today's Schedule ── */}
      <div style={{
        background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid #f8fafc',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Today&apos;s Schedule
            {bookings.length > 0 && (
              <span style={{
                marginLeft: 8, fontSize: 12, fontWeight: 700,
                background: '#eff6ff', color: '#2563eb',
                padding: '2px 8px', borderRadius: 100, border: '1px solid #bfdbfe',
              }}>
                {bookings.length}
              </span>
            )}
          </h3>
          <button
            onClick={() => router.push('/doctor/appointments')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: '#6366f1',
            }}
          >
            View all →
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 90, borderRadius: 16, ...SHIMMER }} />
              ))}
            </div>
          ) : !bookings.length ? (
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: 0 }}>
                No appointments for today
              </p>
              <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0 16px' }}>
                New bookings will appear here
              </p>
              <button
                onClick={() => router.push('/doctor/appointments')}
                style={{
                  padding: '9px 20px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                View All Appointments →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bookings.map((b) => (
                <AppRow
                  key={b.id}
                  b={b}
                  mounted={mounted}
                  now={now}
                  onComplete={(id) => updateStatus(id, 'completed')}
                  onNoShow={(id)   => updateStatus(id, 'no_show')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}