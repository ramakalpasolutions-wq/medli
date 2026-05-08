'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials:'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes st-spin{to{transform:rotate(360deg)}}`

/* ─── Input ──────────────────────────────────────────────────────────── */
function SInput({ label, ...props }) {
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

/* ─── Save button ────────────────────────────────────────────────────── */
function SaveBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading} onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'9px 18px', borderRadius:12, border:'none',
        background:isLoading?'#e2e8f0':h?'linear-gradient(135deg,#7c3aed,#6d28d9)':'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color:isLoading?'#94a3b8':'#fff', fontSize:13, fontWeight:600,
        cursor:isLoading?'not-allowed':'pointer',
        boxShadow:isLoading?'none':h?'0 6px 20px rgba(99,102,241,0.45)':'0 4px 14px rgba(99,102,241,0.3)',
        transition:'all .18s ease',
      }}>
      {isLoading && <span style={{ width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',animation:'st-spin .7s linear infinite',display:'inline-block' }} />}
      💾 Save Changes
    </button>
  )
}

/* ─── Section Card ───────────────────────────────────────────────────── */
function SCard({ title, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #f8fafc' }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>{title}</h3>
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  )
}

export default function HospitalSettings() {
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const { data: hospitalData, mutate } = useSWR('/api/hospitals?adminOnly=true', fetcher)
  const hospital   = hospitalData?.hospitals?.[0]
  const hospitalId = hospital?.id

  const [form, setForm] = useState({
    name:         hospital?.name         || '',
    contactPhone: hospital?.contactPhone || '',
    contactEmail: hospital?.contactEmail || '',
    departments:  (hospital?.departments||[]).join(', '),
    address:{
      line1:   hospital?.address?.line1   || '',
      city:    hospital?.address?.city    || '',
      state:   hospital?.address?.state   || '',
      pinCode: hospital?.address?.pinCode || '',
    },
  })

  const save = async () => {
    if (!hospitalId) { toast.error('Hospital not found'); return }
    setSaving(true)
    try {
      const res  = await fetch(`/api/hospitals/${hospitalId}`, {
        method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include',
        body:JSON.stringify({
          name:form.name, contactPhone:form.contactPhone, contactEmail:form.contactEmail,
          departments:form.departments.split(',').map((d)=>d.trim()).filter(Boolean),
          address:form.address,
        }),
      })
      const json = await res.json()
      json.success ? toast.success('Settings saved') : toast.error(json.error)
      if (json.success) mutate()
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title="Settings" subtitle="Hospital configuration"
        breadcrumbs={[{label:'Hospital Admin'},{label:'Settings'}]}
        actions={<SaveBtn onClick={save} loading={saving} />}
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
        <SCard title="Basic Information">
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <SInput label="Hospital Name"  value={form.name}         onChange={(e) => setForm((f) => ({...f,name:e.target.value}))} />
            <SInput label="Phone"          value={form.contactPhone}  onChange={(e) => setForm((f) => ({...f,contactPhone:e.target.value}))} />
            <SInput label="Email"          value={form.contactEmail}  onChange={(e) => setForm((f) => ({...f,contactEmail:e.target.value}))} />
            <SInput label="Departments (comma separated)" value={form.departments}
              onChange={(e) => setForm((f) => ({...f,departments:e.target.value}))}
              placeholder="Cardiology, Orthopedics, ..." />
          </div>
        </SCard>

        <SCard title="Address">
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <SInput label="Street Address" value={form.address.line1}   onChange={(e) => setForm((f) => ({...f,address:{...f.address,line1:e.target.value}}))} />
            <SInput label="City"           value={form.address.city}    onChange={(e) => setForm((f) => ({...f,address:{...f.address,city:e.target.value}}))} />
            <SInput label="State"          value={form.address.state}   onChange={(e) => setForm((f) => ({...f,address:{...f.address,state:e.target.value}}))} />
            <SInput label="PIN Code"       value={form.address.pinCode} onChange={(e) => setForm((f) => ({...f,address:{...f.address,pinCode:e.target.value}}))} maxLength={6} />
          </div>
        </SCard>
      </div>
    </>
  )
}