'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import DateRangePicker from '@/components/ui/DateRangePicker'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }}>
      <p style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>{label}</p>
      {payload.map((e) => (
        <p key={e.name} style={{ color: e.color, margin: '2px 0' }}>
          {e.name}: {e.name.includes('₹') || e.name.toLowerCase().includes('revenue') ? `₹${Number(e.value).toLocaleString('en-IN')}` : e.value}
        </p>
      ))}
    </div>
  )
}

function ExportBtn({ href }) {
  const [h, setH] = useState(false)
  return (
    <a href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 10,
        border: `1.5px solid ${h ? '#6366f1' : '#e2e8f0'}`,
        background: h ? 'rgba(99,102,241,0.06)' : '#fff',
        color: h ? '#6366f1' : '#475569',
        fontSize: 12, fontWeight: 600, textDecoration: 'none',
        transition: 'all .15s ease',
      }}>
      ⬇ Export CSV
    </a>
  )
}

function SCard({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({ preset: 'last30', dateFrom: '', dateTo: '' })
  const qs = new URLSearchParams({ preset: dateRange.preset })
  if (dateRange.dateFrom) qs.set('dateFrom', dateRange.dateFrom)
  if (dateRange.dateTo)   qs.set('dateTo',   dateRange.dateTo)

  const { data } = useSWR(`/api/analytics/revenue?${qs}`, fetcher)
  const s = data?.summary || {}

  const chartData = (data?.chartData || []).map((d) => ({
    date: d.date, 'Revenue (₹)': Math.round(d.revenue || 0), Bookings: d.bookings || 0,
  }))

  return (
    <>
      <AdminHeader
        title="Revenue Analytics"
        subtitle="Platform revenue insights"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Analytics' }]}
        actions={<ExportBtn href={`/api/analytics/export?format=csv&${qs}`} />}
      />

      <div style={{ marginBottom: 24 }}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard title="Total Revenue"  value={`₹${Number(s.totalRevenue    || 0).toLocaleString('en-IN')}`} icon="💰" color="green"  />
        <StatsCard title="Platform Fee"   value={`₹${Number(s.totalPlatformFee|| 0).toLocaleString('en-IN')}`} icon="📊" color="blue"   />
        <StatsCard title="GST Collected"  value={`₹${Number(s.totalGst        || 0).toLocaleString('en-IN')}`} icon="🧾" color="purple" />
      </div>

      {chartData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SCard title="Revenue Over Time">
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="Revenue (₹)" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SCard>
        </div>
      )}

      {/* Breakdown by type */}
      <SCard title="Breakdown by Type">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
          {Object.entries(data?.breakdown || {}).map(([type, amount]) => (
            <div key={type} style={{ padding: 16, background: '#f8fafc', borderRadius: 14, textAlign: 'center', border: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'capitalize' }}>{type}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>₹{(amount || 0).toLocaleString('en-IN')}</p>
            </div>
          ))}
          {!Object.keys(data?.breakdown || {}).length && (
            <p style={{ fontSize: 13, color: '#94a3b8', padding: '20px 0' }}>No data for selected period</p>
          )}
        </div>
      </SCard>
    </>
  )
}