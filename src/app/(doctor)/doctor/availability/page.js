// C:\Users\ASUS\medli2\src\app\(doctor)\doctor\availability\page.js
'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const KF = `
  @keyframes av-in   { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes av-spin { to { transform: rotate(360deg) } }
`

const fetcher = async (url) => {
  const r = await fetch(url, { credentials: 'include' })
  const j = await r.json()
  if (!j.success) throw new Error(j.error || 'Failed to load')
  return j.data
}

function parseTimeToMinutes(value) {
  if (!value || !value.includes(':')) return 0
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

function calcSlots(startTime, endTime, slotDuration) {
  const diff = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)
  if (diff <= 0 || !slotDuration) return 0
  return Math.floor(diff / Number(slotDuration))
}

function formatTimeRange(start, end) {
  if (!start || !end) return 'Full day'
  return `${start} – ${end}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      year:    'numeric',
      month:   'short',
      day:     'numeric',
    })
  } catch {
    return dateStr
  }
}

/* ─── Toggle ─────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, color = '#6366f1' }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: checked
          ? `linear-gradient(135deg,${color},${color}aa)`
          : '#e2e8f0',
        border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background .2s ease',
        flexShrink: 0,
        boxShadow: checked ? `0 2px 8px ${color}55` : 'none',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', position: 'absolute',
        top: 2, left: checked ? 20 : 2,
        transition: 'left .2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}

/* ─── Time Input ─────────────────────────────────────────────────────── */
function TimeInput({ label, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{label}</label>
      <input
        type="time"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '8px 10px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 10, boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'all .15s ease',
        }}
      />
    </div>
  )
}

/* ─── Duration Select ────────────────────────────────────────────────── */
function DurationSelect({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Slot Duration</label>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '8px 10px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 10, boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          minWidth: 110,
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'all .15s ease',
        }}
      >
        {[10, 15, 20, 30, 45, 60].map((m) => (
          <option key={m} value={m}>{m} min</option>
        ))}
      </select>
    </div>
  )
}

/* ─── Save Button ────────────────────────────────────────────────────── */
function SaveBtn({ onClick, saving }) {
  const [h, setH] = useState(false)
  return (
    <button
      type="button" onClick={onClick} disabled={saving}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 18px', borderRadius: 12, border: 'none',
        background: saving
          ? '#cbd5e1'
          : h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
              : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: saving ? 'not-allowed' : 'pointer',
        boxShadow: saving
          ? 'none'
          : h ? '0 6px 20px rgba(99,102,241,0.45)'
              : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
      }}
    >
      {saving && (
        <span style={{
          width: 12, height: 12, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.45)', borderTopColor: '#fff',
          display: 'inline-block',
          animation: 'av-spin .7s linear infinite',
        }} />
      )}
      💾 {saving ? 'Saving...' : 'Save All'}
    </button>
  )
}

/* ─── Consult Type Button ────────────────────────────────────────────── */
function ConsultTypeBtn({ label, active, color, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      type="button" onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '10px 18px', borderRadius: 12,
        border: active ? `2px solid ${color}` : '2px solid #e2e8f0',
        background: active ? `${color}15` : h ? '#f8fafc' : '#fff',
        color: active ? color : '#64748b',
        fontSize: 13, fontWeight: active ? 600 : 500,
        cursor: 'pointer', transition: 'all .15s ease',
      }}
    >
      {active ? '✓ ' : ''}{label}
    </button>
  )
}

/* ─── Section Card ───────────────────────────────────────────────────── */
function SCard({ title, subtitle, children, style: sx }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid #f1f5f9',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      ...sx,
    }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   EXCEPTION ITEM CARD — Shows date, time range, reason
