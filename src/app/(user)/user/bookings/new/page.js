'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter }    from 'next/navigation'
import Navbar                            from '@/components/public/Navbar'
import { useToast }                      from '@/context/ToastContext'
import { useAuth }                       from '@/hooks/useAuth'
import useSWR                            from 'swr'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const fmtRs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const KF = `
  @keyframes nb-spin     { to{transform:rotate(360deg)} }
  @keyframes nb-in       { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes nb-shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes nb-slide-in { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes nb-coupon-ok{ from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
`
const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize:  '200% 100%',
  animation:       'nb-shimmer 1.5s linear infinite',
}

function StepBar({ step }) {
  const steps = ['Details', 'Patient', 'Pricing', 'Payment']
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:24 }}>
      {steps.map((label, i) => {
        const idx    = i + 1
        const done   = idx < step
        const active = idx === step
        const isLast = i === steps.length - 1
        return (
          <div key={label} style={{ display:'flex', alignItems:'center', flex: isLast ? 0 : 1 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:32, height:32, borderRadius:'50%',
                background: done ? '#10b981' : active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f1f5f9',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:14, fontWeight:700,
                color: done || active ? '#fff' : '#94a3b8',
                boxShadow: active ? '0 3px 10px rgba(99,102,241,0.35)' : 'none',
                transition: 'all .2s ease',
              }}>
                {done ? '✓' : idx}
              </div>
              <span style={{ fontSize:10, fontWeight:500, color: active?'#6366f1':done?'#10b981':'#94a3b8', whiteSpace:'nowrap' }}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div style={{ flex:1, height:2, background: done?'#10b981':'#f1f5f9', margin:'0 4px', marginBottom:18, transition:'background .2s ease' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function BookCard({ children, style: sx }) {
  return (
    <div style={{
      background:'#fff', borderRadius:20,
      border:'1px solid #f1f5f9',
      boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
      overflow:'hidden',
      animation:'nb-slide-in .2s ease',
      ...sx,
    }}>
      {children}
    </div>
  )
}

function PBtn({ children, loading: isLoading, disabled, onClick, variant='primary', type='button', style: sx }) {
  const [h, setH] = useState(false)
  const isDisabled = disabled || isLoading
  const V = {
    primary:   { base:'linear-gradient(135deg,#6366f1,#8b5cf6)', hov:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', shadow:'0 4px 14px rgba(99,102,241,0.3)', shadowHov:'0 6px 20px rgba(99,102,241,0.45)' },
    secondary: { base:'#fff', hov:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0', shadow:'0 1px 3px rgba(0,0,0,0.06)', shadowHov:'none' },
    outline:   { base:'transparent', hov:'rgba(99,102,241,0.06)', color:'#6366f1', border:'1.5px solid rgba(99,102,241,0.3)', shadow:'none', shadowHov:'none' },
  }
  const s = V[variant] || V.primary
  return (
    <button
      type={type} onClick={onClick} disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding:'12px 18px', borderRadius:12,
        background: isDisabled ? '#e2e8f0' : h ? s.hov : s.base,
        color: isDisabled ? '#94a3b8' : s.color,
        border: s.border || 'none',
        fontSize:14, fontWeight:600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.65 : 1,
        boxShadow: isDisabled ? 'none' : h ? s.shadowHov : s.shadow,
        transition:'all .18s ease',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        ...sx,
      }}
    >
      {isLoading && (
        <span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'nb-spin .7s linear infinite', display:'inline-block', flexShrink:0 }} />
      )}
      {children}
    </button>
  )
}

function NInput({ label, icon, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'#475569' }}>{label}</label>}
      <div style={{ position:'relative' }}>
        {icon && <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none', color: focused?'#6366f1':'#94a3b8' }}>{icon}</span>}
        <input
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e) }}
          style={{
            width:'100%', padding: icon?'11px 14px 11px 40px':'11px 14px',
            fontSize:13, fontFamily:'inherit', borderRadius:12,
            border:`1.5px solid ${focused?'#6366f1':'#e2e8f0'}`,
            background:'#fff', color:'#0f172a', outline:'none',
            boxShadow: focused?'0 0 0 3px rgba(99,102,241,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
            transition:'all .15s ease', boxSizing:'border-box',
          }}
        />
      </div>
    </div>
  )
}

