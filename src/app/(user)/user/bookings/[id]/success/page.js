'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data?.booking ?? j.data ?? null)

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const KF = `
  @keyframes suc-spin    { to{transform:rotate(360deg)} }
  @keyframes suc-spring  { 0%{transform:scale(0) rotate(-180deg)} 70%{transform:scale(1.12) rotate(6deg)} 100%{transform:scale(1) rotate(0)} }
  @keyframes suc-in      { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes suc-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`

const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'suc-shimmer 1.5s linear infinite',
}

function ActionBtn({ children, onClick, variant = 'primary' }) {
  const [h, setH] = useState(false)
  const V = {
    primary:   { base:'linear-gradient(135deg,#6366f1,#8b5cf6)', hov:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', shadow:'0 4px 14px rgba(99,102,241,0.3)' },
    secondary: { base:'#f1f5f9', hov:'#e2e8f0', color:'#475569', shadow:'none' },
    ghost:     { base:'transparent', hov:'rgba(0,0,0,0.04)', color:'#94a3b8', shadow:'none' },
  }
  const s = V[variant]

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '12px',
        borderRadius: 12,
        border: 'none',
        background: h ? s.hov : s.base,
        color: s.color,
        fontSize: 13,
        fontWeight: variant === 'primary' ? 700 : 500,
        cursor: 'pointer',
        boxShadow: s.shadow,
        transition: 'all .18s ease',
      }}
    >
      {children}
    </button>
  )
}

export default function BookingSuccessPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const mounted = useMounted()
  const [visible, setVisible] = useState(false)
  const [iconAnim, setIconAnim] = useState(false)

  const { data: booking } = useSWR(
    `/api/bookings/${id}`,
    fetcher,
    {
      refreshInterval: (data) => (data?.paymentStatus === 'paid' || data?.status === 'confirmed' ? 0 : 2000),
      revalidateOnFocus: true,
    }
  )

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50)
    const t2 = setTimeout(() => setIconAnim(true), 100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    if (!booking) return

    if (booking.paymentStatus === 'failed') {
      router.replace(`/user/bookings/${id}/failed`)
      return
    }

    if (
      booking.paymentStatus !== 'paid' &&
      booking.status !== 'confirmed'
    ) {
      if (booking.onePayTxnId) {
        const verify = async () => {
          try {
            await fetch(`/api/payments/verify/${booking.onePayTxnId}`, { credentials: 'include' })
          } catch {}
        }
        verify()
      }

      const t = setTimeout(() => {
        router.replace(`/user/bookings/${id}/pending`)
      }, 1500)

      return () => clearTimeout(t)
    }
  }, [booking, id, router])

  return (
    <>
      <style>{KF}</style>

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg,#f0fdf4 0%,#f8fafc 50%,#eff6ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: 'clamp(24px,5vw,40px)',
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity .4s ease, transform .4s ease',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 40,
                animation: iconAnim ? 'suc-spring .6s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
                transform: iconAnim ? undefined : 'scale(0)',
              }}
            >
              ✅
            </div>

            <h1 style={{ fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Booking Confirmed! 🎉
            </h1>

            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Your payment was successful and booking is confirmed.
            </p>
          </div>

          {booking ? (
            <div
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                animation: 'suc-in .3s ease .3s both',
              }}
            >
              {[
                ['Booking ID', booking.bookingId, true],
                ['Type', booking.type === 'lab' ? 'Lab Test' : booking.type === 'online' ? 'Online Consultation' : 'Hospital Visit', false],
                ...(booking.startTime && mounted ? [
                  ['📅 Date', new Date(booking.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' }), false],
                  ['⏰ Time', new Date(booking.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), false],
                ] : []),
              ].map(([k, v, mono]) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(16,185,129,0.1)',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#64748b' }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', fontFamily: mono ? 'monospace' : undefined }}>
                    {v}
                  </span>
                </div>
              ))}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  marginTop: 4,
                  borderTop: '1px solid rgba(16,185,129,0.2)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Amount Paid</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>
                  ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 20 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 14, borderRadius: 6, marginBottom: 10, ...SHIMMER }} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'suc-in .3s ease .5s both' }}>
            <ActionBtn variant="primary" onClick={() => router.push(`/user/bookings/${id}`)}>
              🧾 View Booking Details
            </ActionBtn>

            <ActionBtn variant="secondary" onClick={() => router.replace('/user/bookings?refresh=1')}>
              📋 View Bookings
            </ActionBtn>

            <ActionBtn variant="ghost" onClick={() => router.push('/')}>
              🏠 Back to Home
            </ActionBtn>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16 }}>
            Invoice will be sent to your registered email.
            You can also download it from booking details.
          </p>
        </div>
      </div>
    </>
  )
}