═══════════════════════════════════════════════════════════════════════ */
function ExceptionItem({ ex, onRemove }) {
  const [h, setH] = useState(false)
  const isFullDay = !ex.startTime || !ex.endTime
  const isPast    = new Date(ex.date) < new Date(new Date().toDateString())

  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 14px',
        background: isFullDay
          ? 'rgba(239,68,68,0.05)'
          : 'rgba(245,158,11,0.05)',
        borderRadius: 12,
        border: `1px solid ${isFullDay
          ? 'rgba(239,68,68,0.15)'
          : 'rgba(245,158,11,0.2)'}`,
        opacity: isPast ? 0.5 : 1,
        transition: 'all .15s ease',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: isFullDay
          ? 'rgba(239,68,68,0.1)'
          : 'rgba(245,158,11,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>
        {isFullDay ? '🚫' : '⏱'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0,
          }}>
            {formatDate(ex.date)}
          </p>
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '2px 8px', borderRadius: 100,
            background: isFullDay
              ? 'rgba(239,68,68,0.15)'
              : 'rgba(245,158,11,0.15)',
            color: isFullDay ? '#dc2626' : '#92400e',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {isFullDay ? 'Full Day Off' : 'Partial'}
          </span>
          {isPast && (
            <span style={{
              fontSize: 10, fontWeight: 600,
              padding: '2px 8px', borderRadius: 100,
              background: '#f1f5f9', color: '#64748b',
            }}>
              Past
            </span>
          )}
        </div>

        <p style={{
          fontSize: 12, color: '#475569', margin: '4px 0 0',
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 600 }}>
            🕐 {isFullDay ? 'Unavailable all day' : formatTimeRange(ex.startTime, ex.endTime)}
          </span>
          {ex.reason && (
            <>
              <span style={{ color: '#cbd5e1' }}>·</span>
              <span style={{ color: '#64748b' }}>{ex.reason}</span>
            </>
          )}
        </p>
      </div>

      {/* Remove button */}
      <button
        type="button" onClick={onRemove}
        style={{
          background: h ? 'rgba(239,68,68,0.1)' : 'transparent',
          border: 'none', cursor: 'pointer',
          borderRadius: 8, width: 30, height: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#ef4444',
          flexShrink: 0,
          transition: 'background .12s ease',
        }}
      >
        ✕
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   EXCEPTION INPUT FORM — Date + Optional Time Range + Reason
═══════════════════════════════════════════════════════════════════════ */
function ExceptionForm({ onAdd }) {
  const toast = useToast()
  const [date,      setDate]      = useState('')
  const [isFullDay, setIsFullDay] = useState(true)
  const [startTime, setStartTime] = useState('')
  const [endTime,   setEndTime]   = useState('')
  const [reason,    setReason]    = useState('')

  const handleAdd = () => {
    if (!date) {
      toast.error('Please select a date')
      return
    }

    /* ── Validate date isn't in the past ── */
    const selectedDate = new Date(date)
    const today        = new Date(new Date().toDateString())
    if (selectedDate < today) {
      toast.error('Cannot add exception for past dates')
      return
    }

    /* ── Validate time range if partial day ── */
    if (!isFullDay) {
      if (!startTime || !endTime) {
        toast.error('Please provide both start and end times')
        return
      }
      if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
        toast.error('End time must be after start time')
        return
      }
    }

    onAdd({
      date,
      startTime: isFullDay ? null : startTime,
      endTime:   isFullDay ? null : endTime,
      reason:    reason.trim() || null,
    })

    /* Reset form */
    setDate('')
    setStartTime('')
    setEndTime('')
    setReason('')
  }

  /* Min date = today (no past dates) */
  const minDate = new Date().toISOString().slice(0, 10)

  return (
    <div style={{
      background: '#f8fafc', borderRadius: 14,
      padding: 16, marginBottom: 16,
      border: '1px solid #f1f5f9',
    }}>
      {/* Date input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
          📅 Select Date <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', fontSize: 13,
            fontFamily: 'inherit', borderRadius: 10, boxSizing: 'border-box',
            border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#0f172a', outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Full day OR partial day toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', background: '#fff',
        borderRadius: 10, border: '1.5px solid #f1f5f9',
        marginBottom: 12,
      }}>
        <div>
          <p style={{
            fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0,
          }}>
            {isFullDay ? '🚫 Unavailable Full Day' : '⏱ Partial Day Off'}
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
            {isFullDay
              ? 'Toggle off to specify hours'
              : 'Toggle on to block the entire day'}
          </p>
        </div>
        <Toggle
          checked={isFullDay}
          onChange={setIsFullDay}
          color={isFullDay ? '#ef4444' : '#f59e0b'}
        />
      </div>

      {/* Time range — only show if not full day */}
      {!isFullDay && (
        <div style={{
          display: 'flex', gap: 10, marginBottom: 12,
          animation: 'av-in .2s ease',
        }}>
          <TimeInput
            label="Unavailable From *"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <TimeInput
            label="Unavailable Until *"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      )}

      {/* Reason input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
          📝 Reason (optional)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            isFullDay
              ? 'e.g., Personal leave, Conference, Holiday'
              : 'e.g., Surgery, Hospital meeting, Lunch break'
          }
          maxLength={100}
          style={{
            width: '100%', padding: '10px 12px', fontSize: 13,
            fontFamily: 'inherit', borderRadius: 10, boxSizing: 'border-box',
            border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#0f172a', outline: 'none',
          }}
        />
      </div>

      {/* Add button */}
      <AddExceptionBtn onClick={handleAdd} isFullDay={isFullDay} />

      {/* Helpful tip */}
      <p style={{
        fontSize: 11, color: '#94a3b8',
        margin: '10px 0 0', lineHeight: 1.5,
        display: 'flex', alignItems: 'flex-start', gap: 6,
      }}>
        <span style={{ flexShrink: 0 }}>💡</span>
        <span>
          {isFullDay
            ? 'Full-day exceptions block all appointments on the selected date.'
            : 'Partial exceptions block only the specified hours — patients can still book outside this range.'}
        </span>
      </p>
    </div>
  )
}

