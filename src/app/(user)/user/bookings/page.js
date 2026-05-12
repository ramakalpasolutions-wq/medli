'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

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
`

const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'bk-shimmer 1.5s linear infinite',
}

const TABS = [
  { key: 'upcoming',  label: 'Upcoming',  icon: '📅' },
  { key: 'completed', label: 'Completed', icon: '✅' },
  { key: 'cancelled', label: 'Cancelled', icon: '❌' },
]

function typeIcon(type) {
  if (type === 'lab')    return '🧪'
  if (type === 'online') return '🎥'
  return '🏥'
}
function typeLabel(type) {
  if (type === 'lab')    return 'Lab Test'
  if (type === 'online') return 'Online Consult'
  return 'Hospital Visit'
}

function BookingCardSkeleton() {
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid #f1f5f9', padding: 20,
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

function BookingCard({ booking, onClick, mounted }) {
  const [h, setH] = useState(false)
  const isAvailable = mounted
    && booking.type === 'online'
    && booking.status === 'confirmed'
    && (() => {
      const diff = (new Date(booking.startTime) - new Date()) / 60000
      return diff <= 15 && diff >= -30
    })()

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
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
        <Badge variant={getStatusVariant(booking.status)} size="sm" dot>
          {booking.status?.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 8, background: '#f8fafc',
          fontSize: 12, fontWeight: 500, color: '#64748b',
        }}>
          {typeIcon(booking.type)} {typeLabel(booking.type)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
          </p>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>›</span>
        </div>
      </div>

      {isAvailable && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#10b981',
            animation: 'bk-shimmer 1.5s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
            Consultation available now
          </span>
        </div>
      )}
    </div>
  )
}

function TabBtn({ t, active, onClick, count }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 8px', borderRadius: 12,
        fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? '#0f172a' : h ? '#334155' : '#64748b',
        background: active ? '#fff' : h ? 'rgba(255,255,255,0.5)' : 'transparent',
        border: 'none', cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      <span>{t.icon}</span>
      <span>{t.label}</span>
      {count !== null && count > 0 && (
        <span style={{
          width: 20, height: 20, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700,
          background: active ? '#6366f1' : '#e2e8f0',
          color: active ? '#fff' : '#64748b',
        }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}

export default function BookingsPage() {
  const [tab, setTab] = useState('upcoming')
  const router  = useRouter()
  const mounted = useMounted()

 // ✅ CORRECT — map tab name to actual status values the API understands
const STATUS_MAP = {
  upcoming:  'confirmed,pending_payment,created',
  completed: 'completed',
  cancelled: 'cancelled,refunded',
}
const { data, isLoading } = useSWR(`/api/bookings?filter=${tab}&limit=20&userId=me`, fetcher)
  const bookings = data?.bookings || []

  const EMPTY = {
    upcoming:  { title: 'No upcoming bookings',  message: 'Book a hospital, lab, or doctor consultation' },
    completed: { title: 'No completed bookings',  message: 'Your completed appointments will appear here' },
    cancelled: { title: 'No cancelled bookings',  message: "You haven't cancelled any bookings" },
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
            display: 'flex', gap: 3,
            background: '#f1f5f9', borderRadius: 16, padding: 4,
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
                icon={<span style={{ fontSize: 48 }}>📅</span>}
                title={EMPTY[tab].title}
                message={EMPTY[tab].message}
                action={tab === 'upcoming' ? (
                  <a href="/hospitals" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: 12,
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  }}>
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

function NewBookingLink() {
  const [h, setH] = useState(false)
  return (
    <a
      href="/hospitals"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize: 13, fontWeight: 600,
        color: h ? '#4f46e5' : '#6366f1',
        textDecoration: 'none', transition: 'color .15s ease',
      }}
    >
      + New Booking
    </a>
  )
}