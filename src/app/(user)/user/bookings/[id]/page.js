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
`
const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'bd-shimmer 1.5s linear infinite',
}

/* ─── Lab Tracker ────────────────────────────────────────────────────── */
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
                fontSize: i < currentIndex ? 14 : 18,
                fontWeight: 700,
                background: done
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : '#f1f5f9',
                color: done ? '#fff' : '#94a3b8',
                boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                transition: 'all .3s ease',
              }}>
                {i < currentIndex ? '✓' : step.icon}
              </div>
              <p style={{
                fontSize: 10, fontWeight: 500, textAlign: 'center',
                maxWidth: 64, lineHeight: 1.3,
                color: done ? '#6366f1' : '#94a3b8',
              }}>
                {step.label}
              </p>
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: 2, margin: '0 4px',
                marginBottom: 20,
                background: i < currentIndex
                  ? 'linear-gradient(90deg,#6366f1,#8b5cf6)'
                  : '#f1f5f9',
                transition: 'background .3s ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Action Button ──────────────────────────────────────────────────── */
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
      onClick={onClick}
      disabled={isDisabled}
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
      {isLoading && (
        <span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid currentColor', borderTopColor:'transparent', animation:'bd-spin .7s linear infinite', display:'inline-block', opacity:0.6 }} />
      )}
      {children}
    </button>
  )
}

/* ─── Info row ───────────────────────────────────────────────────────── */
function InfoRow({ label, value, mono, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f8fafc' }}>
      <span style={{ fontSize:12, color:'#94a3b8' }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, color:color||'#334155', fontFamily:mono?'monospace':undefined }}>{value}</span>
    </div>
  )
}

/* ─── Cancel Confirm Modal ───────────────────────────────────────────── */
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
              Refund based on cancellation policy:<br/>
              &gt;24h = 100% · 12-24h = 50% · 4-12h = 25% · &lt;4h = 0%
            </p>
          </div>
          {booking && (
            <div style={{ background:'#f8fafc', borderRadius:12, padding:'4px 0', marginBottom:16 }}>
              <InfoRow label="Booking ID" value={booking.bookingId} mono />
              <InfoRow label="Amount" value={`₹${booking.totalAmount}`} />
              <InfoRow label="Status" value={booking.status} />
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <ModalBtn label="Keep Booking" onClick={onClose} disabled={loading} variant="secondary" />
            <ModalBtn label="Cancel Booking" onClick={onConfirm} loading={loading} variant="danger" />
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
      onClick={onClick}
      disabled={isDisabled}
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

/* ─── Main Page ──────────────────────────────────────────────────────── */
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

  useEffect(() => {
    if (!booking?.onePayTxnId || booking.paymentStatus === 'paid') return
    let cancelled = false
    const verify = async () => {
      try {
        await fetch(`/api/payments/verify/${booking.onePayTxnId}`, { credentials:'include' })
        if (!cancelled) mutate()
      } catch {}
    }
    verify()
    return () => { cancelled = true }
  }, [booking?.onePayTxnId, booking?.paymentStatus, mutate])

  const now      = mounted ? new Date() : null
  const diffMins = mounted && booking?.startTime && now
    ? (new Date(booking.startTime) - now) / 60_000 : null

  const showJoin  = booking?.type === 'online' && booking?.meetLink
    && diffMins !== null && diffMins <= 15 && diffMins >= -30

  const canCancel = booking
    ? ['created','pending_payment','confirmed'].includes(booking.status) : false

  const isFinished = ['completed','cancelled','refunded','no_show'].includes(booking?.status)

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
      const res  = await fetch(`/api/bookings/${id}/cancel`, {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify({ reason:'Cancelled by patient' }),
      })
      const json = await res.json()
      if (json.success) {
        const refund = json.data?.refundAmount || 0
        toast.success(refund>0 ? `Cancelled. Refund ₹${refund} will be processed.` : 'Booking cancelled.')
        mutate(); setCancelOpen(false); router.push('/user/bookings')
      } else toast.error(json.error||'Cancel failed')
    } catch { toast.error('Cancel failed. Please try again.') }
    finally { setCancelling(false) }
  }

  const handlePayNow = async () => {
    setPaying(true)
    try {
      const res  = await fetch('/api/payments/create-order', {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify({ bookingId:id }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error||'Failed to create payment order'); return }
      const { merchantId, reqData, paymentUrl } = json.data
      if (!merchantId||!reqData||!paymentUrl) { toast.error('Invalid payment response'); return }
      const form = document.createElement('form'); form.method='POST'; form.action=paymentUrl; form.style.display='none'
      const addField = (n,v) => { const i=document.createElement('input'); i.type='hidden'; i.name=n; i.value=String(v); form.appendChild(i) }
      addField('merchantId', merchantId); addField('reqData', reqData)
      document.body.appendChild(form); form.submit()
    } catch { toast.error('Could not start payment. Please try again.') }
    finally { setPaying(false) }
  }

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

  return (
    <>
      <style>{KF}</style>
      <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
        <Navbar />

        <div style={{ maxWidth:640, margin:'0 auto', padding:'88px 16px 80px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Back */}
          <BackBtn onClick={() => router.push('/user/bookings')} />

          {/* Header card */}
          <div style={{ background:'#fff', borderRadius:20, padding:20, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', animation:'bd-in .3s ease' }}>
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
                ['Type',    booking.type],
                ['Date',    mounted ? new Date(booking.startTime).toLocaleDateString('en-IN') : '—'],
                ['Time',    mounted ? new Date(booking.startTime).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—'],
                ['Payment', booking.paymentStatus],
              ].map(([k,v]) => (
                <div key={k} style={{ background:'#f8fafc', borderRadius:12, padding:'10px 12px' }}>
                  <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{k}</p>
                  <p style={{ fontSize:13, fontWeight:500, color:'#1e293b', margin:'2px 0 0', textTransform:'capitalize' }}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Completed banner */}
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

          {/* Cancelled banner */}
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
              {booking.refundAmount > 0 && (
                <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(255,255,255,0.6)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'#64748b' }}>Refund Amount</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>₹{booking.refundAmount?.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Online meet */}
          {booking.type === 'online' && !isFinished && (
            <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.06),rgba(5,150,105,0.04))', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, padding:20, animation:'bd-in .3s ease' }}>
              <p style={{ fontSize:14, fontWeight:700, color:'#065f46', marginBottom:10 }}>Video Consultation</p>
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

          {/* Lab tracker */}
          {booking.type === 'lab' && !isFinished && booking.labStatus && (
            <div style={{ background:'#fff', borderRadius:20, padding:20, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', animation:'bd-in .3s ease' }}>
              <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', marginBottom:4 }}>🧪 Lab Status</p>
              <LabTracker status={booking.labStatus} />
              {booking.labStatus === 'report_ready' && (
                <ActionBtn onClick={handleReportDownload} loading={dlReport} variant="primary">
                  {dlReport ? 'Loading…' : '⬇ Download Report'}
                </ActionBtn>
              )}
            </div>
          )}

          {/* Lab report for completed */}
          {booking.type === 'lab' && isFinished && booking.reportR2Key && (
            <div style={{ background:'#fff', borderRadius:20, padding:18, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between', animation:'bd-in .3s ease' }}>
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
            </div>
          )}

          {/* Payment summary */}
          <div style={{ background:'#fff', borderRadius:20, padding:20, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', animation:'bd-in .3s ease' }}>
            <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', marginBottom:12 }}>Payment Summary</p>
            {[
              { label:'Base Fee',                              value:booking.baseFee,             show:true },
              { label:`Coupon (${booking.couponCode||''})`,   value:-booking.couponDiscount,      show:booking.couponDiscount>0 },
              { label:`Platform Fee (${booking.platformFeePercent}%)`, value:booking.platformFee, show:true },
              { label:`GST (${booking.gstPercent}%)`,         value:booking.gst,                 show:true },
              { label:'Platform Coupon',                      value:-booking.adminCouponDiscount, show:booking.adminCouponDiscount>0 },
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
            {booking.refundAmount > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
                <span style={{ fontSize:13, color:'#64748b' }}>Refund Processed</span>
                <span style={{ fontSize:13, fontWeight:600, color:'#10b981' }}>₹{booking.refundAmount?.toFixed(2)}</span>
              </div>
            )}

            {/* 1Pay details */}
            {(booking.onePayTxnId || booking.onePayPgRefId) && (
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Payment Details</p>
                <InfoRow label="Gateway" value="1Pay Payment Gateway" />
                {booking.onePayTxnId && <InfoRow label="Transaction ID" value={booking.onePayTxnId} mono />}
                {booking.onePayPgRefId && <InfoRow label="PG Reference" value={booking.onePayPgRefId} mono />}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, animation:'bd-in .3s ease' }}>
            {booking.paymentStatus !== 'paid' && !isFinished && (
              <ActionBtn onClick={handlePayNow} loading={paying} variant="primary">
                {paying ? 'Redirecting…' : '💳 Pay Now'}
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