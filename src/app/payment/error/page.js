'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const KF = `
  @keyframes perr-spin   { to{transform:rotate(360deg)} }
  @keyframes perr-spring { 0%{transform:scale(0)} 70%{transform:scale(1.08)} 100%{transform:scale(1)} }
  @keyframes perr-in     { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
`

function ActionBtn({ children, onClick, variant = 'primary' }) {
  const [h, setH] = useState(false)
  const V = {
    primary:   { base:'linear-gradient(135deg,#6366f1,#8b5cf6)', hov:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', shadow:'0 4px 14px rgba(99,102,241,0.3)' },
    secondary: { base:'#f1f5f9', hov:'#e2e8f0', color:'#475569', shadow:'none' },
    ghost:     { base:'transparent', hov:'rgba(0,0,0,0.04)', color:'#6366f1', shadow:'none' },
  }
  const s = V[variant]
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        padding:'12px', borderRadius:12, border:'none',
        background: h ? s.hov : s.base,
        color: s.color, fontSize:13, fontWeight:variant==='primary'?700:500,
        cursor:'pointer', boxShadow: s.shadow,
        transition:'all .18s ease',
      }}
    >
      {children}
    </button>
  )
}

export default function PaymentErrorPage() {
  const router = useRouter()
  const [visible, setVisible]   = useState(false)
  const [iconAnim, setIconAnim] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50)
    const t2 = setTimeout(() => setIconAnim(true), 150)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <>
      <style>{KF}</style>
      <div style={{
        minHeight:'100vh',
        background:'linear-gradient(135deg,#fff1f2 0%,#f8fafc 50%,#fef2f2 100%)',
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
          {/* Icon */}
          <div style={{
            width:80, height:80, borderRadius:'50%',
            background:'rgba(239,68,68,0.1)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 20px', fontSize:40,
            animation: iconAnim ? 'perr-spring .5s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
            transform: iconAnim ? undefined : 'scale(0)',
          }}>
            ⚠️
          </div>

          <h1 style={{ fontSize:'clamp(20px,4vw,26px)', fontWeight:800, color:'#0f172a', marginBottom:8 }}>
            Payment Error
          </h1>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:6 }}>
            Something went wrong while processing your payment.
          </p>
          <p style={{ fontSize:12, color:'#94a3b8', marginBottom:28, lineHeight:1.65 }}>
            Your booking has not been confirmed. No money has been deducted.
            If money was deducted, it will be refunded within 5-7 business days.
          </p>

          {/* Actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
            <ActionBtn onClick={() => router.back()} variant="primary">
              🔄 Try Again
            </ActionBtn>
            <ActionBtn onClick={() => router.push('/')} variant="secondary">
              🏠 Go to Home
            </ActionBtn>
            <ActionBtn onClick={() => router.push('/user/bookings')} variant="ghost">
              View My Bookings
            </ActionBtn>
          </div>

          <div style={{ paddingTop:16, borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>
              Need help?{' '}
              <a href="mailto:support@medli.in" style={{ color:'#6366f1', textDecoration:'none', fontWeight:600 }}>
                support@medli.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}