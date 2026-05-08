'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials:'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes bk-spin{to{transform:rotate(360deg)}}`

/* ─── Search Input ───────────────────────────────────────────────────── */
function SearchInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position:'relative', flex:1, minWidth:180, maxWidth:320 }}>
      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none', color:'#94a3b8' }}>🔍</span>
      <input value={value} onChange={onChange} placeholder="Search bookings…"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', padding:'10px 14px 10px 38px', fontSize:13, fontFamily:'inherit',
          borderRadius:12, boxSizing:'border-box',
          border:`1.5px solid ${focused?'#6366f1':'#e2e8f0'}`,
          background:'#fff', color:'#0f172a', outline:'none',
          boxShadow:focused?'0 0 0 3px rgba(99,102,241,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
          transition:'all .15s ease',
        }}
      />
    </div>
  )
}

/* ─── Filter pill ────────────────────────────────────────────────────── */
function FilterPill({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding:'8px 12px', borderRadius:10, border:'none',
        fontSize:12, fontWeight:500, cursor:'pointer', flexShrink:0,
        background:active?'linear-gradient(135deg,#6366f1,#8b5cf6)':h?'#e2e8f0':'#f1f5f9',
        color:active?'#fff':'#64748b',
        boxShadow:active?'0 2px 8px rgba(99,102,241,0.3)':'none',
        transition:'all .15s ease',
      }}>
      {label}
    </button>
  )
}

/* ─── Refresh button ─────────────────────────────────────────────────── */
function RefreshBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width:38, height:38, borderRadius:10, border:'none',
        background:h?'#e2e8f0':'#f1f5f9', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:16, transition:'background .15s ease', flexShrink:0,
      }}>
      🔄
    </button>
  )
}

/* ─── Cancel Confirm Modal ───────────────────────────────────────────── */
function CancelModal({ open, onClose, onConfirm, loading }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} />
      <div style={{
        position:'relative', width:'100%', maxWidth:380, background:'#fff',
        borderRadius:20, padding:24, boxShadow:'0 24px 80px rgba(0,0,0,0.2)',
        animation:'modal-in .25s ease',
      }}>
        <style>{`@keyframes modal-in{from{opacity:0;transform:scale(.95) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
          <h3 style={{ fontSize:17, fontWeight:700, color:'#0f172a', marginBottom:8 }}>Cancel Booking?</h3>
          <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>Are you sure you want to cancel this booking?</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <ModalBtn label="Keep" onClick={onClose} disabled={loading} variant="secondary" />
          <ModalBtn label="Cancel Booking" onClick={onConfirm} loading={loading} variant="danger" />
        </div>
      </div>
    </div>
  )
}

function ModalBtn({ label, onClick, disabled, loading: isLoading, variant='secondary' }) {
  const [h, setH] = useState(false)
  const V = {
    secondary:{ base:'#fff', hov:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0' },
    danger:   { base:'rgba(239,68,68,0.06)', hov:'rgba(239,68,68,0.12)', color:'#ef4444', border:'1.5px solid rgba(239,68,68,0.2)' },
  }
  const s = V[variant]
  const isDisabled = disabled || isLoading
  return (
    <button onClick={onClick} disabled={isDisabled} onMouseEnter={() => !isDisabled && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        flex:1, padding:'11px', borderRadius:12,
        background:isDisabled?'#f1f5f9':h?s.hov:s.base,
        color:isDisabled?'#94a3b8':s.color, border:s.border,
        fontSize:13, fontWeight:600, cursor:isDisabled?'not-allowed':'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        transition:'all .15s ease',
      }}>
      {isLoading && <span style={{ width:14,height:14,borderRadius:'50%',border:'2px solid currentColor',borderTopColor:'transparent',animation:'bk-spin .7s linear infinite',display:'inline-block',opacity:0.6 }} />}
      {label}
    </button>
  )
}

