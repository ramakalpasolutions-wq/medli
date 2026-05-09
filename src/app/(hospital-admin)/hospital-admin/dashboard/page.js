'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard   from '@/components/ui/StatsCard'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

// ✅ Returns j.data → { bookings: [], pagination: {} }
const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `
  @keyframes had-spin { to { transform: rotate(360deg) } }
  @keyframes had-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes had-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`

/* ─── Skeleton card ──────────────────────────────────────────────────── */
function SkeletonCard({ height = 80 }) {
  return (
    <div style={{
      height, borderRadius: 20,
      backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'had-shimmer 1.5s linear infinite',
    }} />
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

/* ─── Join Meet Button ───────────────────────────────────────────────── */
function JoinBtn({ meetLink }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={() => window.open(meetLink, '_blank')}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
        borderRadius: 10, border: 'none',
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

/* ─── Booking Row ────────────────────────────────────────────────────── */
function BookingRow({ b, mounted, now, onComplete, onNoShow }) {
  const [h, setH] = useState(false)
  const diffMins  = mounted && now ? (new Date(b.startTime) - now) / 60_000 : null
  const showJoin  = b.type === 'online' && b.meetLink &&
                    diffMins !== null && diffMins <= 15 && diffMins >= -30

  const fmtTime   = mounted && b.startTime
    ? new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '—'

  const fmtDate   = mounted && b.startTime
    ? new Date(b.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })
    : '—'

  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10, padding: 16,
        borderRadius: 16,
        background: h ? '#fafafa' : '#fff',
        border: `1px solid ${h ? '#e0e7ff' : '#f1f5f9'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all .15s ease',
        animation: 'had-in .2s ease',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
      }}>
        {/* Left: booking info */}
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: '#1e293b',
            margin: '0 0 2px', fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {b.bookingId}
          </p>
          <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, margin: '0 0 2px' }}>
            {fmtTime}
            <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>{fmtDate}</span>
          </p>
          {/* Patient name if available */}
          {b.userName && (
            <p style={{ fontSize: 12, color: '#475569', margin: '0 0 6px', fontWeight: 500 }}>
              👤 {b.userName}
            </p>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge
              variant={b.type === 'lab' ? 'success' : b.type === 'online' ? 'purple' : 'info'}
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

        {/* Right: actions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {mounted && showJoin && <JoinBtn meetLink={b.meetLink} />}
          {b.status === 'confirmed' && (
            <>
              <ABtn variant="primary" onClick={() => onComplete(b.id)}>✓ Complete</ABtn>
              <ABtn variant="danger"  onClick={() => onNoShow(b.id)}>✕ No-show</ABtn>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Quick Stats Card ───────────────────────────────────────────────── */
function QuickStat({ icon, label, value, color }) {
  const COLORS = {
    blue:   { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1e40af' },
    green:  { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#15803d' },
    purple: { bg: '#f5f3ff', border: '#ddd6fe', icon: '#7c3aed', text: '#6d28d9' },
    orange: { bg: '#fff7ed', border: '#fed7aa', icon: '#ea580c', text: '#c2410c' },
  }
  const c = COLORS[color] || COLORS.blue
  return (
    <div style={{
      background: c.bg, borderRadius: 16, padding: '16px 18px',
      border: `1px solid ${c.border}`, animation: 'had-in .3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{label}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 900, color: c.icon, margin: 0, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────────── */
export default function HospitalAdminDashboard() {
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

  const greeting = mounted && now
    ? now.getHours() < 12 ? 'Good morning'
      : now.getHours() < 17 ? 'Good afternoon'
      : 'Good evening'
    : 'Hello'

  const todayStr = mounted ? new Date().toISOString().split('T')[0] : ''

  // ── Fetch today's bookings ──────────────────────────────────────────
  const { data: bookingsData, isLoading: bookingsLoading, mutate } = useSWR(
    mounted && todayStr
      ? `/api/bookings?limit=50&dateFrom=${todayStr}&dateTo=${todayStr}`
      : null,
    fetcher
  )

  // ── Fetch hospital info ─────────────────────────────────────────────
  const { data: hospitalData } = useSWR('/api/hospitals?adminOnly=true', fetcher)
  const hospital = hospitalData?.hospitals?.[0]

  // ── Fetch settlement pending ────────────────────────────────────────
  const { data: pendingData } = useSWR('/api/settlements/pending', fetcher)
  const myPending = hospital
    ? (pendingData?.hospitals || []).find((h) => h.id === hospital.id)
    : null

  // ✅ Correctly read bookings from paginatedResponse shape
  const bookings = bookingsData?.bookings || []

  // Derived stats from bookings
  const totalToday    = bookings.length
  const onlineConsults = bookings.filter((b) => b.type === 'online').length
  const confirmed      = bookings.filter((b) => b.status === 'confirmed').length
  const completed      = bookings.filter((b) => b.status === 'completed').length

  // Revenue today
  const todayRevenue = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((s, b) => s + Number(b.totalAmount || 0), 0)

  const updateStatus = async (id, status) => {
    try {
      const res  = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ status }),
      })
      const json = await res.json()
      json.success
        ? toast.success(`Marked as ${status.replace('_', ' ')}`)
        : toast.error(json.error || 'Failed to update')
      mutate()
    } catch { toast.error('Failed to update status') }
  }

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title={`${greeting}${user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋`}
        subtitle={hospital ? `Managing ${hospital.name}` : 'Hospital management overview'}
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Dashboard' }]}
      />

      {/* ── Stats Grid ── */}
      {bookingsLoading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} height={90} />)}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          <QuickStat icon="📅" label="Today's Bookings" value={totalToday}    color="blue"   />
          <QuickStat icon="✅" label="Confirmed"         value={confirmed}     color="purple" />
          <QuickStat icon="🎉" label="Completed"         value={completed}     color="green"  />
          <QuickStat icon="🎥" label="Online Consults"   value={onlineConsults} color="blue"  />
          <QuickStat
            icon="💰"
            label="Today's Revenue"
            value={`₹${todayRevenue.toLocaleString('en-IN')}`}
            color="orange"
          />
        </div>
      )}

      {/* ── Hospital Info + Pending Settlement ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, marginBottom: 20,
      }}>

        {/* Hospital info */}
        {hospital && (
          <div style={{
            background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 20,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Hospital Info
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                background: 'linear-gradient(135deg,#dbeafe,#c7d2fe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {hospital.images?.logo
                  ? <img src={hospital.images.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🏥'}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hospital.name}
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                  {hospital.address?.city || '—'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <Badge variant={hospital.isApproved ? 'success' : 'warning'} size="sm" dot>
                {hospital.isApproved ? 'Approved' : 'Pending Approval'}
              </Badge>
              <Badge variant={hospital.isActive ? 'success' : 'neutral'} size="sm">
                {hospital.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {hospital.departments?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {hospital.departments.slice(0, 4).map((d) => (
                  <span key={d} style={{
                    fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 100,
                    background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                  }}>{d}</span>
                ))}
                {hospital.departments.length > 4 && (
                  <span style={{ fontSize: 10, color: '#94a3b8', padding: '3px 0' }}>
                    +{hospital.departments.length - 4} more
                  </span>
                )}
              </div>
            )}

            {hospital.rating?.average > 0 && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⭐</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>
                  {hospital.rating.average.toFixed(1)}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>({hospital.rating.count} reviews)</span>
              </div>
            )}
          </div>
        )}

        {/* Pending settlement */}
        {myPending && (
          <div style={{
            backgroundImage: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.04))',
            border: '1px solid rgba(99,102,241,0.12)',
            borderRadius: 20, padding: 20,
          }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: '#6366f1',
              letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px',
            }}>
              Pending Settlement
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10,
            }}>
              {[
                { label: 'Bookings',   value: String(myPending.totalBookings || 0) },
                { label: 'Gross',      value: `₹${Number(myPending.grossAmount || 0).toLocaleString('en-IN')}` },
                { label: 'You Get',    value: `₹${Number(myPending.netSettlementAmount || 0).toLocaleString('en-IN')}`, green: true },
              ].map((s) => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '10px 12px',
                  border: s.green ? '1.5px solid rgba(16,185,129,0.25)' : 'none',
                }}>
                  <p style={{ fontSize: 10, color: s.green ? '#059669' : '#64748b', margin: '0 0 3px' }}>{s.label}</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: s.green ? '#047857' : '#1e293b', margin: 0 }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/hospital-admin/settlements')}
              style={{
                marginTop: 14, width: '100%', padding: '9px', borderRadius: 12, border: 'none',
                background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              View Settlements →
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div style={{
          background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 20,
        }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: '#94a3b8', margin: '0 0 12px',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Quick Actions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '📅 View All Bookings',  href: '/hospital-admin/bookings'    },
              { label: '👨‍⚕️ Manage Doctors',     href: '/hospital-admin/doctors'     },
              { label: '🏷️ Hospital Coupons',    href: '/hospital-admin/coupons'     },
              { label: '💰 Settlements',         href: '/hospital-admin/settlements' },
              { label: '🧾 Invoices',            href: '/hospital-admin/invoices'    },
              { label: '📈 Reports',             href: '/hospital-admin/reports'     },
              { label: '⚙️ Settings',            href: '/hospital-admin/settings'    },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  padding: '10px 14px', borderRadius: 12, border: '1px solid #f1f5f9',
                  background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left', transition: 'all .13s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eff6ff'
                  e.currentTarget.style.borderColor = '#bfdbfe'
                  e.currentTarget.style.color = '#1d4ed8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc'
                  e.currentTarget.style.borderColor = '#f1f5f9'
                  e.currentTarget.style.color = '#374151'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
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
            onClick={() => router.push('/hospital-admin/bookings')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: '#6366f1',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#4f46e5' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6366f1' }}
          >
            View all →
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {bookingsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => <SkeletonCard key={i} height={90} />)}
            </div>
          ) : !bookings.length ? (
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: 0 }}>
                No appointments today
              </p>
              <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0 0' }}>
                New bookings will appear here in real-time
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bookings.map((b) => (
                <BookingRow
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