function DateTimeInput({ label, type, min, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'#475569' }}>{label}</label>}
      <input
        type={type} min={min} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', padding:'11px 14px',
          fontSize:13, fontFamily:'inherit', borderRadius:12,
          border:`1.5px solid ${focused?'#6366f1':'#e2e8f0'}`,
          background:'#fff', color:'#0f172a', outline:'none',
          boxShadow: focused?'0 0 0 3px rgba(99,102,241,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
          transition:'all .15s ease', boxSizing:'border-box',
        }}
      />
    </div>
  )
}

function PriceRow({ label, value, green, bold }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center',
      padding: bold ? '10px 0 0' : '6px 0',
      borderTop: bold ? '1px solid #e2e8f0' : 'none',
      marginTop: bold ? 4 : 0,
    }}>
      <span style={{ fontSize:13, fontWeight: bold?600:400, color: bold?'#1e293b':'#64748b' }}>{label}</span>
      <span style={{ fontSize:13, fontWeight: bold?700:600, color: green?'#10b981':bold?'#6366f1':'#1e293b' }}>{value}</span>
    </div>
  )
}

function Toggle2({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', gap:3, background:'#f1f5f9', borderRadius:14, padding:3 }}>
      {options.map((opt) => (
        <ToggleBtn key={opt.key} opt={opt} active={value===opt.key} onClick={() => onChange(opt.key)} />
      ))}
    </div>
  )
}

function ToggleBtn({ opt, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        padding:'10px 8px', borderRadius:11, border:'none',
        background: active?'#fff':h?'rgba(255,255,255,0.5)':'transparent',
        color: active?'#0f172a':'#64748b',
        fontSize:13, fontWeight: active?600:500, cursor:'pointer',
        boxShadow: active?'0 1px 4px rgba(0,0,0,0.1)':'none',
        transition:'all .15s ease',
      }}>
      <span style={{ fontSize:16 }}>{opt.icon}</span>
      <span>{opt.label}</span>
    </button>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f8fafc' }}>
      <span style={{ fontSize:13, color:'#64748b' }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>{value}</span>
    </div>
  )
}

function PayButton({ totalAmount, loading, onPay }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onPay} disabled={loading}
      onMouseEnter={() => !loading && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex:2, padding:'13px', borderRadius:12, border:'none',
        background: loading?'#e2e8f0':h?'linear-gradient(135deg,#7c3aed,#6d28d9)':'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: loading?'#94a3b8':'#fff',
        fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer',
        boxShadow: loading?'none':h?'0 8px 24px rgba(99,102,241,0.5)':'0 4px 14px rgba(99,102,241,0.35)',
        transition:'all .18s ease',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      }}
    >
      {loading ? (
        <>
          <span style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'nb-spin .7s linear infinite', display:'inline-block' }} />
          Opening Checkout...
        </>
      ) : `PAY ${fmtRs(totalAmount)}`}
    </button>
  )
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return }
    const s    = document.createElement('script')
    s.src      = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload   = resolve
    s.onerror  = reject
    document.body.appendChild(s)
  })
}

function NewBookingContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const toast        = useToast()
  const { user }     = useAuth()
  const mounted      = useMounted()

  const [step,           setStep]           = useState(1)
  const [bookingId,      setBookingId]      = useState(null)
  const [couponCode,     setCouponCode]     = useState('')
  const [couponResult,   setCouponResult]   = useState(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [loading,        setLoading]        = useState(false)
  const [patientType,    setPatientType]    = useState('myself')
  const [patientName,    setPatientName]    = useState('')
  const [collectionType, setCollectionType] = useState('walk_in')
  const [collectionAddr, setCollectionAddr] = useState({ line1:'', city:'', pinCode:'' })
  const [collectionDate, setCollectionDate] = useState('')
  const [collectionTime, setCollectionTime] = useState('')

  const doctorId = searchParams.get('doctorId')
  const labId    = searchParams.get('labId')
  const testIds  = searchParams.get('testIds')?.split(',').filter(Boolean) || []
  const date     = searchParams.get('date')
  const slot     = searchParams.get('slot')
  const type     = searchParams.get('type') || 'offline'

  const isLab    = !!labId
  const isOnline = type === 'online'

  const doctorStartTime = date && slot ? new Date(`${date}T${slot}:00`).toISOString() : null
  const doctorEndTime   = doctorStartTime ? new Date(new Date(doctorStartTime).getTime() + 30*60000).toISOString() : null
  const labStartTime    = collectionDate && collectionTime ? new Date(`${collectionDate}T${collectionTime}:00`).toISOString() : null

  const { data: doctor }    = useSWR(mounted && doctorId ? `/api/doctors/${doctorId}` : null, fetcher)
  const { data: lab }       = useSWR(mounted && labId ? `/api/labs/${labId}` : null, fetcher)
  const { data: testsData } = useSWR(mounted && labId && testIds.length ? `/api/labs/${labId}/tests` : null, fetcher)

  const allTests      = testsData?.tests || []
  const selectedTests = allTests.filter((t) => testIds.includes(t.id))

  const baseFee = isLab
    ? selectedTests.reduce((s,t) => s+(t.discountedPrice||t.price||0), 0)
    : doctor ? (isOnline ? (doctor.consultationFee?.online||0) : (doctor.consultationFee?.offline||0)) : 0

  const platformFeePercent = isLab ? (lab?.platformFeePercent||8) : (doctor?.platformFeePercent||10)
  const couponDiscount     = couponResult?.discountAmount || 0
  const discountedFee      = Math.max(0, baseFee - couponDiscount)
  const platformFee        = Math.round(discountedFee * platformFeePercent / 100)
  const gst                = Math.round(platformFee * 18 / 100)
  const subtotal           = discountedFee + platformFee
  const totalAmount        = subtotal + gst

  const bookingTypeLabel = isLab ? 'Lab Test' : isOnline ? 'Online Consultation' : 'Hospital Visit'
  const step1Valid       = isLab
    ? (testIds.length > 0 && collectionDate && collectionTime && (collectionType!=='home'||(collectionAddr.line1&&collectionAddr.city)))
    : !!doctorStartTime
  const todayStr = mounted ? new Date().toISOString().split('T')[0] : ''

  const createBooking = async () => {
    if (!step1Valid) { toast.error(isLab ? 'Select date, time and address' : 'No slot selected'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          type:               isLab ? 'lab' : isOnline ? 'online' : 'hospital',
          doctorId:           doctorId           || undefined,
          labId:              labId              || undefined,
          testIds,
          startTime:          isLab ? labStartTime  : doctorStartTime,
          endTime:            isLab ? null           : doctorEndTime,
          collectionType:     isLab ? collectionType : undefined,
          collectionAddress:  isLab && collectionType === 'home' ? collectionAddr : undefined,
          couponCode:         couponCode          || undefined,
          baseFee, platformFeePercent, platformFee,
          gstPercent: 18, gst, subtotal,
          couponDiscount: couponDiscount || 0,
          discountedFee, totalAmount,
        }),
      })
      const json = await res.json()
      if (json.success) { setBookingId(json.data.id); setStep(2) }
      else toast.error(json.error || 'Failed to create booking')
    } catch { toast.error('Network error') }
    finally { setLoading(false) }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setApplyingCoupon(true)
    try {
      const bType = isLab?'lab':isOnline?'online':'hospital'
      const res   = await fetch(`/api/coupons/validate/${couponCode}?bookingType=${bType}&amount=${baseFee}`, { credentials:'include' })
      const json  = await res.json()
      const d     = json.data || json
      if (d.valid) { setCouponResult(d); toast.success(d.message||'Coupon applied!') }
      else { setCouponResult({valid:false}); toast.error(d.message||'Invalid coupon') }
    } catch { toast.error('Failed to validate coupon') }
    finally { setApplyingCoupon(false) }
  }

  const initiatePayment = async () => {
    if (!bookingId) { toast.error('No booking found. Please go back and try again.'); return }
    setLoading(true)
    try {
      // Step 1: create Razorpay order
      const orderRes  = await fetch('/api/payments/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ bookingId }),
      })
      const orderJson = await orderRes.json()
      if (!orderJson.success) { toast.error(orderJson.error || 'Could not create payment order'); setLoading(false); return }

      const { razorpayOrderId, amount, currency, keyId } = orderJson.data

      // Step 2: load Razorpay SDK
      await loadRazorpayScript()

      // Step 3: open Razorpay Checkout
      const rzp = new window.Razorpay({
        key:         keyId,
        order_id:    razorpayOrderId,
        amount,
        currency:    currency || 'INR',
        name:        'MEDLI',
        description: bookingTypeLabel,
        prefill: {
          name:    user?.name  || '',
          email:   user?.email || '',
          contact: user?.phone || '',
        },
        notes:  { bookingId },
        theme:  { color: '#6366f1' },

        handler: async (response) => {
          // Step 4: verify signature on backend → confirm booking
          try {
            const verifyRes  = await fetch('/api/payments/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                bookingId,
              }),
            })
            const verifyJson = await verifyRes.json()
            if (verifyJson.success) {
  setLoading(false)
  router.replace(`/user/bookings/${bookingId}/success`)
} else {
  setLoading(false)
  toast.error('Payment verification failed. Contact support.')
  router.replace(`/user/bookings/${bookingId}/failed`)
}
          } catch {
            toast.error('Verification error. Contact support.')
            router.replace(`/user/bookings/${bookingId}/failed`)
          }
        },

        modal: {
          ondismiss: () => { toast.error('Payment cancelled'); setLoading(false) },
        },
      })

      rzp.on('payment.failed', (response) => {
  setLoading(false)
  toast.error(response.error?.description || 'Payment failed. Please retry.')
  router.replace(`/user/bookings/${bookingId}/failed`)
})

      rzp.open()

    } catch (err) {
      console.error('[initiatePayment]', err)
      toast.error('Could not open payment. Please try again.')
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
        <Navbar />
        <div style={{ maxWidth:560, margin:'0 auto', padding:'88px 16px 64px' }}>
          <div style={{ height:48, borderRadius:20, marginBottom:20, ...SHIMMER }} />
          <div style={{ height:280, borderRadius:20, ...SHIMMER }} />
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{KF}</style>
      <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
        <Navbar />
        <div style={{ maxWidth:560, margin:'0 auto', padding:'88px 16px 64px' }}>
          <StepBar step={step} />

          {/* ══ STEP 1 ══ */}
          {step === 1 && (
            <BookCard>
              <div style={{ backgroundImage:'linear-gradient(135deg,#4f46e5,#2563eb)', padding:24, color:'#fff' }}>
                <h2 style={{ fontSize:18, fontWeight:800, margin:'0 0 4px' }}>
                  {isLab ? 'Select Collection Details' : 'Review Appointment'}
                </h2>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', margin:0 }}>
                  {isLab ? 'Choose how and when to collect your sample' : 'Confirm your appointment details'}
                </p>
              </div>
              <div style={{ padding:20 }}>
                {!isLab && (
                  <div>
                    {doctor ? (
                      <>
                        <InfoRow label="Doctor" value={`Dr. ${doctor.name}`} />
                        {doctor.specialization?.length > 0 && <InfoRow label="Specialization" value={doctor.specialization.slice(0,2).join(', ')} />}
                      </>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'10px 0' }}>
                        <div style={{ width:192, height:14, borderRadius:6, ...SHIMMER }} />
                        <div style={{ width:128, height:12, borderRadius:6, ...SHIMMER }} />
                      </div>
                    )}
                    <InfoRow label="Type"     value={`${isOnline?'🎥':'🏥'} ${bookingTypeLabel}`} />
                    {date && <InfoRow label="📅 Date" value={new Date(`${date}T00:00:00`).toLocaleDateString('en-IN',{dateStyle:'long'})} />}
                    {slot && <InfoRow label="⏰ Time" value={slot} />}
                    {baseFee > 0 && <InfoRow label="Consultation Fee" value={fmtRs(baseFee)} />}
                  </div>
                )}
                {isLab && (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {lab && (
                      <div style={{ display:'flex', alignItems:'center', gap:12, padding:12, background:'rgba(16,185,129,0.06)', borderRadius:12, border:'1px solid rgba(16,185,129,0.15)' }}>
                        <div style={{ width:42, height:42, borderRadius:12, background:'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🧪</div>
                        <div>
                          <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>{lab.name}</p>
                          <p style={{ fontSize:12, color:'#64748b', margin:0 }}>{testIds.length} test{testIds.length>1?'s':''} selected</p>
                        </div>
                      </div>
                    )}
                    {selectedTests.length > 0 && (
                      <div style={{ background:'#f8fafc', borderRadius:12, padding:12 }}>
                        {selectedTests.map((t) => (
                          <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:12 }}>
                            <span style={{ color:'#64748b' }}>{t.name}</span>
                            <span style={{ fontWeight:600, color:'#1e293b' }}>{fmtRs(t.discountedPrice||t.price)}</span>
                          </div>
                        ))}
                        <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0 0', marginTop:4, borderTop:'1px solid #e2e8f0', fontSize:12 }}>
                          <span style={{ fontWeight:600, color:'#475569' }}>Tests Total</span>
                          <span style={{ fontWeight:700, color:'#10b981' }}>{fmtRs(baseFee)}</span>
                        </div>
                      </div>
                    )}
                    <Toggle2
                      value={collectionType} onChange={setCollectionType}
                      options={[
                        { key:'walk_in', icon:'📍', label:'Walk-in' },
                        { key:'home',    icon:'🏠', label:'Home Collection' },
                      ]}
                    />
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <DateTimeInput label={collectionType==='home'?'Pickup Date':'Visit Date'} type="date" min={todayStr} value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} />
                      <DateTimeInput label={collectionType==='home'?'Pickup Time':'Visit Time'} type="time" value={collectionTime} onChange={(e) => setCollectionTime(e.target.value)} />
                    </div>
                    {collectionType === 'home' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:10, animation:'nb-slide-in .2s ease' }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#475569', margin:0 }}>Pickup Address</p>
                        <NInput icon="📍" placeholder="Street address / flat no." value={collectionAddr.line1} onChange={(e) => setCollectionAddr((a) => ({...a, line1:e.target.value}))} />
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          <NInput placeholder="City"     value={collectionAddr.city}    onChange={(e) => setCollectionAddr((a) => ({...a, city:e.target.value}))} />
                          <NInput placeholder="PIN Code" value={collectionAddr.pinCode} maxLength={6} onChange={(e) => setCollectionAddr((a) => ({...a, pinCode:e.target.value}))} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ marginTop:20 }}>
                  <PBtn onClick={createBooking} loading={loading} disabled={loading||!step1Valid} sx={{ width:'100%' }}>
                    {isLab ? 'Confirm Collection Details' : 'Continue to Patient Details'} →
                  </PBtn>
                  {!step1Valid && (
                    <p style={{ fontSize:11, color:'#94a3b8', textAlign:'center', marginTop:8 }}>
                      {isLab ? `Select date and time${collectionType==='home'?' and address':''}` : 'No slot selected — go back and select a slot'}
                    </p>
                  )}
                </div>
              </div>
            </BookCard>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 2 && (
            <BookCard>
              <div style={{ padding:24 }}>
                <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:'0 0 4px' }}>Patient Details</h2>
                <p style={{ fontSize:13, color:'#94a3b8', margin:'0 0 20px' }}>Who is this appointment for?</p>
                <Toggle2
                  value={patientType} onChange={setPatientType}
                  options={[
                    { key:'myself', icon:'👤', label:'For Myself' },
                    { key:'family', icon:'👥', label:'For Family' },
                  ]}
                />
                <div style={{ marginTop:16 }}>
                  {patientType === 'myself' ? (
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:14, background:'rgba(99,102,241,0.06)', borderRadius:14, border:'1px solid rgba(99,102,241,0.12)' }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:18, flexShrink:0 }}>
                        {user?.name?.charAt(0)?.toUpperCase()||'U'}
                      </div>
                      <div>
                        <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>{user?.name||'—'}</p>
                        <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>{user?.phone||user?.email||'—'}</p>
                      </div>
                    </div>
                  ) : (
                    <NInput label="Patient Name" icon="👤" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Enter family member's full name" />
                  )}
                </div>
                <div style={{ display:'flex', gap:10, marginTop:20 }}>
                  <PBtn variant="secondary" onClick={() => setStep(1)} sx={{ flex:1 }}>← Back</PBtn>
                  <PBtn onClick={() => setStep(3)} disabled={patientType==='family'&&!patientName.trim()} sx={{ flex:1 }}>Continue →</PBtn>
                </div>
              </div>
            </BookCard>
          )}

          {/* ══ STEP 3 ══ */}
          {step === 3 && (
            <BookCard>
              <div style={{ padding:24 }}>
                <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:'0 0 4px' }}>Coupon & Pricing</h2>
                <p style={{ fontSize:13, color:'#94a3b8', margin:'0 0 20px' }}>Apply a coupon to save on your booking</p>
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  <NInput icon="🏷️" placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                  <PBtn variant="outline" onClick={applyCoupon} loading={applyingCoupon} disabled={!couponCode.trim()||applyingCoupon} sx={{ flexShrink:0, padding:'11px 16px' }}>Apply</PBtn>
                </div>
                {couponResult?.valid && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12, padding:'10px 14px', marginBottom:12, animation:'nb-coupon-ok .2s ease', fontSize:13, color:'#059669', fontWeight:500 }}>
                    ✓ Coupon applied! Saved {fmtRs(couponResult.discountAmount)}
                  </div>
                )}
                {couponResult && !couponResult.valid && (
                  <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'10px 14px', marginBottom:12, fontSize:13, color:'#ef4444' }}>
                    Invalid or expired coupon
                  </div>
                )}
                <div style={{ background:'#f8fafc', borderRadius:14, padding:16, marginBottom:20 }}>
                  <PriceRow label="Base Fee"                                       value={fmtRs(baseFee)} />
                  {couponDiscount > 0 && <PriceRow label={`Coupon (${couponCode})`} value={`- ${fmtRs(couponDiscount)}`} green />}
                  {couponDiscount > 0 && <PriceRow label="Discounted Fee"           value={fmtRs(discountedFee)} />}
                  <PriceRow label={`Platform Fee (${platformFeePercent}%)`}          value={fmtRs(platformFee)} />
                  <PriceRow label="GST (18%)"                                        value={fmtRs(gst)} />
                  <PriceRow label="Total Amount"                                     value={fmtRs(totalAmount)} bold />
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <PBtn variant="secondary" onClick={() => setStep(2)} sx={{ flex:1 }}>← Back</PBtn>
                  <PBtn onClick={() => setStep(4)} sx={{ flex:1 }}>Continue to Payment →</PBtn>
                </div>
              </div>
            </BookCard>
          )}

          {/* ══ STEP 4 ══ */}
          {step === 4 && (
            <BookCard>
              <div style={{ padding:24 }}>
                <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:'0 0 4px' }}>Pay Securely</h2>
                <p style={{ fontSize:13, color:'#94a3b8', margin:'0 0 20px' }}>
                  Razorpay secure checkout will open in a popup
                </p>
                <div style={{ backgroundImage:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(99,102,241,0.04))', border:'1px solid rgba(99,102,241,0.15)', borderRadius:16, padding:18, marginBottom:18 }}>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:'1.5px', color:'#6366f1', marginBottom:6 }}>
                    {bookingTypeLabel.toUpperCase()}
                  </p>
                  <p style={{ fontSize:12, color:'#94a3b8', marginBottom:14 }}>
                    {isLab ? `${collectionType==='home'?'Home Collection':'Walk-in'} · ${collectionDate} ${collectionTime}` : `${date} · ${slot}`}
                  </p>
                  {[
                    { l:'Base Fee',                               v:fmtRs(baseFee),              green:false },
                    ...(couponDiscount>0 ? [{ l:`Coupon (${couponCode})`, v:`- ${fmtRs(couponDiscount)}`, green:true }] : []),
                    { l:`Platform Fee (${platformFeePercent}%)`,  v:fmtRs(platformFee),           green:false },
                    { l:'GST (18%)',                              v:fmtRs(gst),                   green:false },
                  ].map(({ l, v, green }) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:green?'#10b981':'#6366f1', marginBottom:4 }}>
                      <span>{l}</span><span>{v}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, marginTop:8, borderTop:'1px solid rgba(99,102,241,0.2)' }}>
                    <span style={{ fontSize:14, fontWeight:600, color:'#4f46e5' }}>Total Amount</span>
                    <span style={{ fontSize:26, fontWeight:900, color:'#4f46e5' }}>{fmtRs(totalAmount)}</span>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:14, background:'#f8fafc', borderRadius:12, marginBottom:18 }}>
                  <span style={{ fontSize:24 }}>🔒</span>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:'#334155', margin:0 }}>Secured by Razorpay</p>
                    <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>Cards · Net Banking · UPI · Wallets · EMI</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <PBtn variant="secondary" onClick={() => setStep(3)} disabled={loading} sx={{ flex:1 }}>← Back</PBtn>
                  <PayButton totalAmount={totalAmount} loading={loading} onPay={initiatePayment} />
                </div>
                <p style={{ textAlign:'center', fontSize:11, color:'#94a3b8', marginTop:12 }}>
                  By proceeding you agree to our{' '}
                  <a href="/terms"   style={{ color:'#6366f1', textDecoration:'none' }}>Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" style={{ color:'#6366f1', textDecoration:'none' }}>Privacy Policy</a>
                </p>
              </div>
            </BookCard>
          )}

        </div>
      </div>
    </>
  )
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
        <style>{`@keyframes nb-spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #6366f1', borderTopColor:'transparent', animation:'nb-spin .8s linear infinite' }} />
        <p style={{ fontSize:13, color:'#94a3b8', margin:0 }}>Loading...</p>
      </div>
    }>
      <NewBookingContent />
    </Suspense>
  )
}