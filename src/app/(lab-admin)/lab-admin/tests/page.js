'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes lt-spin { to{transform:rotate(360deg)} }
  @keyframes lt-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lt-slide{ from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes lt-fade { from{opacity:0} to{opacity:1} }
`

const CATEGORIES = [
  'Blood Test','Urine Test','Thyroid','Diabetes','Liver','Kidney',
  'Lipid Profile','CBC','Vitamins','Hormones','Culture','Radiology','Other',
]

const emptyForm = {
  name:'', code:'', category:'', price:'', discountedPrice:'',
  sampleType:'', preparationInstructions:'',
  turnaroundTime:{ value:'', unit:'hours' },
  parameters:'',
}

/* ─── Form Input ─────────────────────────────────────────────────────── */
function FInput({ label, ...props }) {
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

/* ─── Form Select ────────────────────────────────────────────────────── */
function FSelect({ label, children, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'#475569' }}>{label}</label>}
      <div style={{ position:'relative' }}>
        <select
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:'100%', padding:'10px 30px 10px 12px',
            fontSize:13, fontFamily:'inherit', borderRadius:12,
            border:`1.5px solid ${focused?'#10b981':'#e2e8f0'}`,
            background:'#fff', color:'#0f172a', outline:'none',
            appearance:'none', cursor:'pointer',
            boxShadow:focused?'0 0 0 3px rgba(16,185,129,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
            transition:'all .15s ease', boxSizing:'border-box',
          }}
        >
          {children}
        </select>
        <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#94a3b8', pointerEvents:'none' }}>▼</span>
      </div>
    </div>
  )
}

/* ─── Add button ─────────────────────────────────────────────────────── */
function AddBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'9px 16px', borderRadius:12, border:'none',
        background:h?'linear-gradient(135deg,#059669,#047857)':'linear-gradient(135deg,#10b981,#059669)',
        color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer',
        boxShadow:h?'0 6px 20px rgba(16,185,129,0.45)':'0 4px 14px rgba(16,185,129,0.3)',
        transition:'all .18s ease',
      }}>
      + Add Test
    </button>
  )
}

/* ─── Search input ───────────────────────────────────────────────────── */
function SearchInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position:'relative', flex:1, minWidth:200, maxWidth:320 }}>
      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none', color:'#94a3b8' }}>🔍</span>
      <input value={value} onChange={onChange} placeholder="Search tests…"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', padding:'10px 14px 10px 38px', fontSize:13, fontFamily:'inherit',
          borderRadius:12, boxSizing:'border-box',
          border:`1.5px solid ${focused?'#10b981':'#e2e8f0'}`,
          background:'#fff', color:'#0f172a', outline:'none',
          boxShadow:focused?'0 0 0 3px rgba(16,185,129,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
          transition:'all .15s ease',
        }}
      />
    </div>
  )
}

/* ─── Category pill ──────────────────────────────────────────────────── */
function CatPill({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding:'5px 12px', borderRadius:100, border:'none',
        fontSize:12, fontWeight:500, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
        background:active?'linear-gradient(135deg,#10b981,#059669)':h?'#e2e8f0':'#f1f5f9',
        color:active?'#fff':'#64748b',
        boxShadow:active?'0 2px 8px rgba(16,185,129,0.3)':'none',
        transition:'all .12s ease',
      }}>
      {label}
    </button>
  )
}

/* ─── Test card ──────────────────────────────────────────────────────── */
function TestCard({ test, idx, onEdit, onRemove }) {
  const [h, setH] = useState(false)
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background:'#fff', borderRadius:20, padding:18,
        border:`1.5px solid ${h?'#bbf7d0':'#f1f5f9'}`,
        boxShadow:h?'0 8px 24px rgba(16,185,129,0.08)':'0 2px 6px rgba(0,0,0,0.04)',
        transition:'all .2s ease',
        animation:`lt-in .2s ease ${idx * 0.04}s both`,
      }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{test.name}</p>
          {test.code && <p style={{ fontSize:11, fontFamily:'monospace', color:'#94a3b8', margin:0 }}>{test.code}</p>}
        </div>
        {test.category && <Badge variant="info" size="sm" style={{ marginLeft:8, flexShrink:0 }}>{test.category}</Badge>}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:12 }}>
        {test.sampleType && <p style={{ fontSize:11, color:'#64748b', margin:0 }}>🧪 Sample: {test.sampleType}</p>}
        {test.turnaroundTime?.value && <p style={{ fontSize:11, color:'#64748b', margin:0 }}>⏱ TAT: {test.turnaroundTime.value} {test.turnaroundTime.unit}</p>}
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          {test.discountedPrice ? (
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>₹{Number(test.discountedPrice).toLocaleString('en-IN')}</span>
              <span style={{ fontSize:11, color:'#94a3b8', textDecoration:'line-through' }}>₹{Number(test.price).toLocaleString('en-IN')}</span>
            </div>
          ) : (
            <span style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>₹{Number(test.price).toLocaleString('en-IN')}</span>
          )}
        </div>
        <div style={{ display:'flex', gap:4 }}>
          <TestRowBtn label="Edit"   color="blue" onClick={onEdit}   />
          <TestRowBtn label="Remove" color="red"  onClick={onRemove} />
        </div>
      </div>
    </div>
  )
}

function TestRowBtn({ label, color, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        fontSize:12, fontWeight:600, padding:'5px 10px', borderRadius:8, border:'none', cursor:'pointer',
        background:h?(color==='blue'?'rgba(99,102,241,0.1)':'rgba(239,68,68,0.1)'):'transparent',
        color:color==='blue'?'#6366f1':'#ef4444',
        transition:'all .12s ease',
      }}>
      {label}
    </button>
  )
}

/* ─── Panel close btn ────────────────────────────────────────────────── */
function PanelCloseBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width:32, height:32, borderRadius:8, border:'none', background:h?'#f1f5f9':'transparent', cursor:'pointer', fontSize:18, color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .12s ease' }}>
      ✕
    </button>
  )
}

/* ─── Save test button ───────────────────────────────────────────────── */
function SaveTestBtn({ label, onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading} onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width:'100%', padding:'13px', borderRadius:12, border:'none',
        background:isLoading?'#e2e8f0':h?'linear-gradient(135deg,#059669,#047857)':'linear-gradient(135deg,#10b981,#059669)',
        color:isLoading?'#94a3b8':'#fff', fontSize:14, fontWeight:600,
        cursor:isLoading?'not-allowed':'pointer',
        boxShadow:isLoading?'none':h?'0 8px 24px rgba(16,185,129,0.5)':'0 4px 14px rgba(16,185,129,0.3)',
        transition:'all .18s ease',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      }}>
      {isLoading && <span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', animation:'lt-spin .7s linear infinite', display:'inline-block' }} />}
      {label}
    </button>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function LabTestsPage() {
  const toast = useToast()
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editTest,  setEditTest]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState(emptyForm)

  const { data: labData } = useSWR('/api/labs?adminOnly=true', fetcher)
  const labId = labData?.labs?.[0]?.id

  const { data: testsData, isLoading, mutate } = useSWR(
    labId ? `/api/labs/${labId}/tests` : null, fetcher
  )

  const allTests   = testsData?.tests || []
  const categories = ['all', ...new Set(allTests.map((t) => t.category).filter(Boolean))]

  const filtered = allTests.filter((t) => {
    const matchCat    = catFilter === 'all' || t.category === catFilter
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.code?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  useEffect(() => {
    if (panelOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [panelOpen])

  const openAdd = () => { setEditTest(null); setForm(emptyForm); setPanelOpen(true) }
  const openEdit = (test) => {
    setEditTest(test)
    setForm({
      name:test.name||'', code:test.code||'', category:test.category||'',
      price:String(test.price||''), discountedPrice:String(test.discountedPrice||''),
      sampleType:test.sampleType||'', preparationInstructions:test.preparationInstructions||'',
      turnaroundTime:{ value:String(test.turnaroundTime?.value||''), unit:test.turnaroundTime?.unit||'hours' },
      parameters:(test.parameters||[]).join(', '),
    })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Test name is required'); return }
    if (!form.price)        { toast.error('Price is required'); return }
    if (!labId)             { toast.error('Lab not found'); return }
    setSaving(true)
    try {
      const payload = {
        labId, name:form.name.trim(), code:form.code.trim()||undefined,
        category:form.category||undefined, price:Number(form.price),
        discountedPrice:form.discountedPrice?Number(form.discountedPrice):undefined,
        sampleType:form.sampleType||undefined, preparationInstructions:form.preparationInstructions||undefined,
        turnaroundTime:form.turnaroundTime.value?{value:Number(form.turnaroundTime.value),unit:form.turnaroundTime.unit}:undefined,
        parameters:form.parameters?form.parameters.split(',').map((p)=>p.trim()).filter(Boolean):[],
      }
      const url    = editTest ? `/api/tests/${editTest.id}` : '/api/tests'
      const method = editTest ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify(payload) })
      const json   = await res.json()
      if (json.success) { toast.success(editTest?'Test updated':'Test added'); setPanelOpen(false); mutate() }
      else toast.error(json.error||'Failed to save test')
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  const handleDeactivate = async (testId) => {
    try {
      const res  = await fetch(`/api/tests/${testId}`, { method:'DELETE', credentials:'include' })
      const json = await res.json()
      json.success ? toast.success('Test deactivated') : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed to deactivate test') }
  }

  const SHIMMER = { backgroundImage:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize:'200% 100%', animation:'lt-spin 0s linear, ld-shimmer 1.5s linear infinite' }

  return (
    <>
      <style>{KF}</style>
      <style>{`@keyframes ld-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <AdminHeader title="Tests" subtitle="Manage lab test catalogue"
        breadcrumbs={[{label:'Lab Admin'},{label:'Tests'}]}
        actions={<AddBtn onClick={openAdd} />}
      />

      {/* Search + filters */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16 }}>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:6, marginBottom:20, scrollbarWidth:'none' }}>
        {categories.map((c) => (
          <CatPill key={c} label={c==='all'?'All Tests':c} active={catFilter===c} onClick={() => setCatFilter(c)} />
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} style={{ height:140, borderRadius:20, ...SHIMMER }} />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<span style={{ fontSize:48 }}>🧪</span>}
          title="No tests found"
          message={search?'Try a different search':'Add your first test'}
          action={<AddBtn onClick={openAdd} />}
        />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {filtered.map((test, i) => (
            <TestCard key={test.id} test={test} idx={i}
              onEdit={() => openEdit(test)}
              onRemove={() => handleDeactivate(test.id)}
            />
          ))}
        </div>
      )}

      {/* Slide panel */}
      {panelOpen && (
        <>
          <div onClick={() => setPanelOpen(false)} style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', animation:'lt-fade .2s ease' }} />
          <div style={{
            position:'fixed', right:0, top:0, bottom:0, width:'min(440px,92vw)',
            background:'#fff', zIndex:910, display:'flex', flexDirection:'column',
            boxShadow:'-8px 0 40px rgba(0,0,0,0.12)',
            animation:'lt-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#1e293b', margin:0 }}>{editTest?'Edit Test':'Add New Test'}</h3>
              <PanelCloseBtn onClick={() => setPanelOpen(false)} />
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <FInput label="Test Name *" value={form.name} onChange={(e) => setForm((f) => ({...f,name:e.target.value}))} placeholder="e.g. Complete Blood Count" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <FInput label="Test Code" value={form.code} onChange={(e) => setForm((f) => ({...f,code:e.target.value.toUpperCase()}))} placeholder="CBC" />
                <FSelect label="Category" value={form.category} onChange={(e) => setForm((f) => ({...f,category:e.target.value}))}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </FSelect>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <FInput label="Price (₹) *" type="number" value={form.price} onChange={(e) => setForm((f) => ({...f,price:e.target.value}))} placeholder="500" />
                <FInput label="Discounted Price" type="number" value={form.discountedPrice} onChange={(e) => setForm((f) => ({...f,discountedPrice:e.target.value}))} placeholder="Optional" />
              </div>
              <FInput label="Sample Type" value={form.sampleType} onChange={(e) => setForm((f) => ({...f,sampleType:e.target.value}))} placeholder="Blood, Urine, Swab..." />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <FInput label="TAT Value" type="number" value={form.turnaroundTime.value} onChange={(e) => setForm((f) => ({...f,turnaroundTime:{...f.turnaroundTime,value:e.target.value}}))} placeholder="24" />
                <FSelect label="TAT Unit" value={form.turnaroundTime.unit} onChange={(e) => setForm((f) => ({...f,turnaroundTime:{...f.turnaroundTime,unit:e.target.value}}))}>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </FSelect>
              </div>
              <FInput label="Parameters (comma separated)" value={form.parameters} onChange={(e) => setForm((f) => ({...f,parameters:e.target.value}))} placeholder="Haemoglobin, WBC, RBC..." />
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:6 }}>Preparation Instructions</label>
                <textarea
                  value={form.preparationInstructions}
                  onChange={(e) => setForm((f) => ({...f,preparationInstructions:e.target.value}))}
                  rows={3} placeholder="Fast for 8 hours before the test..."
                  style={{ width:'100%', padding:'10px 12px', fontSize:13, fontFamily:'inherit', borderRadius:12, border:'1.5px solid #e2e8f0', background:'#fff', color:'#0f172a', outline:'none', resize:'none', boxSizing:'border-box' }}
                />
              </div>
            </div>

            <div style={{ padding:'16px 20px', borderTop:'1px solid #f1f5f9', flexShrink:0 }}>
              <SaveTestBtn label={editTest?'Update Test':'Add Test'} onClick={handleSave} loading={saving} />
            </div>
          </div>
        </>
      )}
    </>
  )
}