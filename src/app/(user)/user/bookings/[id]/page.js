'use client'

import { use, useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes bd-spin    { to{transform:rotate(360deg)} }
  @keyframes bd-in      { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bd-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes bd-pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
`
const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize:  '200% 100%',
  animation:       'bd-shimmer 1.5s linear infinite',
}

function resolveAddress(a, city) {
  if (!a) return city || null
  if (typeof a === 'string') return [a, city].filter(Boolean).join(', ')
  return [a.street || a.line1 || a.area, a.city || city, a.state, a.pinCode || a.pincode]
    .filter(Boolean).join(', ')
}

function resolveStringOrArray(val, separator = ' · ') {
  if (!val) return null
  if (Array.isArray(val)) return val.join(separator)
  return val.toString().replace(/([a-z])([A-Z])/g, '$1 $2')
}

/* ─── Lab Tracker ─────────────────────────────────────────────────── */
const LAB_STEPS = [
  { key: 'sample_collected', label: 'Sample Collected', icon: '🧪' },
  { key: 'processing',       label: 'Processing',       icon: '⚗️' },
  { key: 'report_ready',     label: 'Report Ready',     icon: '📄' },
]

function LabTracker({ status }) {
  const currentIndex = LAB_STEPS.findIndex((s) => s.key === status)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', margin: '16px 0' }}>
      {LAB_STEPS.map((step, i) => {
        const done   = i <= currentIndex
        const active = i === currentIndex
        const isLast = i === LAB_STEPS.length - 1
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: i < currentIndex ? 14 : 18, fontWeight: 700,
                background: done ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f1f5f9',
                color: done ? '#fff' : '#94a3b8',
                boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                transition: 'all .3s ease',
              }}>
                {i < currentIndex ? '✓' : step.icon}
              </div>
              <p style={{ fontSize: 10, fontWeight: 500, textAlign: 'center', maxWidth: 64, lineHeight: 1.3, color: done ? '#6366f1' : '#94a3b8' }}>
                {step.label}
              </p>
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: 2, margin: '0 4px', marginBottom: 20,
                background: i < currentIndex ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : '#f1f5f9',
                transition: 'background .3s ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Action Button ───────────────────────────────────────────────── */
function ActionBtn({ children, loading: isLoading, disabled, onClick, variant = 'primary' }) {
  const [h, setH] = useState(false)
  const isDisabled = disabled || isLoading
  const V = {
    primary:   { base:'linear-gradient(135deg,#6366f1,#8b5cf6)', hov:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', shadow:'0 4px 14px rgba(99,102,241,0.3)' },
    secondary: { base:'#fff', hov:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0', shadow:'0 1px 3px rgba(0,0,0,0.06)' },
    danger:    { base:'rgba(239,68,68,0.06)', hov:'rgba(239,68,68,0.12)', color:'#ef4444', border:'1.5px solid rgba(239,68,68,0.2)', shadow:'none' },
    success:   { base:'linear-gradient(135deg,#10b981,#059669)', hov:'linear-gradient(135deg,#059669,#047857)', color:'#fff', border:'none', shadow:'0 4px 14px rgba(16,185,129,0.3)' },
  }
  const s = V[variant] || V.primary
  return (
    <button
      onClick={onClick} disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 16px', borderRadius: 12,
        background: isDisabled ? '#f1f5f9' : h ? s.hov : s.base,
        color: isDisabled ? '#94a3b8' : s.color,
        border: s.border || 'none',
        fontSize: 13, fontWeight: 600, cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isDisabled ? 'none' : s.shadow,
        transition: 'all .18s ease', minHeight: 40,
      }}
    >
      {isLoading && <span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid currentColor', borderTopColor:'transparent', animation:'bd-spin .7s linear infinite', display:'inline-block', opacity:0.6 }} />}
      {children}
    </button>
  )
}

/* ─── Info row ────────────────────────────────────────────────────── */
function InfoRow({ label, value, mono, color }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f8fafc' }}>
      <span style={{ fontSize:12, color:'#94a3b8' }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, color:color||'#334155', fontFamily:mono?'monospace':undefined }}>{value}</span>
    </div>
  )
}

function SectionTitle({ icon, title }) {
  return (
    <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
      <span>{icon}</span> {title}
    </p>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background:'#fff', borderRadius:20, padding:20,
      border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
      animation:'bd-in .3s ease', ...style
    }}>
      {children}
    </div>
  )
}

function EntityBlock({ icon, name, sub1, sub2, sub3, tag }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
      <div style={{
        width:48, height:48, borderRadius:14, flexShrink:0,
        background:'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1))',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
      }}>
        {icon}
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:'0 0 2px' }}>{name || '—'}</p>
        {sub1 && <p style={{ fontSize:12, color:'#64748b', margin:'0 0 2px' }}>{sub1}</p>}
        {sub2 && <p style={{ fontSize:12, color:'#94a3b8', margin:'0 0 2px' }}>{sub2}</p>}
        {sub3 && <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>{sub3}</p>}
        {tag && (
          <span style={{
            display:'inline-block', marginTop:6, padding:'2px 10px',
            borderRadius:100, fontSize:10, fontWeight:600,
            background:'rgba(99,102,241,0.08)', color:'#6366f1',
          }}>
            {tag}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── Cancel Modal ────────────────────────────────────────────────── */
function CancelModal({ open, onClose, onConfirm, loading, booking }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  if (!open) return null
  return (
    <>
      <style>{`@keyframes modal-in{from{opacity:0;transform:scale(.95) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} />
        <div style={{
          position:'relative', width:'100%', maxWidth:400,
          background:'#fff', borderRadius:20, padding:24,
          boxShadow:'0 24px 80px rgba(0,0,0,0.2)',
          animation:'modal-in .25s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <h3 style={{ fontSize:17, fontWeight:700, color:'#0f172a', marginBottom:8 }}>Cancel Booking?</h3>
            <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>
              Are you sure you want to cancel this booking?
            </p>
          </div>
          {booking && (
            <div style={{ background:'#f8fafc', borderRadius:12, padding:'4px 0', marginBottom:16 }}>
              <InfoRow label="Booking ID" value={booking.bookingId} mono />
              <InfoRow label="Amount"     value={`₹${booking.totalAmount}`} />
              <InfoRow label="Status"     value={booking.status} />
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <ModalBtn label="Keep Booking"   onClick={onClose}   disabled={loading}  variant="secondary" />
            <ModalBtn label="Cancel Booking" onClick={onConfirm} loading={loading}   variant="danger" />
          </div>
        </div>
      </div>
    </>
  )
}

function ModalBtn({ label, onClick, disabled, loading: isLoading, variant = 'secondary' }) {
  const [h, setH] = useState(false)
  const V = {
    secondary: { base:'#fff', hov:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0' },
    danger:    { base:'rgba(239,68,68,0.06)', hov:'rgba(239,68,68,0.12)', color:'#ef4444', border:'1.5px solid rgba(239,68,68,0.2)' },
  }
  const s = V[variant]
  const isDisabled = disabled || isLoading
  return (
    <button
      onClick={onClick} disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex:1, padding:'11px', borderRadius:12,
        background: isDisabled?'#f1f5f9':h?s.hov:s.base,
        color: isDisabled?'#94a3b8':s.color,
        border: s.border, fontSize:13, fontWeight:600,
        cursor: isDisabled?'not-allowed':'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        transition:'all .15s ease',
      }}
    >
      {isLoading && <span style={{ width:14,height:14,borderRadius:'50%',border:'2px solid currentColor',borderTopColor:'transparent',animation:'bd-spin .7s linear infinite',display:'inline-block',opacity:0.6 }} />}
      {label}
    </button>
  )
}

/* ─── Tests Booked Section ────────────────────────────────────────── */
function TestsBooked({ booking, testsData, testsLoading }) {
  if (!booking?.testIds?.length) return null

  const tests = Array.isArray(testsData) ? testsData : (testsData?.tests || [])

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        🧫 Tests Booked
        <span style={{
          background: 'rgba(99,102,241,0.1)', color: '#6366f1',
          borderRadius: 100, padding: '1px 8px', fontSize: 10, fontWeight: 700,
        }}>
          {booking.testIds.length}
        </span>
      </p>

      {testsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {booking.testIds.map((_, i) => (
            <div key={i} style={{ height: 52, borderRadius: 10, ...SHIMMER }} />
          ))}
        </div>
      ) : tests.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tests.map((t, i) => (
            <div key={t.id || t._id || i} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '10px 12px', background: '#f8fafc', borderRadius: 12,
              border: '1px solid #f1f5f9',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{t.name}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {t.category && (
                    <span style={{ fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.08)', borderRadius: 6, padding: '1px 6px', fontWeight: 600 }}>
                      {t.category}
                    </span>
                  )}
                  {t.sampleType && (
                    <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', borderRadius: 6, padding: '1px 6px' }}>
                      🧬 {t.sampleType}
                    </span>
                  )}
                  {t.turnaroundTime && (
                    <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', borderRadius: 6, padding: '1px 6px' }}>
                      ⏱ {t.turnaroundTime?.value} {t.turnaroundTime?.unit || 'hrs'}
                    </span>
                  )}
                </div>
                {t.preparationInstructions && (
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0', fontStyle: 'italic' }}>
                    📋 {t.preparationInstructions}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                {t.discountedPrice != null && t.discountedPrice < t.price ? (
                  <>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', margin: 0 }}>₹{t.discountedPrice}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through', margin: 0 }}>₹{t.price}</p>
                  </>
                ) : t.price != null ? (
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', margin: 0 }}>₹{t.price}</p>
                ) : null}
              </div>
            </div>
          ))}
          {/* Tests total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 10, marginTop: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Tests Total</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
              ₹{tests.reduce((s, t) => s + (t.discountedPrice ?? t.price ?? 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      ) : (
        // Fallback: no test details but IDs exist
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {booking.testIds.map((id, i) => (
            <div key={id} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontFamily: 'monospace' }}>Test {i + 1}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function BookingDetailPage({ params }) {
  const { id }  = use(params)
  const router  = useRouter()
  const mounted = useMounted()
  const toast   = useToast()

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [dlInvoice,  setDlInvoice]  = useState(false)
  const [dlReport,   setDlReport]   = useState(false)
  const [paying,     setPaying]     = useState(false)

  const { data: booking, isLoading, mutate } = useSWR(`/api/bookings/${id}`, fetcher)

  // ── Related entity fetches ──
  const { data: doctor } = useSWR(
    booking?.doctorId ? `/api/doctors/${booking.doctorId}` : null, fetcher
  )
  const { data: lab } = useSWR(
    booking?.labId ? `/api/labs/${booking.labId}` : null, fetcher
  )

  // ── ✅ Fixed: fetch tests from lab's tests API filtered by IDs ──
  const { data: testsData, isLoading: testsLoading } = useSWR(
    booking?.testIds?.length > 0 && booking?.labId
      ? `/api/labs/${booking.labId}/tests?ids=${booking.testIds.join(',')}`
      : null,
    fetcher
  )

  const hospitalId = booking?.hospitalId || doctor?.hospitalId || null
  const { data: hospital } = useSWR(
    hospitalId ? `/api/hospitals/${hospitalId}` : null, fetcher
  )

  const now      = mounted ? new Date() : null
  const diffMins = mounted && booking?.startTime && now
    ? (new Date(booking.startTime) - now) / 60_000 : null

  const showJoin  = booking?.type === 'online' && booking?.meetLink
    && diffMins !== null && diffMins <= 15 && diffMins >= -30

  const canCancel = booking
    ? ['created','pending_payment','confirmed'].includes(booking.status) : false

  const isFinished = ['completed','cancelled','refunded','no_show'].includes(booking?.status)

  // ── Handlers ──
  const handleInvoiceDownload = async () => {
    setDlInvoice(true)
    try {
      const lookupRes  = await fetch(`/api/invoices/by-booking/${id}`, { credentials:'include' })
      const lookupJson = await lookupRes.json()
      if (!lookupRes.ok || !lookupJson.data?.id) { toast.error(lookupJson.error||'Invoice not found'); return }
      const invoiceId     = lookupJson.data.id
      const invoiceNumber = lookupJson.data.invoiceNumber || booking?.bookingId
      const dlRes = await fetch(`/api/invoices/${invoiceId}/download`, { credentials:'include' })
      if (!dlRes.ok) { toast.error('Could not generate PDF'); return }
      const blob = await dlRes.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a'); a.href=url; a.download=`MEDLI-${invoiceNumber}.pdf`
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
      toast.success('Invoice downloaded')
    } catch { toast.error('Download failed') }
    finally { setDlInvoice(false) }
  }

  const handleReportDownload = async () => {
    setDlReport(true)
    try {
      const res  = await fetch(`/api/bookings/${id}/report`, { credentials:'include' })
      const json = await res.json()
      if (json.success && json.data?.signedUrl) window.open(json.data.signedUrl, '_blank')
      else toast.error(json.error||'Report not available yet')
    } catch { toast.error('Failed to fetch report') }
    finally { setDlReport(false) }
  }

  const handleCancel = async () => {
  setCancelling(true)
  try {
    const res = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason: 'Cancelled by patient' }),
    })

    const json = await res.json()

    if (json.success) {
      toast.success('Booking cancelled.')
      mutate()
      setCancelOpen(false)
      router.push('/user/bookings?refresh=1')
    } else {
      toast.error(json.error || 'Cancel failed')
    }
  } catch {
    toast.error('Cancel failed. Please try again.')
  } finally {
    setCancelling(false)
  }
}

 const handlePayNow = async () => {
  setPaying(true)

  try {
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bookingId: id }),
    })

    const json = await res.json()

    if (!json.success) {
      toast.error(json.error || 'Failed to create payment order')
      setPaying(false)
      return
    }

    const { razorpayOrderId, amount, currency, keyId } = json.data

    await new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve()
        return
      }
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload = resolve
      s.onerror = reject
      document.body.appendChild(s)
    })

    const rzp = new window.Razorpay({
      key: keyId,
      order_id: razorpayOrderId,
      amount,
      currency: currency || 'INR',
      name: 'MEDLI',
      description: 'Lab Test Booking',
      theme: { color: '#6366f1' },
      handler: async (response) => {
        try {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: id,
            }),
          })

          const verifyJson = await verifyRes.json()

          if (verifyJson.success) {
            toast.success('Payment successful!')
            mutate()
            router.push('/user/bookings?refresh=1')
          } else {
            toast.error('Payment verification failed')
          }
        } catch {
          toast.error('Verification error')
        } finally {
          setPaying(false)
        }
      },
      modal: {
        ondismiss: () => setPaying(false),
      },
    })

    rzp.open()
  } catch {
    toast.error('Could not start payment.')
    setPaying(false)
  }
}

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <>
        <style>{KF}</style>
        <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
          <Navbar />
          <div style={{ maxWidth:640, margin:'0 auto', padding:'88px 16px 64px', display:'flex', flexDirection:'column', gap:12 }}>
            {[140,100,180,80].map((h,i) => (
              <div key={i} style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', height:h, ...SHIMMER }} />
            ))}
          </div>
          <Footer />
        </div>
      </>
    )
  }

  if (!booking) return null

  const bookingDate = mounted && booking.startTime
    ? new Date(booking.startTime).toLocaleDateString('en-IN', { dateStyle: 'full' }) : '—'
  const bookingTime = mounted && booking.startTime
    ? new Date(booking.startTime).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'
  const bookingEndTime = mounted && booking.endTime
    ? new Date(booking.endTime).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : null

  const typeMap   = { hospital: '🏥 Hospital Visit', online: '🎥 Online Consultation', lab: '🧪 Lab Test' }
  const typeLabel = typeMap[booking.type] || booking.type

  const renderConsultationFee = () => {
    const fee = doctor?.consultationFee
    if (!fee) return null
    if (booking.type === 'online'   && fee.online   != null) return <InfoRow label="Online Fee"    value={`₹${fee.online}`}   />
    if (booking.type === 'hospital' && fee.offline  != null) return <InfoRow label="In-Person Fee" value={`₹${fee.offline}`}  />
    return null
  }

  return (
    <>
      <style>{KF}</style>
      <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
        <Navbar />

        <div style={{ maxWidth:640, margin:'0 auto', padding:'88px 16px 80px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Back */}
          <BackBtn onClick={() => router.push('/user/bookings')} />

          {/* ── Header card ── */}
          <Card>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <p style={{ fontSize:11, color:'#94a3b8', marginBottom:4 }}>Booking ID</p>
                <p style={{ fontSize:15, fontWeight:700, color:'#1e293b', fontFamily:'monospace' }}>{booking.bookingId}</p>
              </div>
              <Badge variant={getStatusVariant(booking.status)} size="md" dot>
                {booking.status?.replace(/_/g,' ')}
              </Badge>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                ['📋 Type',    typeLabel],
                ['📅 Date',    bookingDate],
                ['🕐 Time',    bookingEndTime ? `${bookingTime} – ${bookingEndTime}` : bookingTime],
                ['💳 Payment', booking.paymentStatus?.replace(/_/g,' ')],
              ].map(([k,v]) => (
                <div key={k} style={{ background:'#f8fafc', borderRadius:12, padding:'10px 12px' }}>
                  <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{k}</p>
                  <p style={{ fontSize:13, fontWeight:500, color:'#1e293b', margin:'2px 0 0', textTransform:'capitalize' }}>{v}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Hospital Details ── */}
          {hospital && (
            <Card>
              <SectionTitle icon="🏥" title="Hospital Details" />
              <EntityBlock
                icon="🏥"
                name={hospital.name}
                sub1={resolveStringOrArray(hospital.departments)}
                sub2={resolveAddress(hospital.address, hospital.city)}
                sub3={hospital.contactPhone ? `📞 ${hospital.contactPhone}` : null}
              />
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', flexDirection:'column', gap:2 }}>
                {hospital.contactEmail && <InfoRow label="Email"   value={hospital.contactEmail} />}
                {hospital.contactPhone && <InfoRow label="Phone"   value={hospital.contactPhone} />}
                {hospital.address?.city    && <InfoRow label="City"    value={hospital.address.city} />}
                {hospital.address?.state   && <InfoRow label="State"   value={hospital.address.state} />}
                {hospital.address?.pinCode && <InfoRow label="Pincode" value={hospital.address.pinCode} />}
              </div>
            </Card>
          )}

          {/* ── Doctor Details ── */}
          {doctor && (
            <Card>
              <SectionTitle icon="👨‍⚕️" title="Doctor Details" />
              <EntityBlock
                icon="👨‍⚕️"
                name={doctor.name}
                sub1={resolveStringOrArray(doctor.specialization)}
                sub2={resolveStringOrArray(doctor.qualifications, ', ')}
                sub3={doctor.experience ? `${doctor.experience} years experience` : null}
              />
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', flexDirection:'column', gap:2 }}>
                {renderConsultationFee()}
                {doctor.rating?.average > 0 && (
                  <InfoRow label="Rating" value={`⭐ ${doctor.rating.average} (${doctor.rating.count} reviews)`} />
                )}
              </div>
            </Card>
          )}

          {/* ── Lab Details ── */}
          {lab && (
            <Card>
              <SectionTitle icon="🧪" title="Lab Details" />
              <EntityBlock
                icon="🔬"
                name={lab.name}
                sub1={lab.certifications?.length ? `Certifications: ${lab.certifications.join(', ')}` : null}
                sub2={resolveAddress(lab.address, lab.address?.city)}
                sub3={lab.contactPhone ? `📞 ${lab.contactPhone}` : null}
              />

              {/* ✅ Rich lab info */}
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', flexDirection:'column', gap:2 }}>
                {lab.contactEmail && <InfoRow label="Email"   value={lab.contactEmail} />}
                {lab.contactPhone && <InfoRow label="Phone"   value={lab.contactPhone} />}
                {lab.address?.city    && <InfoRow label="City"    value={lab.address.city} />}
                {lab.address?.state   && <InfoRow label="State"   value={lab.address.state} />}
                {lab.address?.pinCode && <InfoRow label="Pincode" value={lab.address.pinCode} />}
                {lab.rating?.average > 0 && (
                  <InfoRow label="Rating" value={`⭐ ${lab.rating.average} (${lab.rating.count} reviews)`} />
                )}
                <InfoRow
                  label="Home Collection"
                  value={lab.homeCollection?.enabled ? '✓ Available' : 'Not Available'}
                  color={lab.homeCollection?.enabled ? '#10b981' : '#ef4444'}
                />
                {lab.certifications?.length > 0 && (
                  <InfoRow label="Certifications" value={lab.certifications.join(', ')} color="#6366f1" />
                )}
              </div>

              {/* ✅ Tests Booked */}
              <TestsBooked
                booking={booking}
                testsData={testsData}
                testsLoading={testsLoading}
              />

              {/* ✅ Collection Type */}
              {booking.collectionType && (
                <div style={{ marginTop:12, padding:'12px 14px', background:'#f0fdf4', borderRadius:12, border:'1px solid rgba(16,185,129,0.15)' }}>
                  <p style={{ fontSize:11, color:'#94a3b8', margin:'0 0 4px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Collection</p>
                  <p style={{ fontSize:13, fontWeight:700, color:'#065f46', margin:0 }}>
                    {booking.collectionType === 'home' ? '🏠 Home Collection' : '📍 Lab Visit (Walk-in)'}
                  </p>
                  {booking.collectionType === 'home' && booking.collectionAddress && (
                    <p style={{ fontSize:12, color:'#64748b', margin:'6px 0 0' }}>
                      📍 {[
                        booking.collectionAddress.line1,
                        booking.collectionAddress.city,
                        booking.collectionAddress.state,
                        booking.collectionAddress.pinCode,
                      ].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p style={{ fontSize:12, color:'#64748b', margin:'4px 0 0' }}>
                    📅 {bookingDate} &nbsp; 🕐 {bookingTime}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* ── Booking Summary ── */}
          <Card>
            <SectionTitle icon="📋" title="Booking Summary" />
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              <InfoRow label="Booking Type"   value={typeLabel} />
              <InfoRow label="Date"           value={bookingDate} />
              <InfoRow label="Time"           value={bookingEndTime ? `${bookingTime} – ${bookingEndTime}` : bookingTime} />
              <InfoRow label="Status"         value={booking.status?.replace(/_/g,' ')} />
              <InfoRow label="Payment Status" value={booking.paymentStatus?.replace(/_/g,' ')} />
            </div>
          </Card>

          {/* ── Completed banner ── */}
          {booking.status === 'completed' && (
            <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.06),rgba(5,150,105,0.04))', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, padding:20, animation:'bd-in .3s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(16,185,129,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>✅</div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'#065f46', margin:0 }}>
                    {booking.type==='lab' ? 'Tests Completed' : 'Consultation Completed'}
                  </p>
                  <p style={{ fontSize:12, color:'#10b981', margin:'2px 0 0' }}>
                    {mounted && booking.updatedAt ? `Completed on ${new Date(booking.updatedAt).toLocaleDateString('en-IN',{dateStyle:'medium'})}` : '—'}
                  </p>
                </div>
              </div>
              {booking.doctorNotes && (
                <div style={{ marginTop:12, padding:12, background:'rgba(255,255,255,0.6)', borderRadius:12 }}>
                  <p style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>Doctor&apos;s Notes</p>
                  <p style={{ fontSize:13, color:'#334155', margin:0 }}>{booking.doctorNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Cancelled banner ── */}
          {booking.status === 'cancelled' && (
            <div style={{ background:'linear-gradient(135deg,rgba(239,68,68,0.06),rgba(249,115,22,0.04))', border:'1px solid rgba(239,68,68,0.2)', borderRadius:20, padding:20, animation:'bd-in .3s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>❌</div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'#991b1b', margin:0 }}>Booking Cancelled</p>
                  {booking.cancellationReason && (
                    <p style={{ fontSize:12, color:'#ef4444', margin:'2px 0 0' }}>Reason: {booking.cancellationReason}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Online meet ── */}
          {booking.type === 'online' && !isFinished && (
            <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.06),rgba(5,150,105,0.04))', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, padding:20 }}>
              <p style={{ fontSize:14, fontWeight:700, color:'#065f46', marginBottom:10 }}>online  Consultation</p>
              {!mounted ? (
                <div style={{ height:14, width:192, borderRadius:6, ...SHIMMER }} />
              ) : showJoin ? (
                <JoinBtn meetLink={booking.meetLink} />
              ) : (
                <p style={{ fontSize:12, color:'#10b981' }}>
                  {diffMins !== null && diffMins > 15
                    ? `Link available 15 min before — ${Math.floor(diffMins-15)} min remaining`
                    : 'Waiting for consultation window'}
                </p>
              )}
            </div>
          )}

          {/* ── Lab tracker ── */}
          {booking.type === 'lab' && !isFinished && booking.labStatus && (
            <Card>
              <SectionTitle icon="🧪" title="Lab Status" />
              <LabTracker status={booking.labStatus} />
              {booking.labStatus === 'report_ready' && (
                <ActionBtn onClick={handleReportDownload} loading={dlReport} variant="primary">
                  {dlReport ? 'Loading…' : '⬇ Download Report'}
                </ActionBtn>
              )}
            </Card>
          )}

          {/* ── Lab report for completed ── */}
          {booking.type === 'lab' && isFinished && booking.reportR2Key && (
            <Card style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'rgba(99,102,241,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📄</div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#1e293b', margin:0 }}>Lab Report</p>
                  <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>Ready for download</p>
                </div>
              </div>
              <ActionBtn onClick={handleReportDownload} loading={dlReport} variant="primary">
                {dlReport ? 'Loading…' : '⬇ Download'}
              </ActionBtn>
            </Card>
          )}

          {/* ── Payment Summary ── */}
          <Card>
            <SectionTitle icon="💰" title="Payment Summary" />
            {[
              { label:'Base Fee',                                       value:booking.baseFee,             show:true },
              { label:`Coupon (${booking.couponCode||''})`,            value:-booking.couponDiscount,      show:booking.couponDiscount>0 },
              { label:`Platform Fee (${booking.platformFeePercent}%)`, value:booking.platformFee,         show:true },
              { label:`GST (${booking.gstPercent}%)`,                  value:booking.gst,                 show:true },
              { label:'Platform Coupon',                               value:-booking.adminCouponDiscount, show:booking.adminCouponDiscount>0 },
            ].filter((r) => r.show).map(({ label, value }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f8fafc' }}>
                <span style={{ fontSize:13, color:'#64748b' }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:500, color:value<0?'#10b981':'#1e293b' }}>
                  {value<0?'-':''}₹{Math.abs(value||0).toFixed(2)}
                </span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4, borderTop:'1px solid #e2e8f0' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>
                {booking.paymentStatus==='paid' ? 'Total Paid' : 'Payable Amount'}
              </span>
              <span style={{ fontSize:14, fontWeight:800, color:'#6366f1' }}>
                ₹{booking.totalAmount?.toFixed(2)}
              </span>
            </div>

            {/* ✅ Razorpay payment reference */}
            {(booking.razorpayOrderId || booking.razorpayPaymentId) && (
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Payment Reference</p>
                {booking.razorpayOrderId   && <InfoRow label="Order ID"   value={booking.razorpayOrderId}   mono />}
                {booking.razorpayPaymentId && <InfoRow label="Payment ID" value={booking.razorpayPaymentId} mono />}
              </div>
            )}
          </Card>

          {/* ── Actions ── */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, animation:'bd-in .3s ease' }}>
            {booking.paymentStatus !== 'paid' && !isFinished && (
              <ActionBtn onClick={handlePayNow} loading={paying} variant="primary">
                {paying ? 'Opening Checkout…' : '💳 Pay Now'}
              </ActionBtn>
            )}
            <ActionBtn onClick={handleInvoiceDownload} loading={dlInvoice} variant="secondary">
              {dlInvoice ? 'Downloading…' : '🧾 Invoice'}
            </ActionBtn>
            {canCancel && (
              <ActionBtn onClick={() => setCancelOpen(true)} variant="danger">
                ✕ Cancel Booking
              </ActionBtn>
            )}
          </div>
        </div>

        <Footer />
      </div>

      <CancelModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        loading={cancelling}
        booking={booking}
      />
    </>
  )
}

function BackBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:5,
        fontSize:13, color: h?'#334155':'#64748b',
        background:'none', border:'none', cursor:'pointer', padding:0,
        transition:'color .15s ease',
      }}
    >
      ← Back to Bookings
    </button>
  )
}

function JoinBtn({ meetLink }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={() => window.open(meetLink, '_blank')}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'10px 18px', borderRadius:12, border:'none',
        background: h ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#10b981,#059669)',
        color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
        boxShadow: h ? '0 6px 20px rgba(16,185,129,0.5)' : '0 4px 14px rgba(16,185,129,0.35)',
        transition:'all .18s ease', minHeight:44,
      }}
    >
      🎥 Join Google Meet
    </button>
  )
}