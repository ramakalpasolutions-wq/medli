'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  Video,
  Building2,
  UserRound,
  Award,
  Star,
  Clock3,
} from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import EmptyState from '@/components/ui/EmptyState'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function generateDates(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

const SLOT_STATUS = {
  green: { bg: 'rgba(16,185,129,0.1)', color: '#059669', label: 'Available' },
  yellow: { bg: 'rgba(245,158,11,0.1)', color: '#d97706', label: 'Filling Fast' },
  red: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', label: 'Almost Full' },
  grey: { bg: 'rgba(100,116,139,0.1)', color: '#64748b', label: 'Few Slots' },
}

function IconWrap({ children, active = false }) {
  return (
    <span
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active
          ? 'rgba(99,102,241,0.14)'
          : 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08))',
        color: active ? '#6366f1' : '#64748b',
      }}
    >
      {children}
    </span>
  )
}

function ConsultTypeBtn({ label, icon, fee, active, onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '14px 10px',
        borderRadius: 16,
        border: `2px solid ${active ? '#6366f1' : h ? '#e0e7ff' : '#e2e8f0'}`,
        background: active ? 'rgba(99,102,241,0.08)' : h ? 'rgba(99,102,241,0.03)' : '#fff',
        color: active ? '#6366f1' : '#64748b',
        cursor: 'pointer',
        transition: 'all .18s ease',
      }}
    >
      <IconWrap active={active}>{icon}</IconWrap>
      <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
      {fee > 0 && <span style={{ fontSize: 11, opacity: 0.8 }}>₹{fee}</span>}
    </button>
  )
}

function DateBtn({ date, active, onClick }) {
  const [h, setH] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const ds = date.toISOString().split('T')[0]
  const isToday = ds === today

  return (
    <button
      onClick={() => onClick(ds)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 52,
        padding: '8px 6px',
        borderRadius: 12,
        flexShrink: 0,
        border: `1.5px solid ${active ? '#6366f1' : isToday ? 'rgba(99,102,241,0.3)' : '#f1f5f9'}`,
        background: active
          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
          : isToday
            ? 'rgba(99,102,241,0.05)'
            : h
              ? '#f8fafc'
              : '#fff',
        color: active ? '#fff' : isToday ? '#6366f1' : '#334155',
        cursor: 'pointer',
        transition: 'all .15s ease',
        minHeight: 56,
        boxShadow: active ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 600, opacity: active ? 0.85 : 0.6 }}>
        {date.toLocaleDateString('en', { weekday: 'short' })}
      </span>
      <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
        {date.getDate()}
      </span>
      <span style={{ fontSize: 9, opacity: active ? 0.75 : 0.5 }}>
        {date.toLocaleDateString('en', { month: 'short' })}
      </span>
    </button>
  )
}

function SlotBtn({ slot, selected, onClick, onExpired, isOwner = false }) {
  const [h, setH] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!isOwner || slot.slotStatus !== 'occupied' || !slot.expiresAt) return

    const calc = () => {
      const secs = Math.max(0, Math.floor((new Date(slot.expiresAt) - new Date()) / 1000))
      setTimeLeft(secs)
      if (secs === 0) onExpired?.()
    }

    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [isOwner, slot.slotStatus, slot.expiresAt, onExpired])

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (slot.slotStatus === 'booked') {
    return (
      <div
        style={{
          padding: '8px 4px',
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 500,
          textAlign: 'center',
          border: '1.5px solid #f1f5f9',
          background: '#f8fafc',
          color: '#cbd5e1',
          cursor: 'not-allowed',
          textDecoration: 'line-through',
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {slot.startTime}
      </div>
    )
  }

  if (slot.slotStatus === 'occupied') {
    return (
      <div
        style={{
          padding: '6px 4px',
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 500,
          textAlign: 'center',
          border: '1.5px solid #fde68a',
          background: '#fffbeb',
          color: '#92400e',
          cursor: 'not-allowed',
          minHeight: 36,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <span style={{ fontWeight: 600 }}>{slot.startTime}</span>
        {isOwner ? (
          <>
            {timeLeft !== null && timeLeft > 0 && (
              <span style={{ fontSize: 9, color: '#b45309' }}>
                <Clock3 size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                {fmt(timeLeft)}
              </span>
            )}
            {timeLeft === 0 && (
              <span style={{ fontSize: 9, color: '#10b981', fontWeight: 600 }}>Free</span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 9, color: '#b45309' }}>Occupied</span>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => onClick(slot.startTime)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '8px 4px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 500,
        textAlign: 'center',
        border: `1.5px solid ${selected ? '#6366f1' : h ? '#c4b5fd' : '#e2e8f0'}`,
        background: selected
          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
          : h
            ? 'rgba(99,102,241,0.06)'
            : '#fff',
        color: selected ? '#fff' : '#334155',
        cursor: 'pointer',
        transition: 'all .15s ease',
        minHeight: 36,
        boxShadow: selected ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
      }}
    >
      {slot.startTime}
    </button>
  )
}

function StickyBookBar({ slot, date, consultType, fee, onBook }) {
  const [h, setH] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(!!slot), 50)
    return () => clearTimeout(t)
  }, [slot])

  if (!slot) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: 'rgba(255,255,255,0.97)',
        borderTop: '1px solid #f1f5f9',
        padding: '12px clamp(16px,3vw,32px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(20px)',
        transform: show ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .3s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <div>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Selected appointment</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '2px 0' }}>
          {date} · {slot} · {consultType}
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', margin: 0 }}>₹{fee || 0}</p>
      </div>

      <button
        onClick={onBook}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{
          padding: '12px 28px',
          borderRadius: 13,
          border: 'none',
          background: h
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: h ? '0 8px 24px rgba(99,102,241,0.5)' : '0 4px 14px rgba(99,102,241,0.35)',
          transition: 'all .18s ease',
          transform: h ? 'scale(1.02)' : 'scale(1)',
          flexShrink: 0,
        }}
      >
        Continue →
      </button>
    </div>
  )
}

