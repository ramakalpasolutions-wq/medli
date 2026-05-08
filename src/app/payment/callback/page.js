'use client'

import { useEffect, Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const KF = `
  @keyframes cb-spin { to{transform:rotate(360deg)} }
  @keyframes cb-pulse{ 0%,100%{opacity:.3} 50%{opacity:1} }
`

function CallbackContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setDots((d) => (d+1)%4), 400)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const bookingId = searchParams.get('bookingId')
    const orderId   = searchParams.get('orderId')
    const success   = searchParams.get('success')

    const timer = setTimeout(() => {
      if (success === 'true' && bookingId) {
        router.replace(`/user/bookings/${bookingId}/success`)
      } else if (orderId) {
        router.replace(`/user/bookings/failed?orderId=${orderId}`)
      } else {
        router.replace('/user/bookings')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [searchParams, router])

  return (
    <>
      <style>{KF}</style>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#16213e 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{ position:'absolute',top:'20%',left:'15%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%)',filter:'blur(60px)',pointerEvents:'none' }} />
        <div style={{ position:'absolute',bottom:'20%',right:'15%',width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(16,185,129,0.1),transparent 70%)',filter:'blur(50px)',pointerEvents:'none' }} />

        {/* Spinner */}
        <div style={{ position:'relative', width:72, height:72 }}>
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            border:'3px solid rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            border:'3px solid transparent',
            borderTopColor:'#6366f1',
            borderRightColor:'#8b5cf6',
            animation:'cb-spin 1s linear infinite',
          }} />
          <div style={{
            position:'absolute', inset:12, borderRadius:'50%',
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22,
          }}>
            🏥
          </div>
        </div>

        {/* Text */}
        <div style={{ textAlign:'center', zIndex:1 }}>
          <p style={{
            fontSize:18, fontWeight:700, color:'#fff',
            marginBottom:6, letterSpacing:'-0.3px',
          }}>
            Processing your payment{'.'.repeat(dots)}
          </p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>
            Please wait, do not press back
          </p>
        </div>

        {/* Brand */}
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          marginTop:8,
        }}>
          <div style={{
            width:28, height:28, borderRadius:8,
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14,
          }}>🏥</div>
          <span style={{
            fontSize:16, fontWeight:800,
            backgroundImage:'linear-gradient(135deg,#818cf8,#a78bfa)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text',
          }}>
            MEDLI
          </span>
        </div>
      </div>
    </>
  )
}

function SpinnerFallback() {
  return (
    <>
      <style>{`@keyframes cb-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        minHeight:'100vh', background:'#0f0f1a',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{
          width:32, height:32, borderRadius:'50%',
          border:'3px solid #6366f1', borderTopColor:'transparent',
          animation:'cb-spin .8s linear infinite',
        }} />
      </div>
    </>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<SpinnerFallback />}>
      <CallbackContent />
    </Suspense>
  )
}