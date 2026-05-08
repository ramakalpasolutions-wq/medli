'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const KF = `
  @keyframes pend-spin { to{transform:rotate(360deg)} }
  @keyframes pend-in   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pend-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }
`

function ActionBtn({ children, onClick, disabled, variant = 'primary' }) {
  const [h, setH] = useState(false)
  const isDisabled = disabled
  const V = {
    primary:   { base:'linear-gradient(135deg,#6366f1,#8b5cf6)', hov:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', shadow:'0 4px 14px rgba(99,102,241,0.3)' },
    secondary: { base:'#f1f5f9', hov:'#e2e8f0', color:'#475569', shadow:'none' },
    ghost:     { base:'transparent', hov:'rgba(0,0,0,0.04)', color:'#94a3b8', shadow:'none' },
  }
  const s = V[variant]
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        padding:'12px', borderRadius:12, border:'none',
        background: isDisabled?'#e2e8f0':h?s.hov:s.base,
        color: isDisabled?'#94a3b8':s.color,
        fontSize:13, fontWeight:variant==='primary'?700:500,
        cursor:isDisabled?'not-allowed':'pointer',
        boxShadow:isDisabled?'none':s.shadow,
        transition:'all .18s ease', opacity:isDisabled?.7:1,
      }}
    >
      {children}
    </button>
  )
}

export default function BookingPendingPage({ params }) {
  const { id }   = use(params)
  const router   = useRouter()
  const [attempts, setAttempts] = useState(0)
  const [checking, setChecking] = useState(false)
  const [visible,  setVisible]  = useState(false)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Clock rotation animation
  useEffect(() => {
    const iv = setInterval(() => setRotation((r) => (r + 6) % 360), 50)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (attempts >= 12) return
    const timer = setTimeout(async () => {
      setChecking(true)
      try {
        const bRes  = await fetch(`/api/bookings/${id}`, { credentials:'include' })
        const bJson = await bRes.json()
        if (!bJson.success || !bJson.data) { setAttempts((a) => a+1); return }
        const b = bJson.data
        if (b.status==='confirmed'||b.paymentStatus==='paid') { router.replace(`/user/bookings/${id}/success`); return }
        if (b.paymentStatus==='failed') { router.replace(`/user/bookings/${id}/failed`); return }
        if (b.onePayTxnId) {
          await fetch(`/api/payments/verify/${b.onePayTxnId}`, { credentials:'include' })
          const rRes  = await fetch(`/api/bookings/${id}`, { credentials:'include' })
          const rJson = await rRes.json()
          if (rJson.success && rJson.data) {
            const r = rJson.data
            if (r.status==='confirmed'||r.paymentStatus==='paid') { router.replace(`/user/bookings/${id}/success`); return }
            if (r.paymentStatus==='failed') { router.replace(`/user/bookings/${id}/failed`); return }
          }
        }
        setAttempts((a) => a+1)
      } catch { setAttempts((a) => a+1) }
      finally { setChecking(false) }
    }, 5000)
    return () => clearTimeout(timer)
  }, [attempts, id, router])

  const handleManualCheck = async () => {
    setChecking(true)
    try {
      const bRes  = await fetch(`/api/bookings/${id}`, { credentials:'include' })
      const bJson = await bRes.json()
      if (!bJson.success || !bJson.data) { alert('Could not fetch booking.'); return }
      const b = bJson.data
      if (b.status==='confirmed'||b.paymentStatus==='paid') { router.replace(`/user/bookings/${id}/success`); return }
      if (b.paymentStatus==='failed') { router.replace(`/user/bookings/${id}/failed`); return }
      if (b.onePayTxnId) {
        await fetch(`/api/payments/verify/${b.onePayTxnId}`, { credentials:'include' })
        const rRes  = await fetch(`/api/bookings/${id}`, { credentials:'include' })
        const rJson = await rRes.json()
        if (rJson.success && rJson.data) {
          const r = rJson.data
          if (r.status==='confirmed'||r.paymentStatus==='paid') { router.replace(`/user/bookings/${id}/success`); return }
          if (r.paymentStatus==='failed') { router.replace(`/user/bookings/${id}/failed`); return }
        }
      }
      alert('Payment is still being processed. Please wait.')
    } catch { alert('Network error. Please try again.') }
    finally { setChecking(false) }
  }

  return (
    <>
      <style>{KF}</style>
      <div style={{
        minHeight:'100vh',
        background:'linear-gradient(135deg,#fffbeb 0%,#f8fafc 50%,#fef3c7 100%)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:16,
      }}>
        <div style={{
          background:'#fff', borderRadius:24,
          padding:'clamp(24px,5vw,40px)',
          maxWidth:440, width:'100%', textAlign:'center',
          boxShadow:'0 8px 40px rgba(0,0,0,0.1)',
          opacity: visible?1:0,
          transform: visible?'translateY(0)':'translateY(16px)',
          transition:'opacity .4s ease, transform .4s ease',
        }}>
          {/* Animated clock */}
          <div style={{
            width:80, height:80, borderRadius:'50%',
            background:'rgba(245,158,11,0.12)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 20px', fontSize:40,
            transform:`rotate(${rotation}deg)`,
            transition:'transform 0.05s linear',
          }}>
            🕐
          </div>

          <h1 style={{ fontSize:'clamp(20px,4vw,26px)', fontWeight:800, color:'#0f172a', marginBottom:8 }}>
            Payment Pending
          </h1>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:6 }}>
            Your payment is being processed by 1Pay.
          </p>
          <p style={{ fontSize:12, color:'#94a3b8', marginBottom:24 }}>
            This may take a few minutes. Please do not close or refresh this page.
          </p>

          {/* Status indicator */}
          {attempts < 12 ? (
            <div style={{
              background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)',
              borderRadius:14, padding:'10px 16px', marginBottom:20,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
              <span style={{
                width:16, height:16, borderRadius:'50%',
                border:'2px solid #6366f1', borderTopColor:'transparent',
                animation: checking ? 'pend-spin .8s linear infinite' : 'none',
                display:'inline-block', flexShrink:0,
                opacity: checking ? 1 : 0.4,
              }} />
              <span style={{ fontSize:13, color:'#6366f1', fontWeight:500 }}>
                {checking ? 'Checking payment status...' : `Auto-checking in a moment… (${attempts}/12)`}
              </span>
            </div>
          ) : (
            <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:14, padding:'10px 16px', marginBottom:20 }}>
              <p style={{ fontSize:13, color:'#92400e', margin:0 }}>
                Payment is taking longer than expected. Check your bookings in a few minutes.
              </p>
            </div>
          )}

          {/* Booking reference */}
          <div style={{ background:'#f8fafc', borderRadius:12, padding:'10px 14px', marginBottom:20 }}>
            <p style={{ fontSize:11, color:'#94a3b8', margin:'0 0 3px' }}>Booking Reference</p>
            <p style={{ fontSize:13, fontFamily:'monospace', fontWeight:700, color:'#475569', margin:0 }}>{id}</p>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <ActionBtn onClick={handleManualCheck} disabled={checking} variant="primary">
              {checking ? (
                <>
                  <span style={{ width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.5)',borderTopColor:'#fff',animation:'pend-spin .7s linear infinite',display:'inline-block' }} />
                  Checking...
                </>
              ) : '🔄 Check Payment Status'}
            </ActionBtn>
            <ActionBtn onClick={() => router.push('/user/bookings')} variant="secondary">
              My Bookings
            </ActionBtn>
            <ActionBtn onClick={() => router.push('/')} variant="ghost">
              🏠 Back to Home
            </ActionBtn>
          </div>

          <p style={{ fontSize:11, color:'#94a3b8', marginTop:20 }}>
            If money was deducted but booking not confirmed, contact{' '}
            <a href="mailto:support@medli.in" style={{ color:'#6366f1', textDecoration:'none', fontWeight:600 }}>
              support@medli.in
            </a>
          </p>
        </div>
      </div>
    </>
  )
}