/* ─── Row action button ──────────────────────────────────────────────── */
function RowCancelBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:8,
        border:'none', cursor:'pointer',
        background:h?'rgba(239,68,68,0.1)':'transparent',
        color:h?'#ef4444':'#f87171',
        transition:'all .12s ease',
      }}>
      Cancel
    </button>
  )
}

export default function HospitalAdminBookings() {
  const toast   = useToast()
  const mounted = useMounted()

  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelOpen,   setCancelOpen]   = useState(false)
  const [cancelling,   setCancelling]   = useState(false)
  const [targetId,     setTargetId]     = useState(null)

  const qs = new URLSearchParams({ page, limit:20 })
  if (statusFilter) qs.set('status', statusFilter)

  const { data, isLoading, mutate } = useSWR(`/api/bookings?${qs}`, fetcher)
  const bookings   = data?.bookings   || []
  const totalPages = data?.pagination?.totalPages || 1

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res  = await fetch(`/api/bookings/${targetId}/cancel`, {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body:JSON.stringify({reason:'Cancelled by hospital admin'}),
      })
      const json = await res.json()
      json.success ? toast.success('Booking cancelled') : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed to cancel') }
    finally { setCancelling(false); setCancelOpen(false); setTargetId(null) }
  }

  const STATUS_FILTERS = [
    { key:'',                label:'All Status'    },
    { key:'confirmed',       label:'Confirmed'     },
    { key:'completed',       label:'Completed'     },
    { key:'cancelled',       label:'Cancelled'     },
    { key:'pending_payment', label:'Pending'       },
  ]

  const columns = [
    {
      key:'userName', header:'Patient',
      render:(v,row) => (
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:'#1e293b', margin:0 }}>{v||'Unknown'}</p>
          <p style={{ fontSize:11, fontFamily:'monospace', color:'#94a3b8', margin:'2px 0 0' }}>{row.bookingId}</p>
        </div>
      ),
    },
    {
      key:'doctorName', header:'Doctor',
      render:(v) => v
        ? <span style={{ fontSize:13, color:'#475569' }}>Dr. {v}</span>
        : <span style={{ fontSize:12, color:'#cbd5e1' }}>—</span>,
    },
    {
      key:'type', header:'Type',
      render:(v) => <Badge variant="info" size="sm">{v}</Badge>,
    },
    {
      key:'status', header:'Status',
      render:(v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v?.replace(/_/g,' ')}</Badge>,
    },
    {
      key:'totalAmount', header:'Amount',
      render:(v) => <span style={{ fontSize:13, fontWeight:600, color:'#334155' }}>₹{Number(v||0).toLocaleString('en-IN')}</span>,
    },
    {
      key:'startTime', header:'Date',
      render:(v) => mounted
        ? <span style={{ fontSize:12, color:'#64748b' }}>{new Date(v).toLocaleDateString('en-IN',{dateStyle:'medium'})}</span>
        : '—',
    },
    {
      key:'actions', header:'',
      render:(_,row) => (
        ['created','confirmed','pending_payment'].includes(row.status)
          ? <RowCancelBtn onClick={() => { setTargetId(row.id); setCancelOpen(true) }} />
          : null
      ),
    },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title="Bookings" subtitle="Manage hospital bookings"
        breadcrumbs={[{label:'Hospital Admin'},{label:'Bookings'}]}
      />

      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20 }}>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
        {STATUS_FILTERS.map((f) => (
          <FilterPill key={f.key} label={f.label} active={statusFilter===f.key} onClick={() => setStatusFilter(f.key)} />
        ))}
        <RefreshBtn onClick={() => mutate()} />
      </div>

      <DataTable
        columns={columns} data={bookings} loading={isLoading}
        page={page} totalPages={totalPages} onPageChange={setPage}
        emptyTitle="No bookings found"
      />

      <CancelModal open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={handleCancel} loading={cancelling} />
    </>
  )
}