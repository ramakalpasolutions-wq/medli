'use client'

import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `
  @keyframes ap-spin    { to { transform: rotate(360deg) } }
  @keyframes ap-in      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ap-slide   { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes ap-fade    { from{opacity:0} to{opacity:1} }
  @keyframes ap-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`
const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%', animation: 'ap-shimmer 1.5s linear infinite',
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']

/* ─── View Toggle ────────────────────────────────────────────────────── */
function ViewToggle({ view, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3, background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
      {[
        { key: 'strip',    label: '▤ Strip'   },
        { key: 'calendar', label: '📅 Month'  },
        { key: 'list',     label: '☰ List'    },
      ].map((v) => (
        <button
          key={v.key}
          onClick={() => onChange(v.key)}
          style={{
            padding: '6px 12px', borderRadius: 7, border: 'none',
            fontSize: 12, fontWeight: view === v.key ? 600 : 500, cursor: 'pointer',
            background: view === v.key ? '#fff' : 'transparent',
            color: view === v.key ? '#0f172a' : '#64748b',
            boxShadow: view === v.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all .15s ease',
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

/* ─── Strip View (horizontal date scroll) ───────────────────────────── */
function StripView({ selectedDate, setSelectedDate, todayStr, dates }) {
  return (
    <div style={{
      display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8,
      marginBottom: 16, scrollbarWidth: 'none',
    }}>
      {dates.map((d) => {
        const ds       = toDateStr(d)
        const selected = ds === selectedDate
        const isToday  = ds === todayStr
        const [h, setH] = [false, () => {}] // simplified for strip

        return (
          <button
            key={ds}
            onClick={() => setSelectedDate(ds)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minWidth: 56, padding: '8px 6px', borderRadius: 12,
              border: selected ? 'none'
                : isToday ? '1.5px solid rgba(99,102,241,0.2)' : '1.5px solid transparent',
              flexShrink: 0, cursor: 'pointer', minHeight: 60,
              background: selected
                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                : isToday ? 'rgba(99,102,241,0.08)' : '#f8fafc',
              color: selected ? '#fff' : isToday ? '#6366f1' : '#64748b',
              boxShadow: selected ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
              transition: 'all .15s ease',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, opacity: selected ? 0.85 : 0.7 }}>
              {d.toLocaleDateString('en-IN', { weekday: 'short' })}
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>
              {d.getDate()}
            </span>
            <span style={{ fontSize: 10, opacity: selected ? 0.75 : 0.5 }}>
              {d.toLocaleDateString('en-IN', { month: 'short' })}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Month Calendar View ────────────────────────────────────────────── */
function MonthCalendar({ selectedDate, setSelectedDate, calendarMonth, setCalendarMonth, bookingDates }) {
  const year  = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const today = toDateStr(new Date())

  // Build calendar grid
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  // Pad start
  for (let i = 0; i < firstDay; i++) {
    const prevDate = new Date(year, month, -(firstDay - 1 - i))
    cells.push({ date: prevDate, current: false })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true })
  }
  // Pad end to complete 6 rows
  let padEnd = 42 - cells.length
  for (let d = 1; d <= padEnd; d++) {
    cells.push({ date: new Date(year, month + 1, d), current: false })
  }

  const prevMonth = () => setCalendarMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCalendarMonth(new Date(year, month + 1, 1))

  return (
    <div style={{
      background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: 16,
    }}>
      {/* Month header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid #f8fafc',
      }}>
        <button
          onClick={prevMonth}
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: '#f8fafc', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b', transition: 'background .13s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
        >
          ‹
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {MONTHS[month]}
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{year}</p>
        </div>

        <button
          onClick={nextMonth}
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: '#f8fafc', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b', transition: 'background .13s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '8px 12px 4px',
      }}>
        {WEEKDAYS.map((wd) => (
          <div key={wd} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700,
            color: '#94a3b8', padding: '4px 0',
          }}>
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2, padding: '0 12px 12px',
      }}>
        {cells.map(({ date, current }, i) => {
          const ds        = toDateStr(date)
          const isSelected = ds === selectedDate
          const isToday   = ds === today
          const count     = bookingDates[ds] || 0
          const hasBkg    = count > 0

          return (
            <button
              key={i}
              onClick={() => { if (current) setSelectedDate(ds) }}
              style={{
                position: 'relative',
                height: 52, borderRadius: 10, border: 'none',
                cursor: current ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 2,
                background: isSelected
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : isToday ? 'rgba(99,102,241,0.08)' : 'transparent',
                color: isSelected ? '#fff'
                  : !current ? '#d1d5db'
                  : isToday ? '#6366f1' : '#1e293b',
                fontWeight: isSelected || isToday ? 700 : 400,
                boxShadow: isSelected ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                transition: 'all .15s ease',
                outline: isToday && !isSelected ? '1.5px solid rgba(99,102,241,0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (current && !isSelected) e.currentTarget.style.background = '#f1f5f9'
              }}
              onMouseLeave={(e) => {
                if (current && !isSelected) {
                  e.currentTarget.style.background = isToday ? 'rgba(99,102,241,0.08)' : 'transparent'
                }
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{date.getDate()}</span>

              {/* Booking dots */}
              {hasBkg && current && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: Math.min(count, 3) }).map((_, di) => (
                    <div key={di} style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: isSelected ? 'rgba(255,255,255,0.8)' : '#6366f1',
                    }} />
                  ))}
                  {count > 3 && (
                    <span style={{
                      fontSize: 8, fontWeight: 700, lineHeight: 1,
                      color: isSelected ? 'rgba(255,255,255,0.8)' : '#6366f1',
                    }}>
                      +{count - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        padding: '8px 20px 12px',
        display: 'flex', gap: 16, flexWrap: 'wrap',
        borderTop: '1px solid #f8fafc',
      }}>
        {[
          { color: '#6366f1', label: 'Selected' },
          { color: 'rgba(99,102,241,0.3)', label: 'Today' },
          { color: '#6366f1', label: 'Has bookings (dots)' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── List View (all upcoming) ───────────────────────────────────────── */
function ListView({ bookings, mounted, onSelect }) {
  // Group by date
  const grouped = useMemo(() => {
    const g = {}
    bookings.forEach((b) => {
      const d = toDateStr(new Date(b.startTime))
      if (!g[d]) g[d] = []
      g[d].push(b)
    })
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b))
  }, [bookings])

  if (!bookings.length) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: 0 }}>
          No upcoming appointments
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {grouped.map(([dateStr, dayBookings]) => {
        const date    = new Date(dateStr)
        const today   = toDateStr(new Date())
        const isToday = dateStr === today
        return (
          <div key={dateStr}>
            {/* Date header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
            }}>
              <div style={{
                background: isToday
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : '#f1f5f9',
                color: isToday ? '#fff' : '#64748b',
                borderRadius: 10, padding: '4px 12px',
                fontSize: 12, fontWeight: 700,
                boxShadow: isToday ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
              }}>
                {isToday ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                {dayBookings.length} appointment{dayBookings.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Bookings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayBookings.map((b, i) => (
                <ApptCard key={b.id} b={b} mounted={mounted} idx={i} onClick={() => onSelect(b)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Join Button ────────────────────────────────────────────────────── */
function JoinBtn({ meetLink, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '6px 12px', borderRadius: 10, border: 'none',
        background: h
          ? 'linear-gradient(135deg,#059669,#047857)'
          : 'linear-gradient(135deg,#10b981,#059669)',
        color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
        transition: 'all .15s ease', minHeight: 32,
      }}
    >
      🎥 JOIN
    </button>
  )
}

/* ─── Appointment Card ───────────────────────────────────────────────── */
function ApptCard({ b, mounted, idx, onClick }) {
  const [h, setH] = useState(false)
  const now      = mounted ? new Date() : null
  const diffMins = now ? (new Date(b.startTime) - now) / 60_000 : null
  const showJoin = b.type === 'online' && b.meetLink &&
                   diffMins !== null && diffMins <= 15 && diffMins >= -30

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: '#fff', borderRadius: 14,
        border: `1.5px solid ${h ? '#c7d2fe' : '#f1f5f9'}`,
        padding: '12px 16px', cursor: 'pointer',
        boxShadow: h ? '0 8px 24px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: h ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all .2s ease',
        animation: `ap-in .2s ease ${idx * 0.04}s both`,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              {b.userName || 'Patient'}
            </p>
            {mounted && (
              <span style={{
                fontSize: 11, color: '#6366f1', fontWeight: 700,
                background: 'rgba(99,102,241,0.08)', borderRadius: 100,
                padding: '2px 8px', border: '1px solid rgba(99,102,241,0.15)',
              }}>
                {formatTime(b.startTime)}
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
            {b.bookingId}
          </span>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge variant={b.type === 'online' ? 'purple' : 'info'} size="sm">{b.type}</Badge>
            <Badge variant={getStatusVariant(b.status)} size="sm" dot>
              {b.status?.replace(/_/g, ' ')}
            </Badge>
            {b.totalAmount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#16a34a',
                background: '#f0fdf4', borderRadius: 100, padding: '2px 7px',
                border: '1px solid #bbf7d0',
              }}>
                ₹{Number(b.totalAmount).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
        {mounted && showJoin && (
          <JoinBtn
            meetLink={b.meetLink}
            onClick={(e) => { e.stopPropagation(); window.open(b.meetLink, '_blank') }}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Filter Pill ────────────────────────────────────────────────────── */
function FilterPill({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 12px', borderRadius: 100, border: 'none',
        fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0,
        background: active
          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
          : h ? '#e2e8f0' : '#f1f5f9',
        color: active ? '#fff' : '#64748b',
        boxShadow: active ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      {label}
    </button>
  )
}

/* ─── Detail Panel ───────────────────────────────────────────────────── */
function DetailPanel({ booking: bk, mounted, onClose, onComplete, onNoShow }) {
  const toast = useToast()
  const [notes,    setNotes]    = useState(bk?.doctorNotes || '')
  const [notesFoc, setNotesFoc] = useState(false)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { setNotes(bk?.doctorNotes || '') }, [bk?.id])

  const saveNotes = async () => {
    if (!bk?.id) return
    setSaving(true)
    try {
      const res  = await fetch(`/api/bookings/${bk.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ doctorNotes: notes }),
      })
      const json = await res.json()
      json.success ? toast.success('Notes saved') : toast.error(json.error || 'Failed')
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  if (!bk) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          animation: 'ap-fade .2s ease',
        }}
      />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 'min(380px, 92vw)',
        background: '#fff', zIndex: 910,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        animation: 'ap-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
          background: 'linear-gradient(135deg,rgba(99,102,241,0.04),rgba(139,92,246,0.02))',
        }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {bk.userName || 'Patient'}
            </h3>
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', margin: '2px 0 0' }}>
              {bk.bookingId}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: '#f1f5f9', cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', flexShrink: 0, transition: 'background .13s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {/* Status banner */}
          <div style={{
            padding: '10px 14px', borderRadius: 12, marginBottom: 14,
            background: bk.status === 'confirmed' ? '#eff6ff'
              : bk.status === 'completed' ? '#f0fdf4' : '#fff1f2',
            border: `1px solid ${bk.status === 'confirmed' ? '#bfdbfe'
              : bk.status === 'completed' ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>
              {bk.status === 'confirmed' ? '⏳' : bk.status === 'completed' ? '✅' : '❌'}
            </span>
            <div>
              <Badge variant={getStatusVariant(bk.status)} size="sm" dot>
                {bk.status?.replace(/_/g, ' ')}
              </Badge>
              {mounted && bk.startTime && (
                <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0' }}>
                  {new Date(bk.startTime).toLocaleDateString('en-IN', { dateStyle: 'long' })} at {formatTime(bk.startTime)}
                </p>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '4px 0', marginBottom: 14 }}>
            {[
              ['Patient',  bk.userName     || 'Unknown'],
              ['Phone',    bk.userPhone    || '—'],
              ['Type',     bk.type],
              ['Amount',   `₹${Number(bk.totalAmount || 0).toLocaleString('en-IN')}`],
              ['Payment',  bk.paymentStatus?.replace(/_/g, ' ') || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 12px', borderBottom: '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#334155', textTransform: 'capitalize' }}>
                  {v}
                </span>
              </div>
            ))}
          </div>

          {/* Meet link */}
          {bk.meetLink && bk.type === 'online' && (
            <a
              href={bk.meetLink}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px', borderRadius: 12, marginBottom: 14,
                background: 'linear-gradient(135deg,#10b981,#059669)',
                color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13,
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              }}
            >
              🎥 Join Meet Link
            </a>
          )}

          {/* Doctor Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
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
                width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
                borderRadius: 12, border: `1.5px solid ${notesFoc ? '#6366f1' : '#e2e8f0'}`,
                background: '#fff', color: '#0f172a', outline: 'none', resize: 'none',
                boxShadow: notesFoc ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                transition: 'all .15s ease', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              style={{
                marginTop: 8, padding: '8px 16px', borderRadius: 10, border: 'none',
                background: saving ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: saving ? '#94a3b8' : '#fff',
                fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all .15s ease',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {saving && (
                <span style={{
                  width: 12, height: 12, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                  animation: 'ap-spin .7s linear infinite', display: 'inline-block',
                }} />
              )}
              💾 Save Notes
            </button>
          </div>
        </div>

        {/* Footer actions */}
        {bk.status === 'confirmed' && (
          <div style={{
            padding: 14, borderTop: '1px solid #f1f5f9',
            display: 'flex', gap: 10, flexShrink: 0,
          }}>
            <button
              onClick={() => onComplete(bk.id)}
              style={{
                flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ✓ Complete
            </button>
            <button
              onClick={() => onNoShow(bk.id)}
              style={{
                flex: 1, padding: '11px', borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ✕ No-show
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function AppointmentsPage() {
  const toast   = useToast()
  const mounted = useMounted()

  const [view,            setView]           = useState('calendar')  // 'strip' | 'calendar' | 'list'
  const [selectedDate,    setSelectedDate]   = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [filter,          setFilter]         = useState('all')
  const [dates,           setDates]          = useState([])

  // Calendar month state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d
  })

  useEffect(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const arr   = []
    for (let i = -3; i <= 21; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i); arr.push(d)
    }
    setDates(arr)
    setSelectedDate(toDateStr(today))
  }, [])

  const todayStr = mounted ? toDateStr(new Date()) : ''

  // For strip/calendar/day views: fetch selected date
  const { data: dayData, isLoading: dayLoading, mutate: dayMutate } = useSWR(
    selectedDate && view !== 'list'
      ? `/api/bookings?limit=50&dateFrom=${selectedDate}&dateTo=${selectedDate}`
      : null,
    fetcher
  )

  // For calendar: fetch whole month to show dots
  const monthFrom = toDateStr(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1))
  const monthTo   = toDateStr(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0))
  const { data: monthData } = useSWR(
    view === 'calendar'
      ? `/api/bookings?limit=200&dateFrom=${monthFrom}&dateTo=${monthTo}`
      : null,
    fetcher
  )

  // For list view: fetch upcoming 30 days
  const listFrom = todayStr
  const listTo   = toDateStr(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  const { data: listData, isLoading: listLoading, mutate: listMutate } = useSWR(
    view === 'list'
      ? `/api/bookings?limit=200&dateFrom=${listFrom}&dateTo=${listTo}`
      : null,
    fetcher
  )

  // Build booking date → count map for calendar dots
  const bookingDates = useMemo(() => {
    const map = {}
    ;(monthData?.bookings || []).forEach((b) => {
      const d = toDateStr(new Date(b.startTime))
      map[d] = (map[d] || 0) + 1
    })
    return map
  }, [monthData])

  // Day bookings (strip / calendar day view)
  const dayBookings = dayData?.bookings || []
  const filtered    = filter === 'all' ? dayBookings : dayBookings.filter((b) => b.type === filter)

  // List bookings
  const listBookings = useMemo(() => {
    const all = listData?.bookings || []
    return filter === 'all' ? all : all.filter((b) => b.type === filter)
  }, [listData, filter])

  const mutate = () => { dayMutate(); listMutate() }

  const updateStatus = async (id, status) => {
    try {
      const res  = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ status }),
      })
      const json = await res.json()
      json.success
        ? toast.success(`Marked ${status.replace('_', ' ')}`)
        : toast.error(json.error)
      mutate()
      setSelectedBooking(null)
    } catch { toast.error('Failed to update status') }
  }

  const totalShown = view === 'list' ? listBookings.length : filtered.length

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Appointments"
        subtitle={view === 'list'
          ? `${totalShown} upcoming appointment${totalShown !== 1 ? 's' : ''}`
          : selectedDate
            ? `${filtered.length} appointment${filtered.length !== 1 ? 's' : ''} · ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { dateStyle: 'medium' })}`
            : 'Your appointment schedule'
        }
        breadcrumbs={[{ label: 'Doctor', href: '/doctor/dashboard' }, { label: 'Appointments' }]}
        actions={<ViewToggle view={view} onChange={setView} />}
      />

      {/* ── Filter Pills ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'all',      label: 'All'       },
          { key: 'hospital', label: '🏥 In-Person' },
          { key: 'online',   label: '🎥 Online'    },
        ].map((f) => (
          <FilterPill
            key={f.key} label={f.label}
            active={filter === f.key}
            onClick={() => setFilter(f.key)}
          />
        ))}
        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>
          {totalShown} shown
        </span>
      </div>

      {/* ── STRIP VIEW ── */}
      {view === 'strip' && (
        <>
          {mounted && dates.length > 0 ? (
            <StripView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              todayStr={todayStr}
              dates={dates}
            />
          ) : (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflow: 'hidden' }}>
              {[1,2,3,4,5,6,7].map((i) => (
                <div key={i} style={{ flexShrink: 0, width: 56, height: 60, borderRadius: 12, ...SHIMMER }} />
              ))}
            </div>
          )}
          <DayList bookings={filtered} isLoading={dayLoading} mounted={mounted} onSelect={setSelectedBooking} filter={filter} />
        </>
      )}

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
        <>
          <MonthCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            calendarMonth={calendarMonth}
            setCalendarMonth={setCalendarMonth}
            bookingDates={bookingDates}
          />
          {/* Selected day bookings below calendar */}
          {selectedDate && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
              }}>
                <div style={{
                  background: selectedDate === todayStr
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f1f5f9',
                  color: selectedDate === todayStr ? '#fff' : '#64748b',
                  borderRadius: 10, padding: '4px 12px',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {selectedDate === todayStr
                    ? 'Today'
                    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
                  }
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {filtered.length} appointment{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>
              <DayList bookings={filtered} isLoading={dayLoading} mounted={mounted} onSelect={setSelectedBooking} filter={filter} />
            </div>
          )}
        </>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        listLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 90, borderRadius: 14, ...SHIMMER }} />
            ))}
          </div>
        ) : (
          <ListView bookings={listBookings} mounted={mounted} onSelect={setSelectedBooking} />
        )
      )}

      {/* ── Detail Panel ── */}
      {selectedBooking && (
        <DetailPanel
          booking={selectedBooking}
          mounted={mounted}
          onClose={() => setSelectedBooking(null)}
          onComplete={(id) => updateStatus(id, 'completed')}
          onNoShow={(id)   => updateStatus(id, 'no_show')}
        />
      )}
    </>
  )
}

/* ─── Day appointment list (shared by strip + calendar) ──────────────── */
function DayList({ bookings, isLoading, mounted, onSelect, filter }) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 90, borderRadius: 14, backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'ap-shimmer 1.5s linear infinite' }} />
        ))}
      </div>
    )
  }

  if (!bookings.length) {
    return (
      <div style={{ textAlign: 'center', padding: '36px 16px' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', margin: 0 }}>
          No {filter !== 'all' ? filter : ''} appointments on this date
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {bookings.map((b, i) => (
        <ApptCard key={b.id} b={b} mounted={mounted} idx={i} onClick={() => onSelect(b)} />
      ))}
    </div>
  )
}