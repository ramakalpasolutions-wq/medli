'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import {
  Calendar,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Video,
  Building2,
  Plus,
  ChevronRight,
  Clock,
  AlertCircle,
  Wifi,
} from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes bk-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes bk-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ping { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
`

const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'bk-shimmer 1.5s linear infinite',
}

const TABS = [
  { key: 'upcoming',  label: 'Upcoming',  Icon: Calendar,      activeColor: '#6366f1' },
  { key: 'completed', label: 'Completed', Icon: CheckCircle2,  activeColor: '#10b981' },
  { key: 'cancelled', label: 'Cancelled', Icon: XCircle,       activeColor: '#ef4444' },
]

const UPCOMING_STATUSES  = new Set(['confirmed', 'pending_payment', 'created'])
const COMPLETED_STATUSES = new Set(['completed'])
const CANCELLED_STATUSES = new Set(['cancelled', 'refunded', 'no_show'])

/* ─── Type Icon Box ─────────────────────────────────────────────── */
const TYPE_CONFIG = {
  lab:    { Icon: FlaskConical, bg: '#dcfce7', color: '#16a34a' },
  online: { Icon: Video,        bg: '#ede9fe', color: '#7c3aed' },
  _default: { Icon: Building2,  bg: '#dbeafe', color: '#2563eb' },
}

function TypeIconBox({ type, size = 18, boxSize = 36 }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG._default
  const { Icon, bg, color } = cfg
  return (
    <div style={{
      width: boxSize,
      height: boxSize,
      borderRadius: 10,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={size} strokeWidth={2} color={color} />
    </div>
  )
}

function typeLabel(type) {
  if (type === 'lab') return 'Lab Test'
  if (type === 'online') return 'Online Consult'
  return 'Hospital Visit'
}

/* ─── Skeleton ──────────────────────────────────────────────────── */
function BookingCardSkeleton() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      border: '1px solid #f1f5f9',
      padding: 20,
      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: 128, height: 14, borderRadius: 6, ...SHIMMER }} />
          <div style={{ width: 96,  height: 11, borderRadius: 6, ...SHIMMER }} />
          <div style={{ width: 80,  height: 11, borderRadius: 6, ...SHIMMER }} />
        </div>
        <div style={{ width: 76, height: 22, borderRadius: 100, ...SHIMMER }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: 96, height: 20, borderRadius: 8, ...SHIMMER }} />
        <div style={{ width: 64, height: 14, borderRadius: 6, ...SHIMMER }} />
      </div>
    </div>
  )
}

/* ─── Booking Card ──────────────────────────────────────────────── */
function BookingCard({ booking, onClick, mounted }) {
  const [h, setH] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)

  const isAvailable = mounted
    && booking.type === 'online'
    && booking.status === 'confirmed'
    && (() => {
      const diff = (new Date(booking.startTime) - new Date()) / 60000
      return diff <= 15 && diff >= -30
    })()

  const isPendingExpiring = mounted && booking.status === 'pending_payment'

  useEffect(() => {
    if (!isPendingExpiring) return
    const calc = () => {
      const created = new Date(booking.createdAt)
      const expiresAt = new Date(created.getTime() + 15 * 60 * 1000)
      const secs = Math.max(0, Math.floor((expiresAt - new Date()) / 1000))
      setTimeLeft(secs)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [isPendingExpiring, booking.createdAt])

  const fmtCountdown = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: '#fff',
        borderRadius: 20,
        border: `1.5px solid ${h ? '#c7d2fe' : '#f1f5f9'}`,
        padding: 20,
        cursor: 'pointer',
        boxShadow: h ? '0 12px 32px rgba(0,0,0,0.1)' : '0 2px 6px rgba(0,0,0,0.04)',
        transform: h ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all .2s ease',
        animation: 'bk-in .2s ease',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        {/* Left: type icon + info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <TypeIconBox type={booking.type} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 2px' }}>
              {booking.userName || 'Patient'}
            </p>
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', margin: '0 0 2px' }}>
              {booking.bookingId}
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              {mounted
                ? new Date(booking.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                : '—'}
            </p>
          </div>
        </div>

        <Badge variant={getStatusVariant(booking.status)} size="sm" dot>
          {booking.status?.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 8,
          background: '#f8fafc',
          fontSize: 12,
          fontWeight: 500,
          color: '#64748b',
        }}>
          {typeLabel(booking.type)}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
          </p>
          <ChevronRight size={16} color="#94a3b8" />
        </div>
      </div>

      {/* Pending expiry countdown */}
      {isPendingExpiring && timeLeft !== null && timeLeft > 0 && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: '1px solid #fef3c7',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: '#fef3c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={15} color="#f59e0b" strokeWidth={2} />
          </div>
          <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
            Slot reserved · expires in {fmtCountdown(timeLeft)}
          </span>
        </div>
      )}

      {/* Expired */}
      {isPendingExpiring && timeLeft === 0 && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: '1px solid #fee2e2',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={15} color="#ef4444" strokeWidth={2} />
          </div>
          <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
            Payment time expired · slot released
          </span>
        </div>
      )}

      {/* Online consult live */}
      {isAvailable && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {/* Pulsing dot */}
          <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 8,
              background: 'rgba(16,185,129,0.15)',
              animation: 'ping 1.5s ease-out infinite',
            }} />
            <div style={{
              position: 'relative', width: 28, height: 28, borderRadius: 8,
              background: '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wifi size={14} color="#10b981" strokeWidth={2.5} />
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
            Consultation available now
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── Tab Button ────────────────────────────────────────────────── */
function TabBtn({ t, active, onClick, count }) {
  const [h, setH] = useState(false)
  const { Icon, activeColor } = t

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '10px 8px',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? '#0f172a' : h ? '#334155' : '#64748b',
        background: active ? '#fff' : h ? 'rgba(255,255,255,0.5)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      <Icon
        size={15}
        strokeWidth={active ? 2.5 : 2}
        color={active ? activeColor : h ? '#334155' : '#94a3b8'}
      />
      <span>{t.label}</span>
      {count !== null && count > 0 && (
        <span style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          background: active ? activeColor : '#e2e8f0',
          color: active ? '#fff' : '#64748b',
          transition: 'all .15s ease',
        }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function BookingsPage() {
  const [tab, setTab] = useState('upcoming')
  const router = useRouter()
  const searchParams = useSearchParams()
  const mounted = useMounted()

  const { data, isLoading, mutate } = useSWR(
    `/api/bookings?filter=${tab}&limit=50&userId=me`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 0,
    }
  )

  const allBookings = data?.bookings || []
  const now = mounted ? new Date() : null

  useEffect(() => { mutate() }, [tab, mutate])

  useEffect(() => {
    if (searchParams.get('refresh') === '1') mutate()
  }, [searchParams, mutate])

  const bookings = (() => {
    if (!mounted) return allBookings

    if (tab === 'upcoming') {
      return allBookings
        .filter((b) => {
          if (!UPCOMING_STATUSES.has(b.status)) return false
          if (b.status === 'confirmed' && new Date(b.startTime) < now) return false
          return true
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    }

    if (tab === 'completed') {
      return allBookings
        .filter((b) => {
          if (COMPLETED_STATUSES.has(b.status)) return true
          if (b.status === 'confirmed' && new Date(b.startTime) < now) return true
          return false
        })
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    }

    if (tab === 'cancelled') {
      return allBookings
        .filter((b) => CANCELLED_STATUSES.has(b.status))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return allBookings
  })()

  const EMPTY = {
    upcoming:  { title: 'No upcoming bookings',  message: 'Book a hospital, lab, or doctor consultation' },
    completed: { title: 'No completed bookings', message: 'Your completed appointments will appear here' },
    cancelled: { title: 'No cancelled bookings', message: "You haven't cancelled any bookings" },
  }

  /* Empty state icons */
  const EMPTY_ICONS = {
    upcoming:  <div style={{ width:56,height:56,borderRadius:16,background:'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center' }}><Calendar size={28} color="#7c3aed" strokeWidth={2} /></div>,
    completed: <div style={{ width:56,height:56,borderRadius:16,background:'#dcfce7',display:'flex',alignItems:'center',justifyContent:'center' }}><CheckCircle2 size={28} color="#16a34a" strokeWidth={2} /></div>,
    cancelled: <div style={{ width:56,height:56,borderRadius:16,background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center' }}><XCircle size={28} color="#ef4444" strokeWidth={2} /></div>,
  }

  return (
    <>
      <style>{KF}</style>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />

        <div style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 'clamp(88px,12vw,104px) clamp(16px,3vw,32px) 64px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              My Bookings
            </h1>
            <NewBookingLink />
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: 3,
            background: '#f1f5f9',
            borderRadius: 16,
            padding: 4,
            marginBottom: 20,
          }}>
            {TABS.map((t) => (
              <TabBtn
                key={t.key}
                t={t}
                active={tab === t.key}
                onClick={() => setTab(t.key)}
                count={!isLoading && tab === t.key ? bookings.length : null}
              />
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map((i) => <BookingCardSkeleton key={i} />)}
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ paddingTop: 32 }}>
              <EmptyState
                icon={EMPTY_ICONS[tab]}
                title={EMPTY[tab].title}
                message={EMPTY[tab].message}
                action={tab === 'upcoming' ? (
                  <a
                    href="/hospitals"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 20px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    }}
                  >
                    Book Now →
                  </a>
                ) : null}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookings.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  mounted={mounted}
                  onClick={() => router.push(`/user/bookings/${b.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}

/* ─── New Booking Link ──────────────────────────────────────────── */
function NewBookingLink() {
  const [h, setH] = useState(false)

  return (
    <a
      href="/hospitals"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color: h ? '#4f46e5' : '#6366f1',
        textDecoration: 'none',
        transition: 'color .15s ease',
      }}
    >
      <Plus size={15} strokeWidth={2.5} />
      New Booking
    </a>
  )
}