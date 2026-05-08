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
          {e.name}: {e.name.includes('Revenue')||e.name.includes('₹')?`₹${Number(e.value).toLocaleString('en-IN')}`:e.value}
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

export default function RegionalAnalytics() {
  const [dateRange, setDateRange] = useState({ preset:'last30', dateFrom:'', dateTo:'' })

  const qs = new URLSearchParams({ preset: dateRange.preset })
  if (dateRange.dateFrom) qs.set('dateFrom', dateRange.dateFrom)
  if (dateRange.dateTo)   qs.set('dateTo',   dateRange.dateTo)

  const { data } = useSWR(`/api/analytics/revenue?${qs}`, fetcher)
  const s = data?.summary || {}

  const chartData = (data?.chartData || []).map((d) => ({
    date:d.date, 'Revenue (₹)':Math.round(d.revenue||0), Bookings:d.bookings||0,
  }))

  const STATS = [
    { title:'Total Revenue',  value:`₹${Number(s.totalRevenue||0).toLocaleString('en-IN')}`, icon:'💰', color:'green'  },
    { title:'Platform Fee',   value:`₹${Number(s.totalPlatformFee||0).toLocaleString('en-IN')}`, icon:'📊', color:'blue'  },
    { title:'Total Bookings', value:s.totalBookings||0,                                      icon:'📅', color:'purple' },
  ]

  return (
    <>
      <AdminHeader
        title="Regional Analytics"
        subtitle="Revenue insights for your region"
        breadcrumbs={[{label:'Dashboard',href:'/regional/dashboard'},{label:'Analytics'}]}
      />

      <div style={{ marginBottom:24 }}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        {STATS.map((s) => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

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
                  <Line type="monotone" dataKey="Revenue (₹)" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SCard>
        </div>
      )}

      {chartData.length>0 && (
        <SCard title="Bookings Per Day">
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{top:5,right:20,bottom:5,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={(v)=>v.slice(5)} />
                <YAxis tick={{fontSize:10}} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Bookings" fill="#fdba74" radius={[4,4,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SCard>
      )}

      {!chartData.length && (
        <SCard>
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:13, padding:'32px 0' }}>No data for selected period</p>
        </SCard>
      )}
    </>
  )
}