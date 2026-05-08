'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
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
  @keyframes dd-spin { to{transform:rotate(360deg)} }
  @keyframes dd-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
`

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

/* ─── Action Button ──────────────────────────────────────────────────── */
function ABtn({ children, onClick, variant = 'primary', loading: isLoading }) {
  const [h, setH] = useState(false)
  const V = {
    primary: { base:'linear-gradient(135deg,#6366f1,#8b5cf6)', hov:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff' },
    danger:  { base:'rgba(239,68,68,0.08)', hov:'rgba(239,68,68,0.14)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' },
    success: { base:'linear-gradient(135deg,#10b981,#059669)', hov:'linear-gradient(135deg,#059669,#047857)', color:'#fff' },
  }
  const s = V[variant]
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:5,
        padding:'7px 12px', borderRadius:10, border:s.border||'none',
        background: h?s.hov:s.base,
        color:s.color, fontSize:12, fontWeight:600, cursor:'pointer',
        transition:'all .15s ease',
      }}
    >
      {isLoading && <span style={{ width:12,height:12,borderRadius:'50%',border:'2px solid currentColor',borderTopColor:'transparent',animation:'dd-spin .7s linear infinite',display:'inline-block',opacity:0.6 }} />}
      {children}
    </button>
  )
}

/* ─── Appointment Row ────────────────────────────────────────────────── */
function AppRow({ b, mounted, now, onComplete, onNoShow }) {
  const [h, setH] = useState(false)
  const diffMins  = mounted && now ? (new Date(b.startTime) - now) / 60_000 : null
  const showJoin  = b.type==='online' && b.meetLink && diffMins!==null && diffMins<=15 && diffMins>=-30

  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: h?'#fafafa':'#fff',
        borderRadius:16, border:'1px solid #f1f5f9',
        padding:16,
        boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
        transition:'all .15s ease',
        animation:'dd-in .2s ease',
      }}
    >
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:'0 0 3px' }}>
              {b.userName || 'Patient'}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontFamily:'monospace', color:'#94a3b8' }}>{b.bookingId}</span>
              {mounted && (
                <>
                  <span style={{ color:'#e2e8f0' }}>·</span>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>{formatTime(b.startTime)} – {formatTime(b.endTime)}</span>
                </>
              )}
            </div>
            <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
              <Badge variant="info" size="sm">{b.type}</Badge>
              <Badge variant={getStatusVariant(b.status)} size="sm" dot>
                {b.status?.replace(/_/g,' ')}
              </Badge>
            </div>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {mounted && showJoin && (
              <JoinBtn meetLink={b.meetLink} />
            )}
            {b.status === 'confirmed' && (
              <>
                <ABtn variant="primary" onClick={() => onComplete(b.id)}>✓ Complete</ABtn>
                <ABtn variant="danger"  onClick={() => onNoShow(b.id)}>✕ No-show</ABtn>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function JoinBtn({ meetLink }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={() => window.open(meetLink, '_blank')}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:5,
        padding:'7px 12px', borderRadius:10, border:'none',
        background: h?'linear-gradient(135deg,#059669,#047857)':'linear-gradient(135deg,#10b981,#059669)',
        color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
        boxShadow:'0 3px 10px rgba(16,185,129,0.35)',
        transition:'all .15s ease',
      }}
    >
      🎥 JOIN MEET
    </button>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────────── */
export default function DoctorDashboard() {
  const { user } = useAuth()
  const toast    = useToast()
  const mounted  = useMounted()

  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const { data, mutate } = useSWR('/api/bookings?limit=20&status=confirmed', fetcher)
  const bookings = data?.bookings || []

  const greeting = mounted && now
    ? now.getHours()<12 ? 'Good morning' : now.getHours()<17 ? 'Good afternoon' : 'Good evening'
    : 'Hello'

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
    { title:"Today's Appointments", value:bookings.length,                                     icon:'📅', color:'blue'   },
    { title:'Online Consults',       value:bookings.filter((b)=>b.type==='online').length,      icon:'🎥', color:'green'  },
    { title:'Completed',             value:0,                                                   icon:'✅', color:'purple' },
    { title:'Pending',               value:bookings.length,                                     icon:'⏳', color:'orange' },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title={mounted ? `${greeting}, Dr. ${user?.name?.split(' ').pop()||''}` : 'Doctor Dashboard'}
        subtitle="Your dashboard overview"
      />

      {/* Stats */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
        gap:14, marginBottom:24,
      }}>
        {STATS.map((s) => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Schedule card */}
      <div style={{
        background:'#fff', borderRadius:20, border:'1px solid #f1f5f9',
        boxShadow:'0 2px 8px rgba(0,0,0,0.04)', overflow:'hidden',
      }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f8fafc' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>Today&apos;s Schedule</h3>
        </div>
        <div style={{ padding:16 }}>
          {!bookings.length ? (
            <div style={{ textAlign:'center', padding:'32px 16px' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📅</div>
              <p style={{ fontSize:13, color:'#94a3b8', margin:0 }}>No appointments for today</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {bookings.map((b) => (
                <AppRow
                  key={b.id}
                  b={b}
                  mounted={mounted}
                  now={now}
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