/* ─── Add Exception Button ───────────────────────────────────────────── */
function AddExceptionBtn({ onClick, isFullDay }) {
  const [h, setH] = useState(false)
  return (
    <button
      type="button" onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: '100%',
        padding: '11px', borderRadius: 12, border: 'none',
        background: h
          ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: 'pointer',
        boxShadow: h
          ? '0 6px 20px rgba(99,102,241,0.4)'
          : '0 3px 10px rgba(99,102,241,0.25)',
        transition: 'all .15s ease',
      }}
    >
      + Add {isFullDay ? 'Full Day' : 'Partial'} Exception
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════ */
export default function AvailabilityPage() {
  const toast = useToast()
  const { user } = useAuth()

  const {
    data:      doctorMe,
    isLoading: doctorLoading,
    error:     doctorError,
  } = useSWR(
    () => (user?.id ? `/api/doctors/by-user/${user.id}` : null),
    fetcher
  )

  const doctorId = doctorMe?.id

  const [slots, setSlots] = useState(
    DAYS.map((_, i) => ({
      dayOfWeek:    i,
      enabled:      i >= 1 && i <= 5,
      startTime:    '09:00',
      endTime:      '17:00',
      slotDuration: 10,
    }))
  )

  const [exceptions,   setExceptions]   = useState([])
  const [consultTypes, setConsultTypes] = useState({ offline: true, online: false })
  const [saving,       setSaving]       = useState(false)

  const { data, isLoading, mutate } = useSWR(
    () => (doctorId ? `/api/doctors/${doctorId}/availability` : null),
    fetcher
  )

  useEffect(() => {
    if (doctorError) {
      toast.error(doctorError.message || 'Failed to load doctor profile')
    }
  }, [doctorError, toast])

  useEffect(() => {
    if (!data) return

    const dbSlots        = data.availability       || []
    const dbExceptions   = data.exceptions         || []
    const dbConsultTypes = data.consultationTypes  || []

    setSlots(
      DAYS.map((_, i) => {
        const found = dbSlots.find((s) => Number(s.dayOfWeek) === i)
        return found
          ? {
              dayOfWeek:    i,
              enabled:      true,
              startTime:    found.startTime || '09:00',
              endTime:      found.endTime || '17:00',
              slotDuration: Number(found.slotDuration || 10),
            }
          : {
              dayOfWeek:    i,
              enabled:      false,
              startTime:    '09:00',
              endTime:      '17:00',
              slotDuration: 10,
            }
      })
    )

    setExceptions(
      dbExceptions.map((ex) => ({
        date:      new Date(ex.date).toISOString().slice(0, 10),
        startTime: ex.startTime || null,
        endTime:   ex.endTime   || null,
        reason:    ex.reason    || '',
        available: ex.available ?? false,
      }))
    )

    setConsultTypes({
      offline: dbConsultTypes.includes('offline'),
      online:  dbConsultTypes.includes('online'),
    })
  }, [data])

  const enabledCount = useMemo(
    () => slots.filter((s) => s.enabled).length,
    [slots]
  )

  /* ── Sorted exceptions: upcoming first, then past ── */
  const sortedExceptions = useMemo(() => {
    const today = new Date(new Date().toDateString())
    return [...exceptions].sort((a, b) => {
      const aDate = new Date(a.date)
      const bDate = new Date(b.date)
      const aPast = aDate < today
      const bPast = bDate < today
      if (aPast && !bPast) return 1
      if (!aPast && bPast) return -1
      return aDate - bDate
    })
  }, [exceptions])

  const toggleDay = (i) => {
    const next = [...slots]
    next[i] = { ...next[i], enabled: !next[i].enabled }
    setSlots(next)
  }

  const updateSlot = (i, f, v) => {
    const next = [...slots]
    next[i] = {
      ...next[i],
      [f]: f === 'slotDuration' ? Number(v) : v,
    }
    setSlots(next)
  }

  const addException = (newEx) => {
    /* ── Check for duplicate (same date + time) ── */
    const isDuplicate = exceptions.some((e) => {
      if (e.date !== newEx.date) return false
      /* Full-day duplicate */
      if (!newEx.startTime && !e.startTime) return true
      /* Same time-range */
      if (e.startTime === newEx.startTime && e.endTime === newEx.endTime) return true
      return false
    })

    if (isDuplicate) {
      toast.error('This exception already exists')
      return
    }

    setExceptions([
      ...exceptions,
      { ...newEx, available: false },
    ])
    toast.success(
      newEx.startTime
        ? `Added partial exception (${newEx.startTime}–${newEx.endTime})`
        : 'Added full-day exception'
    )
  }

  const save = async () => {
    if (!doctorId) {
      toast.error('Doctor profile not loaded')
      return
    }

    const invalidSlot = slots.find(
      (s) => s.enabled && parseTimeToMinutes(s.endTime) <= parseTimeToMinutes(s.startTime)
    )

    if (invalidSlot) {
      toast.error(`${DAYS[invalidSlot.dayOfWeek]} has invalid time range`)
      return
    }

    if (!consultTypes.offline && !consultTypes.online) {
      toast.error('Select at least one consultation type')
      return
    }

    const payload = {
      availability: slots
        .filter((s) => s.enabled)
        .map((s) => ({
          dayOfWeek:    s.dayOfWeek,
          startTime:    s.startTime,
          endTime:      s.endTime,
          slotDuration: Number(s.slotDuration),
        })),
      exceptions: exceptions.map((ex) => ({
        date:      new Date(`${ex.date}T00:00:00.000Z`).toISOString(),
        startTime: ex.startTime || null,
        endTime:   ex.endTime   || null,
        available: false,
        reason:    ex.reason || null,
      })),
      consultationTypes: [
        ...(consultTypes.offline ? ['offline'] : []),
        ...(consultTypes.online  ? ['online']  : []),
      ],
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/doctors/${doctorId}/availability`, {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(payload),
      })

      const json = await res.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to save availability')
      }

      await mutate()
      toast.success('✅ Availability updated')
    } catch (err) {
      toast.error(err.message || 'Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  /* ── Stats for exception card ── */
  const today        = new Date(new Date().toDateString())
  const upcomingExs  = exceptions.filter((e) => new Date(e.date) >= today)
  const fullDayExs   = upcomingExs.filter((e) => !e.startTime)
  const partialExs   = upcomingExs.filter((e) => e.startTime && e.endTime)

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title="Availability"
        subtitle={
          doctorLoading || isLoading
            ? 'Loading schedule...'
            : `${enabledCount} working day${enabledCount !== 1 ? 's' : ''} · ${upcomingExs.length} upcoming exception${upcomingExs.length !== 1 ? 's' : ''}`
        }
        actions={<SaveBtn onClick={save} saving={saving} />}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Consultation Types */}
        <SCard title="Consultation Types">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ConsultTypeBtn
              label="In-Person"
              active={consultTypes.offline}
              color="#6366f1"
              onClick={() => setConsultTypes({ ...consultTypes, offline: !consultTypes.offline })}
            />
            <ConsultTypeBtn
              label="Online (Video)"
              active={consultTypes.online}
              color="#10b981"
              onClick={() => setConsultTypes({ ...consultTypes, online: !consultTypes.online })}
            />
          </div>
        </SCard>

        {/* Weekly Schedule */}
        <SCard
          title="Weekly Schedule"
          subtitle="Set your regular working hours for each day of the week"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
            gap: 12,
          }}>
            {slots.map((slot, i) => (
              <DayCard
                key={i}
                slot={slot}
                dayName={DAYS[i]}
                onToggle={() => toggleDay(i)}
                onUpdate={(f, v) => updateSlot(i, f, v)}
              />
            ))}
          </div>
        </SCard>

        {/* ✅ Exception Dates WITH HOURS */}
        <SCard
          title="🗓️ Exception Dates & Hours"
          subtitle="Block specific dates (full day) or specific hours (partial) when you're unavailable"
        >
          {/* Stats row */}
          {(fullDayExs.length > 0 || partialExs.length > 0) && (
            <div style={{
              display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap',
            }}>
              {fullDayExs.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 100,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  fontSize: 12, fontWeight: 600, color: '#dc2626',
                }}>
                  🚫 {fullDayExs.length} full day{fullDayExs.length !== 1 ? 's' : ''}
                </div>
              )}
              {partialExs.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 100,
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  fontSize: 12, fontWeight: 600, color: '#92400e',
                }}>
                  ⏱ {partialExs.length} partial day{partialExs.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Exception form */}
          <ExceptionForm onAdd={addException} />

          {/* Exception list */}
          {!exceptions.length ? (
            <div style={{
              textAlign: 'center', padding: 28,
              background: '#f8fafc', borderRadius: 14,
              border: '1px dashed #e2e8f0',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <p style={{
                fontSize: 13, color: '#94a3b8', margin: 0,
              }}>
                No exceptions added yet
              </p>
              <p style={{
                fontSize: 11, color: '#cbd5e1', margin: '4px 0 0',
              }}>
                Add dates or hours when you'll be unavailable
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedExceptions.map((ex, i) => (
                <ExceptionItem
                  key={`${ex.date}-${ex.startTime || 'full'}-${i}`}
                  ex={ex}
                  onRemove={() =>
                    setExceptions(exceptions.filter((e) => e !== ex))
                  }
                />
              ))}
            </div>
          )}
        </SCard>
      </div>
    </>
  )
}

/* ─── Day Card (unchanged) ───────────────────────────────────────────── */
function DayCard({ slot, dayName, onToggle, onUpdate }) {
  const totalSlots = calcSlots(slot.startTime, slot.endTime, slot.slotDuration)

  return (
    <div style={{
      padding: 16, borderRadius: 14,
      background: slot.enabled ? '#fff' : '#f8fafc',
      border: `1.5px solid ${slot.enabled ? 'rgba(99,102,241,0.2)' : '#f1f5f9'}`,
      transition: 'all .2s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: slot.enabled ? 14 : 0,
      }}>
        <span style={{
          fontSize: 14, fontWeight: 600,
          color: slot.enabled ? '#1e293b' : '#94a3b8',
        }}>
          {dayName}
        </span>
        <Toggle checked={slot.enabled} onChange={onToggle} />
      </div>

      {slot.enabled && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <TimeInput
              label="Start"
              value={slot.startTime}
              onChange={(e) => onUpdate('startTime', e.target.value)}
            />
            <TimeInput
              label="End"
              value={slot.endTime}
              onChange={(e) => onUpdate('endTime', e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <DurationSelect
              value={slot.slotDuration}
              onChange={(e) => onUpdate('slotDuration', e.target.value)}
            />
          </div>

          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
            ~{totalSlots} slots ({slot.slotDuration} min each)
          </p>
        </div>
      )}
    </div>
  )
}