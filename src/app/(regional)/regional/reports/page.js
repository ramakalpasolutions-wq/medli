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
import DateRangePicker from '@/components/ui/DateRangePicker'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:12, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', fontSize:12 }}>
      <p style={{ fontWeight:600, color:'#334155', marginBottom:4 }}>{label}</p>
      {payload.map((e) => (
        <p key={e.name} style={{ color:e.color, margin:'2px 0' }}>
          {e.name}: {e.name.includes('₹')?`₹${Number(e.value).toLocaleString('en-IN')}`:e.value}
        </p>
      ))}
    </div>
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

const STATS_DEF = [
  { id:'revenue',  title:'Total Revenue',  icon:'💰', color:'green',  key:'totalRevenue',     prefix:true },
  { id:'platform', title:'Platform Fee',   icon:'📊', color:'blue',   key:'totalPlatformFee', prefix:true },
  { id:'bookings', title:'Total Bookings', icon:'📅', color:'purple', key:'totalBookings',    prefix:false },
  { id:'gst',      title:'GST Collected',  icon:'🧾', color:'orange', key:'totalGst',         prefix:true },
]

export default function RegionalReportsPage() {
  const [dateRange, setDateRange] = useState({ preset:'last30', dateFrom:'', dateTo:'' })

  const qs = new URLSearchParams({ preset:dateRange.preset })
  if (dateRange.dateFrom) qs.set('dateFrom', dateRange.dateFrom)
  if (dateRange.dateTo)   qs.set('dateTo',   dateRange.dateTo)

  const { data: revenue } = useSWR(`/api/analytics/revenue?${qs}`,  fetcher)
  const { data: bookings } = useSWR(`/api/analytics/bookings?${qs}`, fetcher)

  const s = revenue?.summary || {}

  const chartData = (revenue?.chartData||[]).map((d) => ({
    date:d.date, 'Revenue (₹)':Math.round(d.revenue||0), Bookings:d.bookings||0,
  }))

  return (
    <>
      <AdminHeader
        title="Regional Analytics"
        subtitle="Revenue and booking analytics for your region"
        breadcrumbs={[{label:'Dashboard',href:'/regional/dashboard'},{label:'Analytics'}]}
      />

      <div style={{ marginBottom:24 }}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        {STATS_DEF.map((def) => (
          <StatsCard
            key={def.id}
            title={def.title}
            value={def.prefix ? `₹${Number(s[def.key]||0).toLocaleString('en-IN')}` : s[def.key]||0}
            icon={def.icon}
            color={def.color}
          />
        ))}
      </div>

      {chartData.length>0 && (
        <div style={{ marginBottom:20 }}>
          <SCard title="Revenue Trend">
            <div style={{ height:260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{top:5,right:20,bottom:5,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={(v)=>v.slice(5)} />
                  <YAxis tick={{fontSize:10}} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="Revenue (₹)" stroke="#f97316" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Bookings"    stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SCard>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, marginBottom:20 }}>
        <SCard title="Bookings by Status">
          {!(bookings?.byStatus||[]).length ? (
            <p style={{ fontSize:13, color:'#94a3b8', textAlign:'center', padding:'20px 0' }}>No data for selected period</p>
          ) : (bookings?.byStatus||[]).map((item) => (
            <div key={item.status} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
              <Badge variant={getStatusVariant(item.status)} size="md">{item.status?.replace(/_/g,' ')}</Badge>
              <span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{item.count}</span>
            </div>
          ))}
        </SCard>

        <SCard title="Bookings by Type">
          {!(bookings?.byType||[]).length ? (
            <p style={{ fontSize:13, color:'#94a3b8', textAlign:'center', padding:'20px 0' }}>No data for selected period</p>
          ) : (bookings?.byType||[]).map((item) => (
            <div key={item.type} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
              <Badge variant="info" size="md">{item.type}</Badge>
              <span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{item.count}</span>
            </div>
          ))}
        </SCard>
      </div>
    </>
  )
}