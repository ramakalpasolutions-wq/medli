'use client'

import { useEffect, useState, useRef } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge, { getStatusVariant } from '@/components/ui/Badge'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

/* ─── Keyframes ──────────────────────────────────────────────────────── */
const KF = `
  @keyframes dash-in { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dash-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes dash-spin { to{transform:rotate(360deg)} }
  @keyframes dash-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`

const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'dash-shimmer 1.5s linear infinite',
}

const QUICK = [
  { icon: '🏥', label: 'Book Appointment', href: '/hospitals',     grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { icon: '🧪', label: 'Book Lab Test',    href: '/labs',          grad: 'linear-gradient(135deg,#10b981,#059669)' },
  { icon: '👨‍⚕️', label: 'Online Consult',  href: '/doctors',       grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  // { icon: '📄', label: 'My Reports',       href: '/user/bookings', grad: 'linear-gradient(135deg,#f59e0b,#f97316)' },
]

/* ─── Quick Action Card ──────────────────────────────────────────────── */
function QuickCard({ icon, label, href, grad, delay }) {
  const [h, setH] = useState(false)
  const [vis, setVis] = useState(false)
  useEffect(() => { setTimeout(() => setVis(true), delay) }, [delay])

  return (
    <a
      href={href}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'block', textDecoration: 'none',
        background: '#fff', borderRadius: 18,
        padding: 'clamp(14px,3vw,20px)',
        border: `1.5px solid ${h ? '#e0e7ff' : '#f1f5f9'}`,
        textAlign: 'center', cursor: 'pointer',
        boxShadow: h ? '0 12px 32px rgba(0,0,0,0.1)' : '0 2px 6px rgba(0,0,0,0.04)',
        transform: vis ? (h ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(14px)',
        opacity: vis ? 1 : 0,
        transition: 'all .25s ease',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: grad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, margin: '0 auto 10px',
        boxShadow: h ? '0 6px 20px rgba(0,0,0,0.2)' : '0 3px 10px rgba(0,0,0,0.12)',
        transform: h ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform .2s ease, box-shadow .2s ease',
      }}>
        {icon}
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0, lineHeight: 1.3 }}>
        {label}
      </p>
    </a>
  )
}

/* ─── Booking Row ────────────────────────────────────────────────────── */
function BookingRow({ b, mounted, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: isLast ? 'none' : '1px solid #f8fafc',
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{b.bookingId}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
          {mounted
            ? new Date(b.startTime).toLocaleDateString('en-IN') + ' · ' + b.type
            : '—'}
        </p>
      </div>
      <Badge variant={getStatusVariant(b.status)} size="sm" dot>
        {b.status?.replace('_', ' ')}
      </Badge>
    </div>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────────── */
export default function UserDashboard() {
  const { user } = useAuth()
  const mounted  = useMounted()
  const [now, setNow] = useState(null)
  const [joinHov, setJoinHov] = useState(false)
  const [viewHov, setViewHov] = useState(false)
  const [headerVis, setHeaderVis] = useState(false)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (mounted) setTimeout(() => setHeaderVis(true), 50)
  }, [mounted])

  const { data } = useSWR(
    mounted ? '/api/bookings?limit=3&filter=upcoming' : null,
    fetcher
  )
  const bookings = data?.bookings || []

  const greeting = !mounted || !now
    ? 'Hello'
    : now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 17
        ? 'Good afternoon'
        : 'Good evening'

  const firstName = mounted ? (user?.name?.split(' ')[0] || 'there') : ''
  const upcoming  = bookings[0]
  const diffMins  = mounted && upcoming && now
    ? (new Date(upcoming.startTime) - now) / 60_000
    : null
  const showJoin  = upcoming?.type === 'online'
    && diffMins !== null
    && diffMins <= 15
    && diffMins >= -30

  return (
    <>
      <style>{KF}</style>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />

        <div style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: 'clamp(88px,12vw,104px) clamp(16px,3vw,32px) 64px',
        }}>

          {/* ── Greeting ── */}
          <div style={{
            marginBottom: 24,
            opacity: headerVis ? 1 : 0,
            transform: headerVis ? 'translateY(0)' : 'translateY(14px)',
            transition: 'opacity .4s ease, transform .4s ease',
          }}>
            <h1 style={{
              fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800,
              color: '#0f172a', margin: 0,
            }}>
              {mounted ? `${greeting}, ${firstName}! 👋` : 'Hello! 👋'}
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Stay healthy, stay happy
            </p>
          </div>

          {/* ── Upcoming booking banner ── */}
          {mounted && upcoming && (
            <div style={{
              backgroundImage: 'linear-gradient(135deg,#4f46e5,#2563eb)',
              borderRadius: 20,
              padding: 'clamp(18px,4vw,24px)',
              color: '#fff',
              marginBottom: 20,
              boxShadow: '0 8px 32px rgba(79,70,229,0.3)',
              animation: 'dash-in .4s ease',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
                UPCOMING APPOINTMENT
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                    {upcoming.bookingId}
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                    {new Date(upcoming.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <div style={{ marginTop: 8 }}>
                    <Badge variant="info" size="sm">
                      {upcoming.type} · ₹{upcoming.totalAmount}
                    </Badge>
                  </div>
                </div>
                {showJoin && (
                  <button
                    onClick={() => window.open(upcoming.meetLink, '_blank')}
                    onMouseEnter={() => setJoinHov(true)}
                    onMouseLeave={() => setJoinHov(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 18px', borderRadius: 12, border: 'none',
                      background: joinHov ? '#f0f4ff' : '#fff',
                      color: '#4f46e5', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', minHeight: 44,
                      transition: 'background .15s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}
                  >
                    🎥 JOIN MEET
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Quick Actions ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))',
            gap: 12,
            marginBottom: 24,
          }}>
            {QUICK.map((q, i) => (
              <QuickCard key={q.label} {...q} delay={i * 60} />
            ))}
          </div>

          {/* ── Recent Bookings ── */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #f1f5f9',
            padding: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Recent Bookings
              </h3>
              <ViewAllLink />
            </div>

            {!mounted ? (
              /* Skeleton */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < 3 ? '1px solid #f8fafc' : 'none',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ width: 112, height: 14, borderRadius: 6, ...SHIMMER }} />
                      <div style={{ width: 80,  height: 11, borderRadius: 6, ...SHIMMER }} />
                    </div>
                    <div style={{ width: 64, height: 22, borderRadius: 100, ...SHIMMER }} />
                  </div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                  No bookings yet.{' '}
                  <a href="/hospitals" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                    Book now
                  </a>
                </p>
              </div>
            ) : (
              bookings.map((b, i) => (
                <BookingRow key={b.id} b={b} mounted={mounted} isLast={i === bookings.length - 1} />
              ))
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}

function ViewAllLink() {
  const [h, setH] = useState(false)
  return (
    <a
      href="/user/bookings"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize: 12, fontWeight: 600,
        color: h ? '#4f46e5' : '#6366f1',
        textDecoration: 'none', transition: 'color .15s ease',
      }}
    >
      View all →
    </a>
  )
}