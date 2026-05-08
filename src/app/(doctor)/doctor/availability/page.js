'use client'

import { useState } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import { useToast } from '@/context/ToastContext'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const KF = `
  @keyframes av-in { from{opacity:0;height:0} to{opacity:1;height:auto} }
`

/* ─── Toggle switch ──────────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width:40, height:22, borderRadius:11,
        background: checked?'linear-gradient(135deg,#6366f1,#8b5cf6)':'#e2e8f0',
        border:'none', cursor:'pointer', position:'relative',
        transition:'background .2s ease', flexShrink:0,
        boxShadow: checked?'0 2px 8px rgba(99,102,241,0.35)':'none',
      }}
    >
      <div style={{
        width:18, height:18, borderRadius:'50%', background:'#fff',
        position:'absolute', top:2,
        left: checked?20:2,
        transition:'left .2s ease',
        boxShadow:'0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}

/* ─── Time input ─────────────────────────────────────────────────────── */
function TimeInput({ label, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
      <label style={{ fontSize:11, fontWeight:600, color:'#94a3b8' }}>{label}</label>
      <input
        type="time"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding:'8px 10px', fontSize:13, fontFamily:'inherit',
          borderRadius:10, boxSizing:'border-box',
          border:`1.5px solid ${focused?'#6366f1':'#e2e8f0'}`,
          background:'#fff', color:'#0f172a', outline:'none',
          boxShadow: focused?'0 0 0 3px rgba(99,102,241,0.12)':'none',
          transition:'all .15s ease',
        }}
      />
    </div>
  )
}

/* ─── Save Button ────────────────────────────────────────────────────── */
function SaveBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'9px 18px', borderRadius:12, border:'none',
        background: h
          ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer',
        boxShadow: h?'0 6px 20px rgba(99,102,241,0.45)':'0 4px 14px rgba(99,102,241,0.3)',
        transition:'all .18s ease',
      }}
    >
      💾 Save All
    </button>
  )
}

/* ─── Consult Type Button ────────────────────────────────────────────── */
function ConsultTypeBtn({ label, active, color, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding:'10px 18px', borderRadius:12,
        border: active ? `2px solid ${color}` : '2px solid #e2e8f0',
        background: active ? `${color}15` : h?'#f8fafc':'#fff',
        color: active ? color : '#64748b',
        fontSize:13, fontWeight: active?600:500, cursor:'pointer',
        transition:'all .15s ease',
      }}
    >
      {active ? '✓ ' : ''}{label}
    </button>
  )
}

/* ─── Exception Item ─────────────────────────────────────────────────── */
function ExceptionItem({ ex, onRemove }) {
  const [h, setH] = useState(false)
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'10px 14px', background:'rgba(239,68,68,0.05)',
      borderRadius:12, border:'1px solid rgba(239,68,68,0.15)',
    }}>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:'#1e293b', margin:0 }}>{ex.date}</p>
        <p style={{ fontSize:11, color:'#94a3b8', margin:'2px 0 0' }}>{ex.reason||'No reason'}</p>
      </div>
      <button
        onClick={onRemove}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{ background:h?'rgba(239,68,68,0.1)':'transparent', border:'none', cursor:'pointer', borderRadius:8, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, transition:'background .12s ease' }}
      >
        ✕
      </button>
    </div>
  )
}

/* ─── Date/Reason Input ──────────────────────────────────────────────── */
function ExceptionInput({ type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type||'text'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        flex:1, padding:'10px 12px', fontSize:13, fontFamily:'inherit',
        borderRadius:12, boxSizing:'border-box',
        border:`1.5px solid ${focused?'#6366f1':'#e2e8f0'}`,
        background:'#fff', color:'#0f172a', outline:'none',
        boxShadow: focused?'0 0 0 3px rgba(99,102,241,0.12)':'none',
        transition:'all .15s ease',
      }}
    />
  )
}

function AddBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding:'10px 16px', borderRadius:12, border:'none',
        background:h?'#e2e8f0':'#f1f5f9',
        color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer',
        transition:'all .15s ease', flexShrink:0,
        display:'flex', alignItems:'center', gap:4,
      }}>
      + Add
    </button>
  )
}

