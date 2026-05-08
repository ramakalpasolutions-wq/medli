'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials:'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes dr-slide { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes dr-fade  { from{opacity:0} to{opacity:1} }
  @keyframes dr-spin  { to{transform:rotate(360deg)} }
`

const SPECIALIZATIONS = [
  'General Medicine','Cardiology','Orthopedics','Pediatrics',
  'Gynecology','Neurology','Dermatology','ENT','Ophthalmology','Psychiatry',
]

/* ─── Add button ─────────────────────────────────────────────────────── */
function AddBtn({ onClick }) {
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
      + Add Doctor
    </button>
  )
}

/* ─── Spec pill ──────────────────────────────────────────────────────── */
function SpecPill({ label, selected, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding:'5px 10px', borderRadius:8, border:'none',
        fontSize:12, fontWeight:500, cursor:'pointer',
        background:selected?'linear-gradient(135deg,#6366f1,#8b5cf6)':h?'#e2e8f0':'#f1f5f9',
        color:selected?'#fff':'#64748b',
        transition:'all .12s ease',
      }}>
      {label}
    </button>
  )
}

/* ─── Toggle pill ────────────────────────────────────────────────────── */
function TypePill({ label, selected, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        flex:1, padding:'10px', borderRadius:12,
        border:`2px solid ${selected?'#6366f1':h?'#c7d2fe':'#e2e8f0'}`,
        background:selected?'rgba(99,102,241,0.08)':h?'rgba(99,102,241,0.03)':'#fff',
        color:selected?'#6366f1':'#64748b',
        fontSize:13, fontWeight:selected?600:500, cursor:'pointer',
        transition:'all .15s ease',
      }}>
      {label}
    </button>
  )
}

/* ─── Form input ─────────────────────────────────────────────────────── */
function FormInput({ label, ...props }) {
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
    <button onClick={onClick} onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      disabled={isLoading}
      style={{
        width:'100%', padding:'13px', borderRadius:12, border:'none',
        background:isLoading?'#e2e8f0':h?'linear-gradient(135deg,#7c3aed,#6d28d9)':'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color:isLoading?'#94a3b8':'#fff',
        fontSize:14, fontWeight:600, cursor:isLoading?'not-allowed':'pointer',
        boxShadow:isLoading?'none':h?'0 8px 24px rgba(99,102,241,0.5)':'0 4px 14px rgba(99,102,241,0.3)',
        transition:'all .18s ease',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      }}>
      {isLoading && <span style={{ width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',animation:'dr-spin .7s linear infinite',display:'inline-block' }} />}
      💾 Save Doctor
    </button>
  )
}

export default function HospitalDoctors() {
  const toast = useToast()
  const [panelOpen, setPanelOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({
    name:'', specialization:[], experience:'',
    consultationFee:{ online:'', offline:'' },
    consultationTypes:['offline'],
  })

  const { data: hospitalData } = useSWR('/api/hospitals?adminOnly=true', fetcher)
  const hospitalId = hospitalData?.hospitals?.[0]?.id

  const { data, isLoading, mutate } = useSWR(
    hospitalId ? `/api/hospitals/${hospitalId}/doctors` : null, fetcher
  )
  const doctors = Array.isArray(data) ? data : (data?.doctors||[])

  useEffect(() => {
    if (panelOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [panelOpen])

  const toggleSpec = (spec) => {
    setForm((f) => ({
      ...f,
      specialization: f.specialization.includes(spec)
        ? f.specialization.filter((s) => s!==spec)
        : [...f.specialization, spec],
    }))
  }

  const toggleConsult = (t) => {
    setForm((f) => ({
      ...f,
      consultationTypes: f.consultationTypes.includes(t)
        ? f.consultationTypes.filter((x) => x!==t)
        : [...f.consultationTypes, t],
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Doctor name is required'); return }
    if (!hospitalId) { toast.error('Hospital not found'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/doctors', {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body:JSON.stringify({
          hospitalId,
          name:form.name,
          specialization:form.specialization,
          experience:Number(form.experience)||0,
          consultationTypes:form.consultationTypes,
          consultationFee:{
            online:Number(form.consultationFee.online)||0,
            offline:Number(form.consultationFee.offline)||0,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Doctor added')
        mutate(); setPanelOpen(false)
        setForm({ name:'', specialization:[], experience:'', consultationFee:{online:'',offline:''}, consultationTypes:['offline'] })
      } else toast.error(json.error||'Failed to add doctor')
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key:'name',           header:'Name',        render:(v) => <span style={{ fontSize:13,fontWeight:600,color:'#1e293b' }}>Dr. {v}</span> },
    { key:'specialization', header:'Specialty',   render:(v) => <span style={{ fontSize:12,color:'#64748b' }}>{(v||[]).join(', ')||'—'}</span> },
    { key:'experience',     header:'Experience',  render:(v) => v?`${v} yrs`:'—' },
    { key:'isVerified',     header:'Verified',    render:(v) => <Badge variant={v?'success':'warning'} size="sm">{v?'Verified':'Pending'}</Badge> },
    { key:'isActive',       header:'Status',      render:(v) => <Badge variant={v?'success':'danger'} size="sm">{v?'Active':'Inactive'}</Badge> },
    { key:'consultationFee',header:'Fee',         render:(v) => v?.offline?`₹${v.offline}`:'—' },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title="Doctors" subtitle="Manage hospital doctors"
        breadcrumbs={[{label:'Hospital Admin'},{label:'Doctors'}]}
        actions={<AddBtn onClick={() => setPanelOpen(true)} />}
      />

      <DataTable columns={columns} data={doctors} loading={isLoading} emptyTitle="No doctors yet" emptyMessage="Add your first doctor" />

      {/* Slide panel */}
      {panelOpen && (
        <>
          <div onClick={() => setPanelOpen(false)} style={{
            position:'fixed', inset:0, zIndex:900,
            background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)',
            animation:'dr-fade .2s ease',
          }} />
          <div style={{
            position:'fixed', right:0, top:0, bottom:0,
            width:'min(440px,92vw)',
            background:'#fff', zIndex:910,
            display:'flex', flexDirection:'column',
            boxShadow:'-8px 0 40px rgba(0,0,0,0.12)',
            animation:'dr-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {/* Panel header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#1e293b', margin:0 }}>Add New Doctor</h3>
              <PanelCloseBtn onClick={() => setPanelOpen(false)} />
            </div>

            {/* Body */}
            <div style={{ flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:16 }}>
              <FormInput label="Doctor Name *" value={form.name} onChange={(e) => setForm((f) => ({...f,name:e.target.value}))} placeholder="Full name" />
              <FormInput label="Experience (years)" type="number" value={form.experience} onChange={(e) => setForm((f) => ({...f,experience:e.target.value}))} placeholder="0" />

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:8 }}>Specializations</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {SPECIALIZATIONS.map((spec) => (
                    <SpecPill key={spec} label={spec} selected={form.specialization.includes(spec)} onClick={() => toggleSpec(spec)} />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:8 }}>Consultation Types</label>
                <div style={{ display:'flex', gap:10 }}>
                  <TypePill label="In-Person" selected={form.consultationTypes.includes('offline')} onClick={() => toggleConsult('offline')} />
                  <TypePill label="Online"    selected={form.consultationTypes.includes('online')}  onClick={() => toggleConsult('online')}  />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <FormInput label="Offline Fee (₹)" type="number" value={form.consultationFee.offline}
                  onChange={(e) => setForm((f) => ({...f,consultationFee:{...f.consultationFee,offline:e.target.value}}))} />
                <FormInput label="Online Fee (₹)"  type="number" value={form.consultationFee.online}
                  onChange={(e) => setForm((f) => ({...f,consultationFee:{...f.consultationFee,online:e.target.value}}))} />
              </div>
            </div>

            <div style={{ padding:'16px 20px', borderTop:'1px solid #f1f5f9', flexShrink:0 }}>
              <SaveBtn onClick={handleSave} loading={saving} />
            </div>
          </div>
        </>
      )}
    </>
  )
}

function PanelCloseBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width:32, height:32, borderRadius:8, border:'none',
        background:h?'#f1f5f9':'transparent', cursor:'pointer',
        fontSize:18, color:'#64748b', display:'flex', alignItems:'center',
        justifyContent:'center', transition:'background .12s ease',
      }}>
      ✕
    </button>
  )
}