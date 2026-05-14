'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const KF = `
  @keyframes av-in { from{opacity:0;height:0} to{opacity:1;height:auto} }
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

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background .2s ease',
        flexShrink: 0,
        boxShadow: checked ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: checked ? 20 : 2,
          transition: 'left .2s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  )
}

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
          padding: '8px 10px',
          fontSize: 13,
          fontFamily: 'inherit',
          borderRadius: 10,
          boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff',
          color: '#0f172a',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'all .15s ease',
        }}
      />
    </div>
  )
}

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
          padding: '8px 10px',
          fontSize: 13,
          fontFamily: 'inherit',
          borderRadius: 10,
          boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff',
          color: '#0f172a',
          outline: 'none',
          minWidth: 110,
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'all .15s ease',
        }}
      >
        {[10, 15, 20, 30, 45, 60].map((m) => (
          <option key={m} value={m}>
            {m} min
          </option>
        ))}
      </select>
    </div>
  )
}

function SaveBtn({ onClick, saving }) {
  const [h, setH] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 18px',
        borderRadius: 12,
        border: 'none',
        background: saving
          ? '#cbd5e1'
          : h
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: saving ? 'not-allowed' : 'pointer',
        boxShadow: saving
          ? 'none'
          : h
            ? '0 6px 20px rgba(99,102,241,0.45)'
            : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
      }}
    >
      {saving && (
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.45)',
            borderTopColor: '#fff',
            display: 'inline-block',
            animation: 'av-spin .7s linear infinite',
          }}
        />
      )}
      💾 {saving ? 'Saving...' : 'Save All'}
    </button>
  )
}

function ConsultTypeBtn({ label, active, color, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '10px 18px',
        borderRadius: 12,
        border: active ? `2px solid ${color}` : '2px solid #e2e8f0',
        background: active ? `${color}15` : h ? '#f8fafc' : '#fff',
        color: active ? color : '#64748b',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        transition: 'all .15s ease',
      }}
    >
      {active ? '✓ ' : ''}
      {label}
    </button>
  )
}

function ExceptionItem({ ex, onRemove }) {
  const [h, setH] = useState(false)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'rgba(239,68,68,0.05)',
        borderRadius: 12,
        border: '1px solid rgba(239,68,68,0.15)',
      }}
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{ex.date}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{ex.reason || 'No reason'}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{
          background: h ? 'rgba(239,68,68,0.1)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: 8,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          transition: 'background .12s ease',
        }}
      >
        ✕
      </button>
    </div>
  )
}

function ExceptionInput({ type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type || 'text'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        flex: 1,
        padding: '10px 12px',
        fontSize: 13,
        fontFamily: 'inherit',
        borderRadius: 12,
        boxSizing: 'border-box',
        border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
        background: '#fff',
        color: '#0f172a',
        outline: 'none',
        boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
        transition: 'all .15s ease',
      }}
    />
  )
}

function AddBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '10px 16px',
        borderRadius: 12,
        border: 'none',
        background: h ? '#e2e8f0' : '#f1f5f9',
        color: '#475569',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all .15s ease',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      + Add
    </button>
  )
}

function SCard({ title, children, style: sx }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        ...sx,
      }}
    >
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

export default function AvailabilityPage() {
  const toast = useToast()
  const { user } = useAuth()

  const {
    data: doctorMe,
    isLoading: doctorLoading,
    error: doctorError,
  } = useSWR(
    () => (user?.id ? `/api/doctors/by-user/${user.id}` : null),
    fetcher
  )

  const doctorId = doctorMe?.id

  const [slots, setSlots] = useState(
    DAYS.map((_, i) => ({
      dayOfWeek: i,
      enabled: i >= 1 && i <= 5,
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 10,
    }))
  )
  const [exceptions, setExceptions] = useState([])
  const [newException, setNewException] = useState({ date: '', reason: '' })
  const [consultTypes, setConsultTypes] = useState({ offline: true, online: false })
  const [saving, setSaving] = useState(false)

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

    const dbSlots = data.availability || []
    const dbExceptions = data.exceptions || []
    const dbConsultTypes = data.consultationTypes || []

    setSlots(
      DAYS.map((_, i) => {
        const found = dbSlots.find((s) => Number(s.dayOfWeek) === i)
        return found
          ? {
              dayOfWeek: i,
              enabled: true,
              startTime: found.startTime || '09:00',
              endTime: found.endTime || '17:00',
              slotDuration: Number(found.slotDuration || 10),
            }
          : {
              dayOfWeek: i,
              enabled: false,
              startTime: '09:00',
              endTime: '17:00',
              slotDuration: 10,
            }
      })
    )

    setExceptions(
      dbExceptions.map((ex) => ({
        date: new Date(ex.date).toISOString().slice(0, 10),
        reason: ex.reason || '',
        available: ex.available ?? false,
      }))
    )

    setConsultTypes({
      offline: dbConsultTypes.includes('offline'),
      online: dbConsultTypes.includes('online'),
    })
  }, [data])

  const enabledCount = useMemo(() => slots.filter((s) => s.enabled).length, [slots])

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

  const addException = () => {
    if (!newException.date) {
      toast.error('Please select a date')
      return
    }

    const exists = exceptions.some((e) => e.date === newException.date)
    if (exists) {
      toast.error('Exception date already added')
      return
    }

    setExceptions([...exceptions, { ...newException, available: false }])
    setNewException({ date: '', reason: '' })
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
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: Number(s.slotDuration),
        })),
      exceptions: exceptions.map((ex) => ({
        date: new Date(`${ex.date}T00:00:00.000Z`).toISOString(),
        available: false,
        reason: ex.reason || null,
      })),
      consultationTypes: [
        ...(consultTypes.offline ? ['offline'] : []),
        ...(consultTypes.online ? ['online'] : []),
      ],
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/doctors/${doctorId}/availability`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to save availability')
      }

      await mutate()
      toast.success('Availability updated')
    } catch (err) {
      toast.error(err.message || 'Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title="Availability"
        subtitle={
          doctorLoading || isLoading
            ? 'Loading schedule...'
            : `${enabledCount} working day${enabledCount !== 1 ? 's' : ''} configured`
        }
        actions={<SaveBtn onClick={save} saving={saving} />}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

        <SCard title="Weekly Schedule">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
              gap: 12,
            }}
          >
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

        <SCard title="Exception Dates">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <ExceptionInput
              type="date"
              value={newException.date}
              onChange={(e) => setNewException({ ...newException, date: e.target.value })}
            />
            <ExceptionInput
              placeholder="Reason (optional)"
              value={newException.reason}
              onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
            />
            <AddBtn onClick={addException} />
          </div>

          {!exceptions.length ? (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No exceptions added</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {exceptions.map((ex, i) => (
                <ExceptionItem
                  key={i}
                  ex={ex}
                  onRemove={() => setExceptions(exceptions.filter((_, j) => j !== i))}
                />
              ))}
            </div>
          )}
        </SCard>
      </div>
    </>
  )
}

function DayCard({ slot, dayName, onToggle, onUpdate }) {
  const totalSlots = calcSlots(slot.startTime, slot.endTime, slot.slotDuration)

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 14,
        background: slot.enabled ? '#fff' : '#f8fafc',
        border: `1.5px solid ${slot.enabled ? 'rgba(99,102,241,0.2)' : '#f1f5f9'}`,
        transition: 'all .2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: slot.enabled ? 14 : 0,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: slot.enabled ? '#1e293b' : '#94a3b8',
          }}
        >
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