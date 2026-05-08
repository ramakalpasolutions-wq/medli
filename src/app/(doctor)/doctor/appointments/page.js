'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes ap-spin { to{transform:rotate(360deg)} }
  @keyframes ap-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ap-slide{ from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes ap-fade { from{opacity:0} to{opacity:1} }
  @keyframes ap-shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`

const SHIMMER = {
  backgroundImage:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize:'200% 100%',
  animation:'ap-shimmer 1.5s linear infinite',
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
}

/* ─── Date pill ──────────────────────────────────────────────────────── */
function DatePill({ date, selected, isToday, onClick }) {
  const [h, setH] = useState(false)
  const labels = {
    weekday: date.toLocaleDateString('en-IN', { weekday:'short' }),
    day:     date.getDate(),
    month:   date.toLocaleDateString('en-IN', { month:'short' }),
  }
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        minWidth:56, padding:'8px 6px', borderRadius:12, border:'none',
        flexShrink:0, cursor:'pointer',
        background: selected
          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
          : isToday ? 'rgba(99,102,241,0.08)' : h?'#f1f5f9':'#f8fafc',
        border: selected ? 'none'
          : isToday ? '1.5px solid rgba(99,102,241,0.2)' : '1.5px solid transparent',
        color: selected ? '#fff' : isToday?'#6366f1':'#64748b',
        boxShadow: selected ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
        transition:'all .15s ease',
        minHeight:60,
      }}
    >
      <span style={{ fontSize:10, fontWeight:600, opacity: selected?0.85:0.7 }}>{labels.weekday}</span>
      <span style={{ fontSize:20, fontWeight:800, lineHeight:1.1 }}>{labels.day}</span>
      <span style={{ fontSize:10, opacity: selected?0.75:0.5 }}>{labels.month}</span>
    </button>
  )
}

/* ─── Filter pill ────────────────────────────────────────────────────── */
function FilterPill({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding:'5px 12px', borderRadius:100, border:'none',
        fontSize:12, fontWeight:500, cursor:'pointer', flexShrink:0,
        background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : h?'#e2e8f0':'#f1f5f9',
        color: active ? '#fff' : '#64748b',
        boxShadow: active ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
        transition:'all .15s ease',
      }}
    >
      {label}
    </button>
  )
}

/* ─── Appointment Card ───────────────────────────────────────────────── */
function ApptCard({ b, mounted, idx, onClick }) {
  const [h, setH] = useState(false)
  const now       = mounted ? new Date() : null
  const diffMins  = now ? (new Date(b.startTime) - now) / 60_000 : null
  const showJoin  = b.type==='online' && b.meetLink && diffMins!==null && diffMins<=15 && diffMins>=-30

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background:'#fff', borderRadius:16,
        border:`1.5px solid ${h?'#c7d2fe':'#f1f5f9'}`,
        padding:16, cursor:'pointer',
        boxShadow: h?'0 8px 24px rgba(0,0,0,0.08)':'0 1px 3px rgba(0,0,0,0.04)',
        transform: h?'translateY(-1px)':'translateY(0)',
        transition:'all .2s ease',
        animation:`ap-in .2s ease ${idx*0.04}s both`,
      }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
        <div>
          <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:'0 0 3px' }}>
            {b.userName || 'Patient'}
          </p>
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:11, fontFamily:'monospace', color:'#94a3b8' }}>{b.bookingId}</span>
            {mounted && (
              <>
                <span style={{ color:'#e2e8f0' }}>·</span>
                <span style={{ fontSize:11, color:'#94a3b8' }}>{formatTime(b.startTime)}</span>
              </>
            )}
          </div>
          <div style={{ display:'flex', gap:6, marginTop:6 }}>
            <Badge variant="info" size="sm">{b.type}</Badge>
            <Badge variant={getStatusVariant(b.status)} size="sm" dot>
              {b.status?.replace(/_/g,' ')}
            </Badge>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {mounted && showJoin && (
            <JoinBtn meetLink={b.meetLink} onClick={(e) => { e.stopPropagation(); window.open(b.meetLink,'_blank') }} />
          )}
        </div>
      </div>
    </div>
  )
}

function JoinBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:4,
        padding:'6px 12px', borderRadius:10, border:'none',
        background: h?'linear-gradient(135deg,#059669,#047857)':'linear-gradient(135deg,#10b981,#059669)',
        color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer',
        boxShadow:'0 2px 8px rgba(16,185,129,0.35)',
        transition:'all .15s ease', minHeight:32,
      }}
    >
      🎥 JOIN
    </button>
  )
}

/* ─── Detail Panel ───────────────────────────────────────────────────── */
function DetailPanel({ booking, mounted, onClose, onComplete, onNoShow }) {
  const [notes,     setNotes]     = useState(booking?.doctorNotes || '')
  const [notesFoc,  setNotesFoc]  = useState(false)
  const [saveHov,   setSaveHov]   = useState(false)

  useEffect(() => { setNotes(booking?.doctorNotes || '') }, [booking?.id])

  if (!booking) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, zIndex:900,
          background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)',
          animation:'ap-fade .2s ease',
        }}
      />
      {/* Panel */}
      <div style={{
        position:'fixed', right:0, top:0, bottom:0,
        width:'min(360px,90vw)',
        background:'#fff', zIndex:910,
        display:'flex', flexDirection:'column',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.12)',
        animation:'ap-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px', borderBottom:'1px solid #f1f5f9', flexShrink:0,
        }}>
          <div>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>
              {booking.userName || 'Patient'}
            </h3>
            <p style={{ fontSize:11, fontFamily:'monospace', color:'#94a3b8', margin:'2px 0 0' }}>
              {booking.bookingId}
            </p>
          </div>
          <CloseBtn onClick={onClose} />
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:16 }}>
          {/* Info rows */}
          <div style={{ background:'#f8fafc', borderRadius:12, padding:'4px 0', marginBottom:16 }}>
            {[
              ['Patient',  booking.userName  || 'Unknown'],
              ['Phone',    booking.userPhone || '—'],
              ['Type',     booking.type],
              ['Status',   booking.status?.replace(/_/g,' ')],
              ['Time',     mounted ? formatTime(booking.startTime) : '—'],
              ['Amount',   `₹${booking.totalAmount}`],
            ].map(([k,v]) => (
              <div key={k} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'9px 12px', borderBottom:'1px solid #f1f5f9',
              }}>
                <span style={{ fontSize:12, color:'#94a3b8' }}>{k}</span>
                <span style={{ fontSize:12, fontWeight:500, color:'#334155', textTransform:'capitalize' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:6 }}>
              Doctor Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={() => setNotesFoc(true)}
              onBlur={() => setNotesFoc(false)}
              rows={4}
              placeholder="Add consultation notes..."
              style={{
                width:'100%', padding:'10px 12px',
                fontSize:13, fontFamily:'inherit', borderRadius:12,
                border:`1.5px solid ${notesFoc?'#6366f1':'#e2e8f0'}`,
                background:'#fff', color:'#0f172a', outline:'none', resize:'none',
                boxShadow: notesFoc?'0 0 0 3px rgba(99,102,241,0.12)':'none',
                transition:'all .15s ease', boxSizing:'border-box',
              }}
            />
            <button
              onMouseEnter={() => setSaveHov(true)}
              onMouseLeave={() => setSaveHov(false)}
              style={{
                marginTop:8, padding:'8px 16px', borderRadius:10, border:'none',
                background: saveHov?'linear-gradient(135deg,#7c3aed,#6d28d9)':'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer',
                transition:'all .15s ease',
              }}
            >
              💾 Save Notes
            </button>
          </div>
        </div>

        {/* Footer actions */}
        {booking.status === 'confirmed' && (
          <div style={{
            padding:14, borderTop:'1px solid #f1f5f9',
            display:'flex', gap:10, flexShrink:0,
          }}>
            <PanelActionBtn variant="success" onClick={() => onComplete(booking.id)}>✓ Complete</PanelActionBtn>
            <PanelActionBtn variant="danger"  onClick={() => onNoShow(booking.id)}>✕ No-show</PanelActionBtn>
          </div>
        )}
      </div>
    </>
  )
}

function CloseBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width:32, height:32, borderRadius:8, border:'none', background:h?'#f1f5f9':'transparent', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', transition:'background .15s ease' }}>
      ✕
    </button>
  )
}

function PanelActionBtn({ children, onClick, variant }) {
  const [h, setH] = useState(false)
  const V = {
    success: { base:'linear-gradient(135deg,#6366f1,#8b5cf6)', hov:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff' },
    danger:  { base:'rgba(239,68,68,0.08)', hov:'rgba(239,68,68,0.14)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' },
  }
  const s = V[variant]
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        flex:1, padding:'11px', borderRadius:12, border:s.border||'none',
        background:h?s.hov:s.base, color:s.color, fontSize:13, fontWeight:600,
        cursor:'pointer', transition:'all .15s ease',
      }}>
      {children}
    </button>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function AppointmentsPage() {
  const toast   = useToast()
  const mounted = useMounted()

  const [selectedDate,    setSelectedDate]    = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [filter,          setFilter]          = useState('all')
  const [dates,           setDates]           = useState([])

  useEffect(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    const arr   = []
    for (let i=-3; i<=10; i++) {
      const d = new Date(today); d.setDate(d.getDate()+i); arr.push(d)
    }
    setDates(arr)
    setSelectedDate(today.toISOString().split('T')[0])
  }, [])

  const todayStr = mounted ? new Date().toISOString().split('T')[0] : ''

  const { data, mutate } = useSWR(
    selectedDate ? `/api/bookings?limit=50&dateFrom=${selectedDate}&dateTo=${selectedDate}` : null,
    fetcher
  )

  const bookings = (data?.bookings||[]).filter((b) => filter==='all' || b.type===filter)

  const updateStatus = async (id, status) => {
    try {
      const res  = await fetch(`/api/bookings/${id}/status`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        credentials:'include', body:JSON.stringify({status}),
      })
      const json = await res.json()
      json.success ? toast.success(`Marked ${status}`) : toast.error(json.error)
      mutate(); setSelectedBooking(null)
    } catch { toast.error('Failed to update status') }
  }

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Appointments" subtitle="Your appointment schedule" />

      {/* Date strip */}
      {mounted && dates.length > 0 ? (
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:16, scrollbarWidth:'none' }}>
          {dates.map((d) => {
            const ds = d.toISOString().split('T')[0]
            return (
              <DatePill
                key={ds}
                date={d}
                selected={ds===selectedDate}
                isToday={ds===todayStr}
                onClick={() => setSelectedDate(ds)}
              />
            )
          })}
        </div>
      ) : (
        <div style={{ display:'flex', gap:8, marginBottom:16, overflow:'hidden' }}>
          {[1,2,3,4,5,6,7].map((i) => (
            <div key={i} style={{ flexShrink:0, width:56, height:60, borderRadius:12, ...SHIMMER }} />
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {[{key:'all',label:'All'},{key:'hospital',label:'In-Person'},{key:'online',label:'Online'}].map((f) => (
          <FilterPill key={f.key} label={f.label} active={filter===f.key} onClick={() => setFilter(f.key)} />
        ))}
      </div>

      {/* Appointment list */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {!selectedDate ? (
          <EmptyState title="Loading…" />
        ) : !bookings.length ? (
          <EmptyState
            icon={<span style={{ fontSize:40 }}>📅</span>}
            title="No appointments"
            message="No appointments on this date"
          />
        ) : (
          bookings.map((b, i) => (
            <ApptCard
              key={b.id}
              b={b}
              mounted={mounted}
              idx={i}
              onClick={() => setSelectedBooking(b)}
            />
          ))
        )}
      </div>

      {/* Detail panel */}
      {selectedBooking && (
        <DetailPanel
          booking={selectedBooking}
          mounted={mounted}
          onClose={() => setSelectedBooking(null)}
          onComplete={(id) => updateStatus(id,'completed')}
          onNoShow={(id)   => updateStatus(id,'no_show')}
        />
      )}
    </>
  )
}