/* ─── Section Card ───────────────────────────────────────────────────── */
function SCard({ title, children, style: sx }) {
  return (
    <div style={{
      background:'#fff', borderRadius:20, border:'1px solid #f1f5f9',
      boxShadow:'0 2px 8px rgba(0,0,0,0.04)', overflow:'hidden', ...sx,
    }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #f8fafc' }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>{title}</h3>
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function AvailabilityPage() {
  const toast = useToast()

  const [slots, setSlots] = useState(DAYS.map((_,i) => ({
    dayOfWeek:i, enabled:i>=1&&i<=5, startTime:'09:00', endTime:'17:00', slotDuration:10,
  })))
  const [exceptions,    setExceptions]    = useState([])
  const [newException,  setNewException]  = useState({ date:'', reason:'' })
  const [consultTypes,  setConsultTypes]  = useState({ offline:true, online:false })

  const toggleDay   = (i) => { const n=[...slots]; n[i]={...n[i],enabled:!n[i].enabled}; setSlots(n) }
  const updateSlot  = (i,f,v) => { const n=[...slots]; n[i]={...n[i],[f]:v}; setSlots(n) }
  const addException = () => {
    if (!newException.date) return
    setExceptions([...exceptions, {...newException}])
    setNewException({date:'',reason:''})
  }
  const save = () => toast.info('Availability save coming soon')

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title="Availability"
        subtitle="Manage your schedule"
        actions={<SaveBtn onClick={save} />}
      />

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

        {/* Consultation Types */}
        <SCard title="Consultation Types">
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <ConsultTypeBtn label="In-Person"     active={consultTypes.offline} color="#6366f1" onClick={() => setConsultTypes({...consultTypes, offline:!consultTypes.offline})} />
            <ConsultTypeBtn label="Online (Video)" active={consultTypes.online}  color="#10b981" onClick={() => setConsultTypes({...consultTypes, online:!consultTypes.online})} />
          </div>
        </SCard>

        {/* Weekly Schedule */}
        <SCard title="Weekly Schedule">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
            {slots.map((slot, i) => (
              <DayCard key={i} slot={slot} dayName={DAYS[i]} onToggle={() => toggleDay(i)} onUpdate={(f,v) => updateSlot(i,f,v)} />
            ))}
          </div>
        </SCard>

        {/* Exception Dates */}
        <SCard title="Exception Dates">
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            <ExceptionInput type="date" value={newException.date} onChange={(e) => setNewException({...newException,date:e.target.value})} />
            <ExceptionInput placeholder="Reason (optional)" value={newException.reason} onChange={(e) => setNewException({...newException,reason:e.target.value})} />
            <AddBtn onClick={addException} />
          </div>
          {!exceptions.length ? (
            <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>No exceptions added</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {exceptions.map((ex, i) => (
                <ExceptionItem key={i} ex={ex} onRemove={() => setExceptions(exceptions.filter((_,j)=>j!==i))} />
              ))}
            </div>
          )}
        </SCard>
      </div>
    </>
  )
}

function DayCard({ slot, dayName, onToggle, onUpdate }) {
  return (
    <div style={{
      padding:16, borderRadius:14,
      background: slot.enabled ? '#fff' : '#f8fafc',
      border: `1.5px solid ${slot.enabled ? 'rgba(99,102,241,0.2)' : '#f1f5f9'}`,
      transition:'all .2s ease',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: slot.enabled?14:0 }}>
        <span style={{ fontSize:14, fontWeight:600, color: slot.enabled?'#1e293b':'#94a3b8' }}>
          {dayName}
        </span>
        <Toggle checked={slot.enabled} onChange={onToggle} />
      </div>

      {slot.enabled && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:8 }}>
            <TimeInput label="Start" value={slot.startTime} onChange={(e) => onUpdate('startTime', e.target.value)} />
            <TimeInput label="End"   value={slot.endTime}   onChange={(e) => onUpdate('endTime',   e.target.value)} />
          </div>
          <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>
            ~{Math.floor(((parseInt(slot.endTime)-parseInt(slot.startTime))*60)/slot.slotDuration)} slots ({slot.slotDuration}min each)
          </p>
        </div>
      )}
    </div>
  )
}