'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials:'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes sl-spin { to{transform:rotate(360deg)} }
  @keyframes sl-in   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`

/* ─── Bank button ────────────────────────────────────────────────────── */
function BankBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'9px 16px', borderRadius:12,
        border:`1.5px solid ${h?'#6366f1':'#e2e8f0'}`,
        background:h?'rgba(99,102,241,0.06)':'#fff',
        color:h?'#6366f1':'#475569', fontSize:13, fontWeight:600,
        cursor:'pointer', transition:'all .15s ease',
      }}>
      🏦 Update Bank Account
    </button>
  )
}

/* ─── Download row btn ───────────────────────────────────────────────── */
function DlBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading} onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:'none',
        background:h?'rgba(99,102,241,0.1)':'transparent',
        color:h?'#6366f1':'#94a3b8', fontSize:12, fontWeight:600,
        cursor:isLoading?'not-allowed':'pointer', transition:'all .12s ease', opacity:isLoading?.6:1,
      }}>
      {isLoading ? <span style={{ width:12,height:12,borderRadius:'50%',border:'2px solid #94a3b8',borderTopColor:'transparent',animation:'sl-spin .7s linear infinite',display:'inline-block' }} /> : '⬇'}
      PDF
    </button>
  )
}

/* ─── Form input ─────────────────────────────────────────────────────── */
function BInput({ label, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'#475569' }}>{label}</label>}
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        style={{
          padding:'10px 12px', fontSize:13, fontFamily:'inherit',
          borderRadius:12, boxSizing:'border-box',
          border:`1.5px solid ${focused?'#6366f1':'#e2e8f0'}`,
          background:'#fff', color:'#0f172a', outline:'none',
          boxShadow:focused?'0 0 0 3px rgba(99,102,241,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
          transition:'all .15s ease', width:'100%',
        }}
      />
    </div>
  )
}

/* ─── Modal buttons ──────────────────────────────────────────────────── */
function MBtns({ onCancel, onSave, saving }) {
  const [h, setH] = useState(false)
  return (
    <div style={{ display:'flex', gap:10, marginTop:20 }}>
      <button onClick={onCancel} style={{ flex:1, padding:'11px', borderRadius:12, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}>
        Cancel
      </button>
      <button onClick={onSave} disabled={saving} onMouseEnter={() => !saving && setH(true)} onMouseLeave={() => setH(false)}
        style={{
          flex:1, padding:'11px', borderRadius:12, border:'none',
          background:saving?'#e2e8f0':h?'linear-gradient(135deg,#7c3aed,#6d28d9)':'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color:saving?'#94a3b8':'#fff', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s ease',
        }}>
        {saving && <span style={{ width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',animation:'sl-spin .7s linear infinite',display:'inline-block' }} />}
        Save Bank Account
      </button>
    </div>
  )
}

export default function HospitalSettlements() {
  const toast   = useToast()
  const mounted = useMounted()
  const [page,       setPage]       = useState(1)
  const [bankOpen,   setBankOpen]   = useState(false)
  const [bankSaving, setBankSaving] = useState(false)
  const [dlId,       setDlId]       = useState(null)
  const [bankForm,   setBankForm]   = useState({
    accountHolderName:'', accountNumber:'', ifscCode:'', bankName:'', upiId:'',
  })

  const { data: hospitalData }                   = useSWR('/api/hospitals?adminOnly=true', fetcher)
  const hospital                                 = hospitalData?.hospitals?.[0]
  const hospitalId                               = hospital?.id

  const { data: pendingData, mutate: mutatePending } = useSWR('/api/settlements/pending', fetcher)
  const myPending = (pendingData?.hospitals||[]).find((h) => h.id===hospitalId)

  const { data: historyData, isLoading } = useSWR(
    hospitalId ? `/api/settlements?page=${page}&limit=10&entityType=hospital&entityId=${hospitalId}` : null,
    fetcher
  )
  const settlements = historyData?.settlements || []
  const totalPages  = historyData?.pagination?.totalPages || 1

  const handleDownload = async (settlementId, settlementNumber) => {
    setDlId(settlementId)
    try {
      const res = await fetch(`/api/settlements/${settlementId}/download`, { credentials:'include' })
      if (!res.ok) { toast.error('Download failed'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href=url; a.download=`MEDLI-Settlement-${settlementNumber}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Settlement downloaded')
    } catch { toast.error('Download failed') }
    finally { setDlId(null) }
  }

  const saveBankAccount = async () => {
    if (!hospitalId) { toast.error('Hospital not found'); return }
    if (!bankForm.accountNumber||!bankForm.ifscCode) { toast.error('Account number and IFSC code are required'); return }
    setBankSaving(true)
    try {
      const res  = await fetch(`/api/hospitals/${hospitalId}/bank-account`, {
        method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include',
        body:JSON.stringify(bankForm),
      })
      const json = await res.json()
      if (json.success) { toast.success('Bank account saved'); setBankOpen(false); mutatePending() }
      else toast.error(json.error||'Failed to save')
    } catch { toast.error('Network error') }
    finally { setBankSaving(false) }
  }

  const cols = [
    { key:'settlementNumber', header:'Settlement #', render:(v) => <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700 }}>{v}</span> },
    { key:'totalBookings',    header:'Bookings',     render:(v) => <span style={{ fontSize:13, fontWeight:600 }}>{v||0}</span> },
    { key:'grossAmount',      header:'Revenue',      render:(v) => <span style={{ fontSize:13 }}>₹{Number(v||0).toLocaleString('en-IN')}</span> },
    { key:'refundsDeducted',  header:'Refunds',      render:(v) => v>0 ? <span style={{ fontSize:13, color:'#ef4444' }}>- ₹{Number(v).toLocaleString('en-IN')}</span> : <span style={{ fontSize:12, color:'#94a3b8' }}>None</span> },
    { key:'netSettlementAmount', header:'Transferred', render:(v) => <span style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>₹{Number(v||0).toLocaleString('en-IN')}</span> },
    { key:'status', header:'Status', render:(v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v}</Badge> },
    { key:'utrNumber', header:'UTR', render:(v) => v?<span style={{ fontFamily:'monospace', fontSize:11 }}>{v}</span>:<span style={{ color:'#94a3b8' }}>—</span> },
    { key:'transferredAt', header:'Date', render:(v) => mounted&&v?<span style={{ fontSize:12, color:'#64748b' }}>{new Date(v).toLocaleDateString('en-IN',{dateStyle:'medium'})}</span>:'—' },
    { key:'actions', header:'', render:(_,row) => <DlBtn onClick={() => handleDownload(row.id,row.settlementNumber)} loading={dlId===row.id} /> },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title="Settlements" subtitle="Your consultation revenue settlements"
        breadcrumbs={[{label:'Hospital Admin'},{label:'Settlements'}]}
        actions={<BankBtn onClick={() => setBankOpen(true)} />}
      />

      {/* Info banner */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.12)', borderRadius:14, padding:'12px 16px', marginBottom:20 }}>
        <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>ℹ️</span>
        <p style={{ fontSize:13, color:'#6366f1', margin:0, lineHeight:1.6 }}>
          You receive the full consultation fee paid by patients. Only refunds from cancelled bookings are deducted.
        </p>
      </div>

      {/* Pending settlement */}
      {myPending ? (
        <div style={{
          backgroundImage:'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.04))',
          border:'1px solid rgba(99,102,241,0.12)', borderRadius:20, padding:24, marginBottom:20,
          animation:'sl-in .3s ease',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'#6366f1', letterSpacing:'1px', textTransform:'uppercase', margin:'0 0 4px' }}>Pending Settlement</p>
              <p style={{ fontSize:13, color:'#6366f1', margin:0 }}>
                {myPending.totalBookings} paid booking{myPending.totalBookings!==1?'s':''} awaiting transfer
              </p>
            </div>
            <div style={{ width:44, height:44, background:'rgba(99,102,241,0.1)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>⏳</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:16 }}>
            {[
              { label:'Consultation Revenue', value:`₹${Number(myPending.grossAmount||0).toLocaleString('en-IN')}`, sub:`${myPending.totalBookings} bookings`, highlight:false },
              { label:'Refunds Deducted',     value:myPending.refundsDeducted>0?`- ₹${Number(myPending.refundsDeducted).toLocaleString('en-IN')}`:'None', sub:'Cancelled bookings', highlight:false, red:myPending.refundsDeducted>0 },
              { label:'You Will Receive',     value:`₹${Number(myPending.netSettlementAmount||0).toLocaleString('en-IN')}`, sub:'Transferred to bank', highlight:true },
            ].map(({ label, value, sub, highlight, red }) => (
              <div key={label} style={{
                background:'rgba(255,255,255,0.7)', borderRadius:14, padding:14,
                border:highlight?'2px solid rgba(16,185,129,0.3)':'none',
              }}>
                <p style={{ fontSize:11, color:'#64748b', margin:'0 0 4px' }}>{label}</p>
                <p style={{ fontSize:18, fontWeight:800, color:highlight?'#059669':red?'#ef4444':'#1e293b', margin:'0 0 2px' }}>{value}</p>
                <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{sub}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize:12, color:'#6366f1', margin:0 }}>
            💡 Contact support@medli.in if your settlement is overdue.
          </p>
        </div>
      ) : pendingData && (
        <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:16, padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>✅</span>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:'#065f46', margin:0 }}>All caught up!</p>
            <p style={{ fontSize:11, color:'#10b981', margin:0 }}>No pending settlements at this time.</p>
          </div>
        </div>
      )}

      {/* History */}
      <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #f8fafc' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>Settlement History</h3>
        </div>
        <div style={{ padding:0 }}>
          {!hospitalId ? (
            <div style={{ padding:32 }}>
              <EmptyState title="Loading..." message="Fetching hospital data" />
            </div>
          ) : (
            <DataTable columns={cols} data={settlements} loading={isLoading}
              page={page} totalPages={totalPages} onPageChange={setPage}
              emptyTitle="No settlements yet" emptyMessage="Settlements appear after MEDLI processes your payments" />
          )}
        </div>
      </div>

      {/* Bank Modal */}
      <Modal open={bankOpen} onClose={() => setBankOpen(false)} title="Update Bank Account" size="md">
        <p style={{ fontSize:13, color:'#64748b', margin:'0 0 16px' }}>Settlement amounts will be transferred directly to this account.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <BInput label="Account Holder Name *" value={bankForm.accountHolderName} onChange={(e) => setBankForm((f) => ({...f,accountHolderName:e.target.value}))} placeholder="As per bank records" />
          <BInput label="Account Number *"       value={bankForm.accountNumber}      onChange={(e) => setBankForm((f) => ({...f,accountNumber:e.target.value}))} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <BInput label="IFSC Code *" value={bankForm.ifscCode} onChange={(e) => setBankForm((f) => ({...f,ifscCode:e.target.value.toUpperCase()}))} placeholder="SBIN0001234" />
            <BInput label="Bank Name"   value={bankForm.bankName} onChange={(e) => setBankForm((f) => ({...f,bankName:e.target.value}))} />
          </div>
          <BInput label="UPI ID (Optional)" value={bankForm.upiId} onChange={(e) => setBankForm((f) => ({...f,upiId:e.target.value}))} placeholder="name@upi" />
          <MBtns onCancel={() => setBankOpen(false)} onSave={saveBankAccount} saving={bankSaving} />
        </div>
      </Modal>
    </>
  )
}