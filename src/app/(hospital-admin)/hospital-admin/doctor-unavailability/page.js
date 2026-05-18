'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import { useToast } from '@/context/ToastContext'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const KF = `
  @keyframes hu-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hu-spin { to { transform: rotate(360deg) } }
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

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTimeRange(start, end) {
  if (!start || !end) return 'Full day'
  return `${start} – ${end}`
}

function Toggle({ checked, onChange, color = '#6366f1' }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? `linear-gradient(135deg,${color},${color}aa)` : '#e2e8f0',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background .2s ease',
        flexShrink: 0,
        boxShadow: checked ? `0 2px 8px ${color}55` : 'none',
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

function SCard({ title, subtitle, children, style }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>{subtitle}</p>
        )}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

function SaveBtn({ onClick, saving, disabled }) {
  const [h, setH] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 18px',
        borderRadius: 12,
        border: 'none',
        background: saving || disabled
          ? '#cbd5e1'
          : h
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: saving || disabled ? 'not-allowed' : 'pointer',
        boxShadow: saving || disabled
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
            animation: 'hu-spin .7s linear infinite',
          }}
        />
      )}
      💾 {saving ? 'Saving...' : 'Save Unavailability'}
    </button>
  )
}

function ExceptionItem({ ex, onRemove }) {
  const [h, setH] = useState(false)
  const isFullDay = !ex.startTime || !ex.endTime
  const isPast = new Date(ex.date) < new Date(new Date().toDateString())

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
        background: isFullDay ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
        borderRadius: 12,
        border: `1px solid ${
          isFullDay ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.2)'
        }`,
        opacity: isPast ? 0.5 : 1,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: isFullDay ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {isFullDay ? '🚫' : '⏱'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {formatDate(ex.date)}
          </p>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 100,
              background: isFullDay ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
              color: isFullDay ? '#dc2626' : '#92400e',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {isFullDay ? 'Full Day Off' : 'Partial'}
          </span>
        </div>

        <p
          style={{
            fontSize: 12,
            color: '#475569',
            margin: '4px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
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

      <button
        type="button"
        onClick={onRemove}
        style={{
          background: h ? 'rgba(239,68,68,0.1)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: 8,
          width: 30,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: '#ef4444',
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}

function ExceptionForm({ onAdd }) {
  const toast = useToast()
  const [date, setDate] = useState('')
  const [isFullDay, setIsFullDay] = useState(true)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [reason, setReason] = useState('')

  const handleAdd = () => {
    if (!date) {
      toast.error('Please select a date')
      return
    }

    const selectedDate = new Date(date)
    const today = new Date(new Date().toDateString())
    if (selectedDate < today) {
      toast.error('Cannot add exception for past dates')
      return
    }

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
      endTime: isFullDay ? null : endTime,
      reason: reason.trim() || null,
    })

    setDate('')
    setStartTime('')
    setEndTime('')
    setReason('')
    setIsFullDay(true)
  }

  const minDate = new Date().toISOString().slice(0, 10)

  return (
    <div
      style={{
        background: '#f8fafc',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        border: '1px solid #f1f5f9',
      }}
    >
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
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            fontFamily: 'inherit',
            borderRadius: 10,
            boxSizing: 'border-box',
            border: '1.5px solid #e2e8f0',
            background: '#fff',
            color: '#0f172a',
            outline: 'none',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: '#fff',
          borderRadius: 10,
          border: '1.5px solid #f1f5f9',
          marginBottom: 12,
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>
            {isFullDay ? '🚫 Unavailable Full Day' : '⏱ Partial Day Off'}
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
            {isFullDay ? 'Toggle off to specify hours' : 'Toggle on to block the entire day'}
          </p>
        </div>
        <Toggle
          checked={isFullDay}
          onChange={setIsFullDay}
          color={isFullDay ? '#ef4444' : '#f59e0b'}
        />
      </div>

      {!isFullDay && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, animation: 'hu-in .2s ease' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
          📝 Reason (optional)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., OT, Meeting, Leave, Emergency"
          maxLength={100}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            fontFamily: 'inherit',
            borderRadius: 10,
            boxSizing: 'border-box',
            border: '1.5px solid #e2e8f0',
            background: '#fff',
            color: '#0f172a',
            outline: 'none',
          }}
        />
      </div>

      <button
        type="button"
        onClick={handleAdd}
        style={{
          width: '100%',
          padding: '11px',
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Add Exception
      </button>
    </div>
  )
}

export default function HospitalDoctorUnavailabilityPage() {
  const toast = useToast()
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [exceptions, setExceptions] = useState([])
  const [saving, setSaving] = useState(false)

  const { data: doctorsData, isLoading: doctorsLoading } = useSWR(
    '/api/doctors?mine=true&limit=100',
    fetcher
  )

  const doctors = doctorsData?.doctors || []

  const { data: availabilityData, isLoading: availabilityLoading, mutate } = useSWR(
    selectedDoctorId ? `/api/doctors/${selectedDoctorId}/availability` : null,
    fetcher
  )

  useEffect(() => {
    if (!selectedDoctorId) {
      setExceptions([])
      return
    }

    const dbExceptions = availabilityData?.exceptions || []
    setExceptions(
      dbExceptions.map((ex) => ({
        date: new Date(ex.date).toISOString().slice(0, 10),
        startTime: ex.startTime || null,
        endTime: ex.endTime || null,
        reason: ex.reason || '',
        available: ex.available ?? false,
      }))
    )
  }, [availabilityData, selectedDoctorId])

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId),
    [doctors, selectedDoctorId]
  )

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

  const addException = (newEx) => {
    const isDuplicate = exceptions.some((e) => {
      if (e.date !== newEx.date) return false
      if (!newEx.startTime && !e.startTime) return true
      if (e.startTime === newEx.startTime && e.endTime === newEx.endTime) return true
      return false
    })

    if (isDuplicate) {
      toast.error('This exception already exists')
      return
    }

    setExceptions((prev) => [...prev, { ...newEx, available: false }])
    toast.success('Exception added')
  }

  const save = async () => {
    if (!selectedDoctorId) {
      toast.error('Please select a doctor')
      return
    }

    setSaving(true)

    try {
      const payload = {
        availability: availabilityData?.availability || [],
        consultationTypes: availabilityData?.consultationTypes || [],
        exceptions: exceptions.map((ex) => ({
          date: new Date(`${ex.date}T00:00:00.000Z`).toISOString(),
          startTime: ex.startTime || null,
          endTime: ex.endTime || null,
          available: false,
          reason: ex.reason || null,
        })),
      }

      const res = await fetch(`/api/doctors/${selectedDoctorId}/availability`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to save unavailability')
      }

      await mutate()
      toast.success('Doctor unavailability updated')
    } catch (err) {
      toast.error(err.message || 'Failed to save unavailability')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Doctor Unavailability"
        subtitle={
          selectedDoctor
            ? `Manage exception dates and hours for ${selectedDoctor.name}`
            : 'Select a doctor and set unavailable days or hours'
        }
        breadcrumbs={[
          { label: 'Hospital Admin' },
          { label: 'Doctor Unavailability' },
        ]}
        actions={<SaveBtn onClick={save} saving={saving} disabled={!selectedDoctorId} />}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SCard
          title="Select Doctor"
          subtitle="Choose a doctor from your hospital to manage exception dates and hours"
        >
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1.5px solid #e2e8f0',
              background: '#fff',
              color: '#0f172a',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          >
            <option value="">
              {doctorsLoading ? 'Loading doctors...' : 'Select doctor'}
            </option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
                {doctor.specialization?.length ? ` — ${doctor.specialization.join(', ')}` : ''}
              </option>
            ))}
          </select>
        </SCard>

        <SCard
          title="Exception Dates & Hours"
          subtitle={
            selectedDoctor
              ? `Set full-day or partial-hour unavailability for ${selectedDoctor.name}`
              : 'Select a doctor first'
          }
        >
          {!selectedDoctorId ? (
            <div
              style={{
                textAlign: 'center',
                padding: 36,
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px dashed #e2e8f0',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>👨‍⚕️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: 0 }}>
                Select a doctor to manage unavailability
              </p>
            </div>
          ) : availabilityLoading ? (
            <div
              style={{
                textAlign: 'center',
                padding: 36,
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #f1f5f9',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '3px solid #cbd5e1',
                  borderTopColor: '#6366f1',
                  animation: 'hu-spin .7s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Loading doctor schedule...</p>
            </div>
          ) : (
            <>
              <ExceptionForm onAdd={addException} />

              {!exceptions.length ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 28,
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px dashed #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                    No exceptions added yet
                  </p>
                  <p style={{ fontSize: 11, color: '#cbd5e1', margin: '4px 0 0' }}>
                    Add dates or hours when this doctor will be unavailable
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sortedExceptions.map((ex, i) => (
                    <ExceptionItem
                      key={`${ex.date}-${ex.startTime || 'full'}-${i}`}
                      ex={ex}
                      onRemove={() =>
                        setExceptions((prev) => prev.filter((item) => item !== ex))
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </SCard>
      </div>
    </>
  )
}