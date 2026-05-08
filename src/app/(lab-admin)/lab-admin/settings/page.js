'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes ls2-spin{to{transform:rotate(360deg)}}`

const CERTIFICATIONS = ['NABL','ISO 15189','ISO 9001','CAP','JCI']

/* ─── Input ──────────────────────────────────────────────────────────── */
function LSInput({ label, ...props }) {
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
          border:`1.5px solid ${focused?'#10b981':'#e2e8f0'}`,
          background:'#fff', color:'#0f172a', outline:'none',
          boxShadow:focused?'0 0 0 3px rgba(16,185,129,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
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
        background:isLoading?'#e2e8f0':h?'linear-gradient(135deg,#059669,#047857)':'linear-gradient(135deg,#10b981,#059669)',
        color:isLoading?'#94a3b8':'#fff', fontSize:13, fontWeight:600,
        cursor:isLoading?'not-allowed':'pointer',
        boxShadow:isLoading?'none':h?'0 6px 20px rgba(16,185,129,0.45)':'0 4px 14px rgba(16,185,129,0.3)',
        transition:'all .18s ease',
      }}>
      {isLoading && <span style={{ width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',animation:'ls2-spin .7s linear infinite',display:'inline-block' }} />}
      💾 Save Changes
    </button>
  )
}

/* ─── Section card ───────────────────────────────────────────────────── */
function LSCard({ title, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #f8fafc' }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>{title}</h3>
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  )
}

/* ─── Toggle ─────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      style={{
        width:44, height:24, borderRadius:12, position:'relative',
        border:'none', cursor:'pointer', flexShrink:0,
        background:checked?'linear-gradient(135deg,#10b981,#059669)':'#e2e8f0',
        boxShadow:checked?'0 2px 8px rgba(16,185,129,0.35)':'none',
        transition:'all .2s ease',
      }}>
      <div style={{
        width:20, height:20, borderRadius:'50%', background:'#fff',
        position:'absolute', top:2, left:checked?22:2,
        transition:'left .2s ease', boxShadow:'0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}

/* ─── Cert pill ──────────────────────────────────────────────────────── */
function CertPill({ cert, selected, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding:'8px 14px', borderRadius:10, border:'none',
        fontSize:13, fontWeight:selected?600:500, cursor:'pointer',
        background:selected?'linear-gradient(135deg,#10b981,#059669)':h?'#e2e8f0':'#f1f5f9',
        color:selected?'#fff':'#64748b',
        transition:'all .12s ease',
      }}>
      {selected?'✓ ':''}{cert}
    </button>
  )
}

/* ─── PIN badge ──────────────────────────────────────────────────────── */
function PinBadge({ pin, onRemove }) {
  const [h, setH] = useState(false)
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'4px 10px', borderRadius:8,
      background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)',
      color:'#059669', fontSize:12, fontFamily:'monospace', fontWeight:600,
    }}>
      {pin}
      <button onClick={onRemove} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ background:'none', border:'none', cursor:'pointer', color:h?'#ef4444':'#94a3b8', fontSize:14, lineHeight:1, padding:0, display:'flex', alignItems:'center' }}>
        ✕
      </button>
    </span>
  )
}

/* ─── Add pin button ─────────────────────────────────────────────────── */
function AddPinBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding:'10px 14px', borderRadius:12,
        border:`1.5px solid ${h?'#10b981':'#e2e8f0'}`,
        background:h?'rgba(16,185,129,0.06)':'#fff',
        color:h?'#10b981':'#475569', fontSize:13, fontWeight:600,
        cursor:'pointer', transition:'all .15s ease', flexShrink:0,
      }}>
      + Add
    </button>
  )
}

