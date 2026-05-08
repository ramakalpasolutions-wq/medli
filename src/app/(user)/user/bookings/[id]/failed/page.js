'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const KF = `
  @keyframes fail-spring { 0%{transform:scale(0)} 70%{transform:scale(1.1)} 100%{transform:scale(1)} }
  @keyframes fail-spin   { to{transform:rotate(360deg)} }
  @keyframes fail-in     { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
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

export default function BookingFailedPage({ params }) {
  const { id }   = use(params)
  const router   = useRouter()
  const [retrying, setRetrying] = useState(false)
  const [visible,  setVisible]  = useState(false)
  const [iconAnim, setIconAnim] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50)
    const t2 = setTimeout(() => setIconAnim(true), 150)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleRetry = async () => {
    setRetrying(true)
    try {
      const res  = await fetch('/api/payments/create-order', {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify({ bookingId:id }),
      })
      const json = await res.json()
      if (!json.success) { alert(json.error||'Failed to retry payment'); setRetrying(false); return }
      const { merchantId, reqData, paymentUrl } = json.data
      const form = document.createElement('form'); form.method='POST'; form.action=paymentUrl; form.style.display='none'
      const addField = (n,v) => { const i=document.createElement('input'); i.type='hidden'; i.name=n; i.value=String(v); form.appendChild(i) }
      addField('merchantId', merchantId); addField('reqData', reqData)
      document.body.appendChild(form); form.submit()
    } catch { alert('Network error. Please try again.'); setRetrying(false) }
  }

  const REASONS = [
    'Incorrect card details',
    'Insufficient balance',
    'Bank declined the transaction',
    'Payment session timed out',
    'Network interruption',
  ]

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
            animation: iconAnim ? 'fail-spring .5s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
            transform: iconAnim ? undefined : 'scale(0)',
          }}>
            ❌
          </div>

          <h1 style={{ fontSize:'clamp(20px,4vw,26px)', fontWeight:800, color:'#0f172a', marginBottom:8 }}>
            Payment Failed
          </h1>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:6 }}>
            Your payment could not be processed.
          </p>
          <p style={{ fontSize:12, color:'#94a3b8', marginBottom:24 }}>
            No money has been deducted from your account.
            You can try again or use a different payment method.
          </p>

          {/* Booking reference */}
          <div style={{ background:'#f8fafc', borderRadius:12, padding:'10px 14px', marginBottom:16 }}>
            <p style={{ fontSize:11, color:'#94a3b8', margin:'0 0 3px' }}>Booking Reference</p>
            <p style={{ fontSize:13, fontFamily:'monospace', fontWeight:700, color:'#475569', margin:0 }}>{id}</p>
          </div>

          {/* Reasons */}
          <div style={{
            background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)',
            borderRadius:14, padding:16, marginBottom:20, textAlign:'left',
          }}>
            <p style={{ fontSize:12, fontWeight:700, color:'#92400e', marginBottom:10 }}>
              Common reasons for failure:
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {REASONS.map((reason) => (
                <div key={reason} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#b45309' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b', flexShrink:0 }} />
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <ActionBtn onClick={handleRetry} disabled={retrying} variant="primary">
              {retrying ? (
                <>
                  <span style={{ width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',animation:'fail-spin .7s linear infinite',display:'inline-block' }} />
                  Retrying...
                </>
              ) : '🔄 Try Payment Again'}
            </ActionBtn>
            <ActionBtn onClick={() => router.push('/user/bookings')} variant="secondary">
              My Bookings
            </ActionBtn>
            <ActionBtn onClick={() => router.push('/')} variant="ghost">
              🏠 Back to Home
            </ActionBtn>
          </div>

          <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>Still having issues?</p>
            <a href="mailto:support@medli.in" style={{ fontSize:12, color:'#6366f1', textDecoration:'none', fontWeight:600 }}>
              📞 Contact Support
            </a>
          </div>
        </div>
      </div>
    </>
  )
}