export default function DoctorPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [consultType, setConsultType] = useState('offline')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const dates = generateDates()

  const { data: doctor } = useSWR(`/api/doctors/${id}`, fetcher)

  const { data: slotsData, isLoading: slotsLoading, mutate: mutateSlots } = useSWR(
    selectedDate ? `/api/doctors/${id}/slots?date=${selectedDate}` : null,
    fetcher,
    { refreshInterval: 60_000 }
  )

  const fee =
    consultType === 'online'
      ? doctor?.consultationFee?.online
      : doctor?.consultationFee?.offline

  const handleBook = () => {
    if (!selectedSlot) return
    router.push(`/user/bookings/new?doctorId=${id}&date=${selectedDate}&slot=${selectedSlot}&type=${consultType}`)
  }

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: selectedSlot ? 80 : 0 }}>
        <Navbar />

        <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(80px,10vw,96px) clamp(16px,3vw,32px) 40px' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: 24,
              border: '1.5px solid #f1f5f9',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {doctor?.avatar ? (
                <img src={doctor.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserRound size={38} color="#6366f1" strokeWidth={2.2} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 'clamp(16px,3vw,22px)', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Dr. {doctor?.name || '—'}
              </h1>

              <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', margin: '0 0 2px' }}>
                {(doctor?.specialization || []).join(', ')}
              </p>

              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>
                {(doctor?.qualifications || []).join(', ')}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {doctor?.experience && (
                  <span style={{ fontSize: 12, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Award size={14} color="#f59e0b" />
                    {doctor.experience} yrs exp
                  </span>
                )}

                {doctor?.rating?.average > 0 && (
                  <span style={{ fontSize: 12, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    {doctor.rating.average.toFixed(1)} ({doctor.rating.count} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <ConsultTypeBtn
              label="In-Person"
              icon={<Building2 size={20} strokeWidth={2.2} />}
              fee={doctor?.consultationFee?.offline}
              active={consultType === 'offline'}
              onClick={() => {
                setConsultType('offline')
                setSelectedSlot(null)
              }}
            />

            {doctor?.consultationFee?.online > 0 && (
              <ConsultTypeBtn
                label="Online Consultation"
                icon={<Video size={20} strokeWidth={2.2} />}
                fee={doctor?.consultationFee?.online}
                active={consultType === 'online'}
                onClick={() => {
                  setConsultType('online')
                  setSelectedSlot(null)
                }}
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 10,
              marginBottom: 20,
              scrollbarWidth: 'none',
            }}
          >
            {dates.map((d) => (
              <DateBtn
                key={d.toISOString()}
                date={d}
                active={d.toISOString().split('T')[0] === selectedDate}
                onClick={(ds) => {
                  setSelectedDate(ds)
                  setSelectedSlot(null)
                }}
              />
            ))}
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 20,
              border: '1.5px solid #f1f5f9',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
              Available Slots — {new Date(selectedDate).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            {slotsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: '2.5px solid #6366f1',
                    borderTopColor: 'transparent',
                    animation: 'spin .8s linear infinite',
                  }}
                />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <span style={{ fontSize: 13, color: '#6366f1' }}>Loading slots…</span>
              </div>
            ) : slotsData?.exception ? (
              <EmptyState title="Doctor unavailable" message={slotsData.reason} />
            ) : !slotsData?.hourBlocks?.length ? (
              <EmptyState title="No slots available" message="Try another date" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {slotsData.hourBlocks.map((block) => {
                  const status = SLOT_STATUS[block.availabilityColor] || SLOT_STATUS.grey

                  return (
                    <div key={block.hour}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                          {block.hourLabel}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 100,
                            background: status.bg,
                            color: status.color,
                          }}
                        >
                          {block.availabilityLabel}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill,minmax(72px,1fr))',
                          gap: 8,
                        }}
                      >
                        {block.slots.map((slot) => (
                          <SlotBtn
                            key={slot.startTime}
                            slot={slot}
                            selected={selectedSlot === slot.startTime}
                            onClick={(t) => setSelectedSlot(selectedSlot === t ? null : t)}
                            onExpired={() => mutateSlots()}
                            isOwner={slot.isOwner}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <StickyBookBar
          slot={selectedSlot}
          date={selectedDate}
          consultType={consultType}
          fee={fee}
          onBook={handleBook}
        />

        <Footer />
      </div>
    </>
  )
}