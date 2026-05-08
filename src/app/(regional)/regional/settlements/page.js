'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import StatsCard from '@/components/ui/StatsCard'
import EmptyState from '@/components/ui/EmptyState'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => {
      if (!j.success) throw new Error(j.error || 'Failed')
      return j.data
    })

const fmtRs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const KF = `
  @keyframes rs-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes rs-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`
const SHIMMER = {
  backgroundImage:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize:'200% 100%', animation:'rs-shimmer 1.5s linear infinite',
}

/* ─── Tab button ─────────────────────────────────────────────────────── */
function TabBtn({ label, active, count, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'8px 16px', borderRadius:12, border:'none',
        fontSize:13, fontWeight:active?600:500, cursor:'pointer',
        background:active?'#fff':h?'rgba(255,255,255,0.5)':'transparent',
        color:active?'#0f172a':h?'#334155':'#64748b',
        boxShadow:active?'0 1px 4px rgba(0,0,0,0.1)':'none',
        transition:'all .15s ease',
      }}>
      {label}
      {count!==undefined && count>0 && (
        <span style={{
          padding:'1px 7px', borderRadius:100, fontSize:11, fontWeight:700,
          background:'rgba(245,158,11,0.12)', color:'#d97706',
        }}>{count}</span>
      )}
    </button>
  )
}

