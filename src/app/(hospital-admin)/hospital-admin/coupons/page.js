'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials:'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes cp-spin{to{transform:rotate(360deg)}}`

/* ─── Form input ─────────────────────────────────────────────────────── */
function CInput({ label, ...props }) {
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

/* ─── Create button ──────────────────────────────────────────────────── */
function CreateBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'9px 16px', borderRadius:12, border:'none',
        background:h?'linear-gradient(135deg,#7c3aed,#6d28d9)':'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer',
        boxShadow:h?'0 6px 20px rgba(99,102,241,0.45)':'0 4px 14px rgba(99,102,241,0.3)',
        transition:'all .18s ease',
      }}>
      + Create Coupon
    </button>
  )
}

/* ─── Discount type toggle ───────────────────────────────────────────── */
function TypeToggle({ value, onChange }) {
  return (
    <div>
      <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:6 }}>Discount Type</label>
      <div style={{ display:'flex', gap:6 }}>
        {[{key:'percent',label:'Percent %'},{key:'fixed',label:'Fixed ₹'}].map((t) => (
          <TypeBtn key={t.key} label={t.label} active={value===t.key} onClick={() => onChange(t.key)} />
        ))}
      </div>
    </div>
  )
}

function TypeBtn({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        flex:1, padding:'9px', borderRadius:10, border:'none',
        background:active?'linear-gradient(135deg,#6366f1,#8b5cf6)':h?'#e2e8f0':'#f1f5f9',
        color:active?'#fff':'#64748b',
        fontSize:13, fontWeight:active?600:500, cursor:'pointer',
        transition:'all .12s ease',
      }}>
      {label}
    </button>
  )
}

/* ─── Save / Cancel buttons ──────────────────────────────────────────── */
function ModalBtns({ onCancel, onSave, saving }) {
  const [sh, setSh] = useState(false)
  return (
    <div style={{ display:'flex', gap:10, marginTop:20 }}>
      <button onClick={onCancel}
        style={{ flex:1, padding:'11px', borderRadius:12, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}>
        Cancel
      </button>
      <button onClick={onSave} disabled={saving} onMouseEnter={() => setSh(true)} onMouseLeave={() => setSh(false)}
        style={{
          flex:1, padding:'11px', borderRadius:12, border:'none',
          background:saving?'#e2e8f0':sh?'linear-gradient(135deg,#7c3aed,#6d28d9)':'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color:saving?'#94a3b8':'#fff', fontSize:13, fontWeight:600,
          cursor:saving?'not-allowed':'pointer', transition:'all .15s ease',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
        {saving && <span style={{ width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',animation:'cp-spin .7s linear infinite',display:'inline-block' }} />}
        Create Coupon
      </button>
    </div>
  )
}

/* ─── Toggle coupon button ───────────────────────────────────────────── */
function ToggleBtn({ isActive, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:8, border:'none', cursor:'pointer',
        background:h?(isActive?'rgba(239,68,68,0.1)':'rgba(16,185,129,0.1)'):'transparent',
        color:isActive?'#ef4444':'#10b981',
        transition:'all .12s ease',
      }}>
      {isActive?'Disable':'Enable'}
    </button>
  )
}

export default function HospitalCoupons() {
  const toast = useToast()
  const [page,   setPage]   = useState(1)
  const [open,   setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState({
    code:'', name:'', discountType:'percent', discountValue:'',
    maxDiscountAmount:'', minOrderAmount:'', validFrom:'', validUntil:'',
    totalUsageLimit:'', perUserLimit:'1',
  })

  const { data, isLoading, mutate } = useSWR(`/api/coupons?page=${page}&limit=20&type=hospital`, fetcher)
  const coupons    = data?.coupons   || []
  const totalPages = data?.pagination?.totalPages || 1

  const handleSave = async () => {
    if (!form.code||!form.discountValue) { toast.error('Code and discount value are required'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/coupons', {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body:JSON.stringify({
          ...form, couponType:'hospital',
          discountValue:Number(form.discountValue),
          maxDiscountAmount:form.maxDiscountAmount?Number(form.maxDiscountAmount):null,
          minOrderAmount:form.minOrderAmount?Number(form.minOrderAmount):0,
          totalUsageLimit:form.totalUsageLimit?Number(form.totalUsageLimit):null,
          perUserLimit:Number(form.perUserLimit)||1,
          validFrom:form.validFrom||null, validUntil:form.validUntil||null,
        }),
      })
      const json = await res.json()
      if (json.success) { toast.success('Coupon created'); setOpen(false); mutate() }
      else toast.error(json.error)
    } catch { toast.error('Failed to create coupon') }
    finally { setSaving(false) }
  }

  const toggleCoupon = async (id) => {
    try {
      const res  = await fetch(`/api/coupons/${id}/toggle`, { method:'PATCH', credentials:'include' })
      const json = await res.json()
      json.success ? toast.success('Coupon updated') : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed') }
  }

  const columns = [
    { key:'code',          header:'Code',   render:(v) => <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'#6366f1' }}>{v}</span> },
    { key:'name',          header:'Name',   render:(v) => <span style={{ fontSize:13, color:'#475569' }}>{v||'—'}</span> },
    { key:'discountType',  header:'Discount', render:(v,row) => <span style={{ fontSize:12, color:'#334155' }}>{row.discountValue}{v==='percent'?'%':' ₹'} off</span> },
    { key:'currentUsageCount', header:'Used', render:(v,row) => <span style={{ fontSize:12, color:'#64748b' }}>{v||0}{row.totalUsageLimit?'/'+row.totalUsageLimit:''}</span> },
    { key:'isActive', header:'Status', render:(v) => <Badge variant={v?'success':'danger'} size="sm">{v?'Active':'Inactive'}</Badge> },
    { key:'actions', header:'', render:(_,row) => <ToggleBtn isActive={row.isActive} onClick={() => toggleCoupon(row.id)} /> },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title="Coupons" subtitle="Hospital discount coupons"
        breadcrumbs={[{label:'Hospital Admin'},{label:'Coupons'}]}
        actions={<CreateBtn onClick={() => setOpen(true)} />}
      />

      {/* Info banner */}
      <div style={{
        display:'flex', alignItems:'flex-start', gap:10,
        background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)',
        borderRadius:14, padding:'12px 16px', marginBottom:20,
      }}>
        <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>ℹ️</span>
        <p style={{ fontSize:13, color:'#6366f1', margin:0, lineHeight:1.6 }}>
          Hospital coupons discount the consultation fee. Platform fee is applied on the discounted amount.
        </p>
      </div>

      <DataTable columns={columns} data={coupons} loading={isLoading}
        page={page} totalPages={totalPages} onPageChange={setPage}
        emptyTitle="No coupons yet" emptyMessage="Create your first coupon" />

      <Modal open={open} onClose={() => setOpen(false)} title="Create Hospital Coupon" size="md">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <CInput label="Coupon Code *" value={form.code} onChange={(e) => setForm((f) => ({...f,code:e.target.value.toUpperCase()}))} placeholder="SAVE20" />
            <CInput label="Coupon Name"   value={form.name} onChange={(e) => setForm((f) => ({...f,name:e.target.value}))} placeholder="Summer offer" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <TypeToggle value={form.discountType} onChange={(t) => setForm((f) => ({...f,discountType:t}))} />
            <CInput label="Discount Value *" type="number" value={form.discountValue}
              onChange={(e) => setForm((f) => ({...f,discountValue:e.target.value}))}
              placeholder={form.discountType==='percent'?'20':'100'} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <CInput label="Min Order (₹)"    type="number" value={form.minOrderAmount}   onChange={(e) => setForm((f) => ({...f,minOrderAmount:e.target.value}))} placeholder="0" />
            <CInput label="Max Discount (₹)" type="number" value={form.maxDiscountAmount} onChange={(e) => setForm((f) => ({...f,maxDiscountAmount:e.target.value}))} placeholder="Optional" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <CInput label="Valid From"  type="date" value={form.validFrom}  onChange={(e) => setForm((f) => ({...f,validFrom:e.target.value}))} />
            <CInput label="Valid Until" type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({...f,validUntil:e.target.value}))} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <CInput label="Total Usage Limit" type="number" value={form.totalUsageLimit} onChange={(e) => setForm((f) => ({...f,totalUsageLimit:e.target.value}))} placeholder="Unlimited" />
            <CInput label="Per User Limit"    type="number" value={form.perUserLimit}    onChange={(e) => setForm((f) => ({...f,perUserLimit:e.target.value}))} placeholder="1" />
          </div>
          <ModalBtns onCancel={() => setOpen(false)} onSave={handleSave} saving={saving} />
        </div>
      </Modal>
    </>
  )
}