export default function LabSettings() {
  const toast = useToast()
  const [saving,     setSaving]     = useState(false)
  const [newPinCode, setNewPinCode] = useState('')
  const [pinFocused, setPinFocused] = useState(false)

  const { data: labData, mutate } = useSWR('/api/labs?adminOnly=true', fetcher)
  const lab   = labData?.labs?.[0]
  const labId = lab?.id

  const [form, setForm] = useState({
    name:'', contactPhone:'', contactEmail:'', certifications:[],
    address:{ line1:'', city:'', state:'', pinCode:'' },
    homeCollection:{ enabled:false, areaCoverage:[] },
  })

  useEffect(() => {
    if (lab) {
      setForm({
        name:lab.name||'', contactPhone:lab.contactPhone||'', contactEmail:lab.contactEmail||'',
        certifications:lab.certifications||[],
        address:{ line1:lab.address?.line1||'', city:lab.address?.city||'', state:lab.address?.state||'', pinCode:lab.address?.pinCode||'' },
        homeCollection:{ enabled:lab.homeCollection?.enabled||false, areaCoverage:lab.homeCollection?.areaCoverage||[] },
      })
    }
  }, [lab])

  const toggleCert = (cert) => {
    setForm((f) => ({
      ...f,
      certifications:f.certifications.includes(cert)
        ? f.certifications.filter((c) => c!==cert)
        : [...f.certifications, cert],
    }))
  }

  const addPinCode = () => {
    const pin = newPinCode.trim()
    if (!pin||pin.length!==6) { toast.error('Enter a valid 6-digit PIN code'); return }
    if (form.homeCollection.areaCoverage.includes(pin)) { toast.error('PIN code already added'); return }
    setForm((f) => ({ ...f, homeCollection:{ ...f.homeCollection, areaCoverage:[...f.homeCollection.areaCoverage, pin] } }))
    setNewPinCode('')
  }

  const removePinCode = (pin) => {
    setForm((f) => ({ ...f, homeCollection:{ ...f.homeCollection, areaCoverage:f.homeCollection.areaCoverage.filter((p) => p!==pin) } }))
  }

  const save = async () => {
    if (!labId) { toast.error('Lab not found'); return }
    setSaving(true)
    try {
      const res  = await fetch(`/api/labs/${labId}`, {
        method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include',
        body:JSON.stringify({
          name:form.name, contactPhone:form.contactPhone, contactEmail:form.contactEmail,
          certifications:form.certifications, address:form.address,
          homeCollection:{ enabled:form.homeCollection.enabled, areaCoverage:form.homeCollection.areaCoverage, slots:lab?.homeCollection?.slots||[] },
        }),
      })
      const json = await res.json()
      if (json.success) { toast.success('Settings saved'); mutate() }
      else toast.error(json.error||'Failed to save settings')
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Settings" subtitle="Lab configuration and profile"
        breadcrumbs={[{label:'Lab Admin'},{label:'Settings'}]}
        actions={<SaveBtn onClick={save} loading={saving} />}
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
        {/* Basic info */}
        <LSCard title="Basic Information">
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <LSInput label="Lab Name"      value={form.name}         onChange={(e) => setForm((f) => ({...f,name:e.target.value}))} />
            <LSInput label="Contact Phone" value={form.contactPhone} onChange={(e) => setForm((f) => ({...f,contactPhone:e.target.value}))} placeholder="+91 XXXXX XXXXX" />
            <LSInput label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({...f,contactEmail:e.target.value}))} placeholder="lab@example.com" />
          </div>
        </LSCard>

        {/* Address */}
        <LSCard title="Address">
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <LSInput label="Street Address" value={form.address.line1}   onChange={(e) => setForm((f) => ({...f,address:{...f.address,line1:e.target.value}}))} placeholder="Building, Street" />
            <LSInput label="City"           value={form.address.city}    onChange={(e) => setForm((f) => ({...f,address:{...f.address,city:e.target.value}}))} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <LSInput label="State"    value={form.address.state}   onChange={(e) => setForm((f) => ({...f,address:{...f.address,state:e.target.value}}))} />
              <LSInput label="PIN Code" value={form.address.pinCode} onChange={(e) => setForm((f) => ({...f,address:{...f.address,pinCode:e.target.value}}))} maxLength={6} />
            </div>
          </div>
        </LSCard>

        {/* Certifications */}
        <LSCard title="Certifications">
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {CERTIFICATIONS.map((cert) => (
              <CertPill key={cert} cert={cert} selected={form.certifications.includes(cert)} onClick={() => toggleCert(cert)} />
            ))}
          </div>
          {form.certifications.length>0 && (
            <p style={{ fontSize:11, color:'#94a3b8', marginTop:10 }}>Selected: {form.certifications.join(', ')}</p>
          )}
        </LSCard>

        {/* Home Collection */}
        <LSCard title="Home Collection">
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Toggle */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#f8fafc', borderRadius:12 }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'#1e293b', margin:0 }}>Enable Home Collection</p>
                <p style={{ fontSize:11, color:'#94a3b8', margin:'2px 0 0' }}>Allow patients to book home sample pickup</p>
              </div>
              <Toggle
                checked={form.homeCollection.enabled}
                onChange={(v) => setForm((f) => ({...f,homeCollection:{...f.homeCollection,enabled:v}}))}
              />
            </div>

            {/* PIN codes */}
            {form.homeCollection.enabled && (
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'#475569', marginBottom:8 }}>Serviceable PIN Codes</p>
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <div style={{ position:'relative', flex:1 }}>
                    <input
                      value={newPinCode}
                      onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                      onFocus={() => setPinFocused(true)}
                      onBlur={() => setPinFocused(false)}
                      placeholder="6-digit PIN"
                      maxLength={6}
                      style={{
                        width:'100%', padding:'10px 12px', fontSize:13, fontFamily:'inherit',
                        borderRadius:12, boxSizing:'border-box',
                        border:`1.5px solid ${pinFocused?'#10b981':'#e2e8f0'}`,
                        background:'#fff', color:'#0f172a', outline:'none',
                        boxShadow:pinFocused?'0 0 0 3px rgba(16,185,129,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
                        transition:'all .15s ease',
                      }}
                    />
                  </div>
                  <AddPinBtn onClick={addPinCode} />
                </div>
                {form.homeCollection.areaCoverage.length>0 ? (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {form.homeCollection.areaCoverage.map((pin) => (
                      <PinBadge key={pin} pin={pin} onRemove={() => removePinCode(pin)} />
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>No PIN codes added yet</p>
                )}
              </div>
            )}
          </div>
        </LSCard>
      </div>
    </>
  )
}