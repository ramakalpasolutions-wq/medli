'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { SkeletonStats } from '@/components/ui/Skeleton'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const PRESETS = [
  { key:'today',       label:'Today'       },
  { key:'last7',       label:'Last 7 Days' },
  { key:'last30',      label:'Last 30 Days'},
  { key:'thisMonth',   label:'This Month'  },
  { key:'last3Months', label:'3 Months'    },
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:12, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', fontSize:12 }}>
      <p style={{ fontWeight:600, color:'#334155', marginBottom:4 }}>{label}</p>
      {payload.map((e) => (
        <p key={e.name} style={{ color:e.color, margin:'2px 0' }}>
          {e.name}: {e.name==='Revenue'?`₹${Number(e.value).toLocaleString('en-IN')}`:e.value}
        </p>
      ))}
    </div>
  )
}

function PresetPill({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding:'8px 14px', borderRadius:10, border:'none',
        fontSize:13, fontWeight:500, cursor:'pointer', flexShrink:0,
        background:active?'linear-gradient(135deg,#10b981,#059669)':h?'#e2e8f0':'#f1f5f9',
        color:active?'#fff':'#64748b',
        boxShadow:active?'0 2px 8px rgba(16,185,129,0.3)':'none',
        transition:'all .15s ease',
      }}>
      {label}
    </button>
  )
}

function SCard({ title, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', overflow:'hidden' }}>
      {title && (
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #f8fafc' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>{title}</h3>
        </div>
      )}
      <div style={{ padding:20 }}>{children}</div>
    </div>
  )
}

export default function LabReportsPage() {
  const [preset, setPreset] = useState('last30')

  const { data: revenueData, isLoading:rLoad } = useSWR(`/api/analytics/revenue?preset=${preset}`,  fetcher)
  const { data: bookingData, isLoading:bLoad } = useSWR(`/api/analytics/bookings?preset=${preset}`, fetcher)
  const { data: labData }                       = useSWR('/api/labs?adminOnly=true', fetcher)
  const labId = labData?.labs?.[0]?.id
  const { data: testsData } = useSWR(labId?`/api/labs/${labId}/tests`:null, fetcher)

  const isLoading = rLoad || bLoad
  const s         = revenueData?.summary || {}
  const byStatus  = bookingData?.byStatus || []
  const tests     = testsData?.tests || []

  const chartData = (revenueData?.chartData||[]).map((d) => ({
    date:d.date, Revenue:Math.round(d.revenue||0), Bookings:d.bookings||0,
  }))

  return (
    <>
      <AdminHeader title="Reports" subtitle="Lab revenue and booking analytics"
        breadcrumbs={[{label:'Lab Admin'},{label:'Reports'}]} />

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
        {PRESETS.map((p) => (
          <PresetPill key={p.key} label={p.label} active={preset===p.key} onClick={() => setPreset(p.key)} />
        ))}
      </div>

      {isLoading ? <SkeletonStats count={3} style={{ marginBottom:24 }} /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
          <StatsCard title="Gross Revenue"  value={`₹${Number(s.totalRevenue||0).toLocaleString('en-IN')}`} icon="💰" color="green" />
          <StatsCard title="Total Bookings" value={s.totalBookings||0}                                        icon="📅" color="blue"  />
          <StatsCard title="Completed"      value={byStatus.find((st)=>st.status==='completed')?.count||0}    icon="✅" color="purple" />
        </div>
      )}

      {chartData.length>0 && (
        <div style={{ marginBottom:20 }}>
          <SCard title="Revenue Over Time">
            <div style={{ height:260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{top:5,right:20,bottom:5,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={(v)=>v.slice(5)} />
                  <YAxis tick={{fontSize:10}} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SCard>
        </div>
      )}

      {chartData.length>0 && (
        <div style={{ marginBottom:20 }}>
          <SCard title="Bookings Per Day">
            <div style={{ height:200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{top:5,right:20,bottom:5,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={(v)=>v.slice(5)} />
                  <YAxis tick={{fontSize:10}} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Bookings" fill="#34d399" radius={[4,4,0,0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SCard>
        </div>
      )}

      {chartData.length===0 && !isLoading && (
        <div style={{ marginBottom:20 }}>
          <SCard>
            <div style={{ textAlign:'center', padding:'40px 16px' }}>
              <p style={{ fontSize:14, color:'#94a3b8', margin:0 }}>No data for selected period</p>
            </div>
          </SCard>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, marginBottom:20 }}>
        <SCard title="Booking by Status">
          {!byStatus.length ? (
            <p style={{ fontSize:13, color:'#94a3b8', textAlign:'center', padding:'20px 0' }}>No data</p>
          ) : byStatus.map((item) => (
            <div key={item.status} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
              <Badge variant={getStatusVariant(item.status)} size="sm">{item.status?.replace(/_/g,' ')}</Badge>
              <span style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>{item.count}</span>
            </div>
          ))}
        </SCard>

        <SCard title="Lab Status">
          {['sample_collected','processing','report_ready'].map((status) => {
            const found = byStatus.find((s) => s.status===status)
            return (
              <div key={status} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                <span style={{ fontSize:13, color:'#64748b', textTransform:'capitalize' }}>{status.replace(/_/g,' ')}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>{found?.count||0}</span>
              </div>
            )
          })}
        </SCard>
      </div>

      {tests.length>0 && (
        <SCard title="Test Catalogue">
          <div style={{ display:'flex', flexDirection:'column' }}>
            {tests.slice(0,10).map((t) => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:500, color:'#1e293b', margin:0 }}>{t.name}</p>
                  {t.category && <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{t.category}</p>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {t.discountedPrice ? (
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#1e293b', margin:0 }}>₹{Number(t.discountedPrice).toLocaleString('en-IN')}</p>
                      <p style={{ fontSize:11, color:'#94a3b8', textDecoration:'line-through', margin:0 }}>₹{Number(t.price).toLocaleString('en-IN')}</p>
                    </div>
                  ) : (
                    <p style={{ fontSize:13, fontWeight:700, color:'#1e293b', margin:0 }}>₹{Number(t.price).toLocaleString('en-IN')}</p>
                  )}
                  <Badge variant={t.isActive?'success':'danger'} size="sm">{t.isActive?'Active':'Off'}</Badge>
                </div>
              </div>
            ))}
            {tests.length>10 && <p style={{ fontSize:11, color:'#94a3b8', textAlign:'center', paddingTop:8 }}>+{tests.length-10} more tests</p>}
          </div>
        </SCard>
      )}
    </>
  )
}