/* ─── Pending entity card ────────────────────────────────────────────── */
function PendingEntityCard({ entity, idx }) {
  const isHospital = entity.entityType === 'hospital'
  return (
    <div style={{
      background:'#fff', borderRadius:20, padding:20,
      border:`1.5px solid ${isHospital?'rgba(99,102,241,0.15)':'rgba(16,185,129,0.15)'}`,
      boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
      animation:`rs-in .2s ease ${idx*0.06}s both`,
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>{isHospital?'🏥':'🧪'}</span>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>{entity.name}</p>
            <p style={{ fontSize:11, color:'#94a3b8', margin:'2px 0 0', textTransform:'capitalize' }}>{entity.entityType}</p>
          </div>
        </div>
        <Badge variant={entity.bankAccount?.isVerified?'success':'warning'} size="sm">
          {entity.bankAccount?.isVerified?'Bank Verified':'Bank Unverified'}
        </Badge>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
        {[
          { label:'Bookings',   value:entity.totalBookings,           highlight:false },
          { label:'Gross',      value:fmtRs(entity.grossAmount),      highlight:false },
          { label:'Net Amount', value:fmtRs(entity.netSettlementAmount), highlight:true },
        ].map(({ label, value, highlight }) => (
          <div key={label} style={{
            borderRadius:12, padding:'10px 8px', textAlign:'center',
            background:highlight?'rgba(249,115,22,0.06)':'#f8fafc',
          }}>
            <p style={{ fontSize:10, color:highlight?'#ea580c':'#94a3b8', margin:'0 0 3px' }}>{label}</p>
            <p style={{ fontSize:13, fontWeight:700, color:highlight?'#c2410c':'#1e293b', margin:0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Read-only notice */}
      <div style={{
        background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)',
        borderRadius:10, padding:'8px 12px', fontSize:11, color:'#92400e',
      }}>
        ℹ️ Contact super admin to process this settlement
      </div>
    </div>
  )
}

export default function RegionalSettlementsPage() {
  const mounted = useMounted()
  const [tab,  setTab]  = useState('pending')
  const [page, setPage] = useState(1)

  const { data: pending, isLoading: pendingLoading, error: pendingError } = useSWR(
    tab==='pending' ? '/api/settlements/pending' : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const historyQs = new URLSearchParams({ page, limit:20 })
  const { data: history, isLoading: historyLoading } = useSWR(
    tab==='history' ? `/api/settlements?${historyQs}` : null,
    fetcher
  )

  const pendingHospitals = pending?.hospitals || []
  const pendingLabs      = pending?.labs      || []
  const pendingEntities  = [...pendingHospitals, ...pendingLabs]

  const historyCols = [
    { key:'settlementNumber', header:'Settlement #', render:(v) => <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700 }}>{v}</span> },
    { key:'entityName',       header:'Entity',       render:(v,row) => (
      <div>
        <p style={{ fontSize:13, fontWeight:500, color:'#1e293b', margin:0 }}>{v||'—'}</p>
        <Badge variant={row.entityType==='hospital'?'info':'success'} size="sm">{row.entityType}</Badge>
      </div>
    )},
    { key:'netSettlementAmount', header:'Net Amount',  render:(v) => <span style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>{fmtRs(v)}</span> },
    { key:'utrNumber',           header:'UTR',         render:(v) => v?<span style={{ fontFamily:'monospace', fontSize:11 }}>{v}</span>:<span style={{ color:'#94a3b8', fontSize:12 }}>—</span> },
    { key:'transferMode',        header:'Mode',        render:(v) => <span style={{ fontSize:12 }}>{v||'—'}</span> },
    { key:'status',              header:'Status',      render:(v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v}</Badge> },
    { key:'transferredAt',       header:'Date',        render:(v) => mounted&&v?<span style={{ fontSize:12, color:'#64748b' }}>{new Date(v).toLocaleDateString('en-IN',{dateStyle:'medium'})}</span>:'—' },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title="Settlements"
        subtitle="View settlement status for your region"
        breadcrumbs={[{label:'Dashboard',href:'/regional/dashboard'},{label:'Settlements'}]}
      />

      {/* Tab bar */}
      <div style={{ display:'flex', gap:3, background:'#f1f5f9', borderRadius:14, padding:4, width:'fit-content', marginBottom:24 }}>
        <TabBtn label="Pending"   active={tab==='pending'}  count={pendingEntities.length} onClick={() => { setTab('pending');  setPage(1) }} />
        <TabBtn label="Completed" active={tab==='history'}                                 onClick={() => { setTab('history');  setPage(1) }} />
      </div>

      {/* PENDING */}
      {tab==='pending' && (
        <div>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:20 }}>
            <StatsCard title="Pending Entities" value={pendingEntities.length} icon="⏳" color="orange" />
            <StatsCard title="Total Pending"    value={fmtRs(pending?.totalAmount||0)} icon="💰" color="blue" />
          </div>

          {/* Info banner */}
          <div style={{
            background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.2)',
            borderRadius:14, padding:'12px 16px', marginBottom:20,
            display:'flex', alignItems:'flex-start', gap:10,
          }}>
            <span style={{ fontSize:18, flexShrink:0, marginTop:2 }}>⚠️</span>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:'#c2410c', margin:'0 0 3px' }}>Read-Only View</p>
              <p style={{ fontSize:12, color:'#92400e', margin:0, lineHeight:1.6 }}>
                You can view pending settlements for your region.
                Only the super admin can initiate and confirm settlements.
                Contact <strong>support@medli.in</strong> to request a settlement.
              </p>
            </div>
          </div>

          {pendingLoading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
              {[1,2].map((i) => <div key={i} style={{ height:200, borderRadius:20, ...SHIMMER }} />)}
            </div>
          ) : pendingError ? (
            <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:14, padding:20, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>⚠️</span>
              <p style={{ fontSize:13, color:'#ef4444', margin:0 }}>Failed to load settlements.</p>
            </div>
          ) : !pendingEntities.length ? (
            <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', padding:40, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>✅</div>
              <p style={{ fontSize:14, fontWeight:600, color:'#10b981', margin:0 }}>All settled!</p>
              <p style={{ fontSize:12, color:'#94a3b8', margin:'4px 0 0' }}>No pending settlements for your region.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
              {pendingEntities.map((entity, i) => (
                <PendingEntityCard key={`${entity.entityType}-${entity.entityId}`} entity={entity} idx={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {tab==='history' && (
        <DataTable
          columns={historyCols}
          data={history?.settlements || []}
          loading={historyLoading}
          page={page}
          totalPages={history?.pagination?.totalPages || 1}
          onPageChange={setPage}
          emptyTitle="No completed settlements"
          keyField="id"
        />
      )}
    </>
  )
}