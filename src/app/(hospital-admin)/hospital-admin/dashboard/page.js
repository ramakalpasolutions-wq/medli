'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes had-spin { to{transform:rotate(360deg)} }
  @keyframes had-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
`

/* ─── Action Button ──────────────────────────────────────────────────── */
function ABtn({ children, onClick, variant = 'primary' }) {
  const [h, setH] = useState(false)
  const V = {
    primary: { base:'linear-gradient(135deg,#6366f1,#8b5cf6)', hov:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff' },
    danger:  { base:'rgba(239,68,68,0.08)', hov:'rgba(239,68,68,0.14)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' },
    success: { base:'linear-gradient(135deg,#10b981,#059669)', hov:'linear-gradient(135deg,#059669,#047857)', color:'#fff' },
  }
  const s = V[variant] || V.primary
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:5,
        padding:'7px 12px', borderRadius:10, border:s.border||'none',
        background:h?s.hov:s.base, color:s.color,
        fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s ease',
      }}>
      {children}
    </button>
  )
}

/* ─── Booking Row ────────────────────────────────────────────────────── */
function BookingRow({ b, mounted, now, onComplete, onNoShow }) {
  const [h, setH] = useState(false)
  const diffMins  = mounted && now ? (new Date(b.startTime) - now) / 60_000 : null
  const showJoin  = b.type==='online' && b.meetLink && diffMins!==null && diffMins<=15 && diffMins>=-30

  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display:'flex', flexDirection:'column', gap:10,
        padding:16, borderRadius:16,
        background:h?'#fafafa':'#fff',
        border:`1px solid ${h?'#e0e7ff':'#f1f5f9'}`,
        boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
        transition:'all .15s ease',
        animation:'had-in .2s ease',
      }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:'#1e293b', margin:'0 0 3px', fontFamily:'monospace' }}>{b.bookingId}</p>
          <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>
            {mounted && b.startTime
              ? new Date(b.startTime).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
              : '—'}
          </p>
          <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
            <Badge variant="info" size="sm">{b.type}</Badge>
            <Badge variant={getStatusVariant(b.status)} size="sm" dot>
              {b.status?.replace(/_/g,' ')}
            </Badge>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {mounted && showJoin && <JoinBtn meetLink={b.meetLink} />}
          {b.status==='confirmed' && (
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

function JoinBtn({ meetLink }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={() => window.open(meetLink,'_blank')} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:5, padding:'7px 12px',
        borderRadius:10, border:'none',
        background:h?'linear-gradient(135deg,#059669,#047857)':'linear-gradient(135deg,#10b981,#059669)',
        color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
        boxShadow:'0 3px 10px rgba(16,185,129,0.35)', transition:'all .15s ease',
      }}>
      🎥 JOIN MEET
    </button>
  )
}

/* ─── View All Link ──────────────────────────────────────────────────── */
function ViewAllLink({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background:'none', border:'none', cursor:'pointer',
        fontSize:12, fontWeight:600,
        color:h?'#4f46e5':'#6366f1',
        transition:'color .15s ease',
      }}>
      View all →
    </button>
  )
}

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
    ? now.getHours()<12?'Good morning':now.getHours()<17?'Good afternoon':'Good evening'
    : 'Hello'

  const todayStr = mounted ? new Date().toISOString().split('T')[0] : ''

  const { data: bookingsData, mutate } = useSWR(
    mounted && todayStr ? `/api/bookings?limit=20&dateFrom=${todayStr}&dateTo=${todayStr}` : null,
    fetcher
  )
  const { data: statsData } = useSWR('/api/analytics/dashboard', fetcher)
  const bookings = bookingsData?.bookings || []

  const updateStatus = async (id, status) => {
    try {
      const res  = await fetch(`/api/bookings/${id}/status`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        credentials:'include', body:JSON.stringify({status}),
      })
      const json = await res.json()
      json.success ? toast.success(`Marked as ${status}`) : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed to update status') }
  }

  const STATS = [
    { title:"Today's Bookings", value:bookings.length,                               icon:'📅', color:'blue'   },
    { title:'Online Consults',  value:bookings.filter((b)=>b.type==='online').length, icon:'🎥', color:'green'  },
    { title:'Confirmed',        value:bookings.filter((b)=>b.status==='confirmed').length, icon:'✅', color:'purple' },
    { title:'Total Bookings',   value:statsData?.overview?.totalBookings||bookings.length, icon:'📊', color:'orange' },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title={mounted ? greeting : 'Hospital Dashboard'}
        subtitle="Hospital management overview"
        breadcrumbs={[{ label:'Hospital Admin' },{ label:'Dashboard' }]}
      />

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        {STATS.map((s) => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Schedule */}
      <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #f8fafc' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>Today&apos;s Schedule</h3>
          <ViewAllLink onClick={() => router.push('/hospital-admin/bookings')} />
        </div>
        <div style={{ padding:16 }}>
          {!bookings.length ? (
            <div style={{ textAlign:'center', padding:'32px 16px' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📅</div>
              <p style={{ fontSize:13, color:'#94a3b8', margin:0 }}>No appointments today</p>
              <p style={{ fontSize:11, color:'#cbd5e1', margin:'4px 0 0' }}>Bookings will appear here</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {bookings.map((b) => (
                <BookingRow key={b.id} b={b} mounted={mounted} now={now}
                  onComplete={(id) => updateStatus(id,'completed')}
                  onNoShow={(id)   => updateStatus(id,'no_show')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}