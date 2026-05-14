'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import DateRangePicker from '@/components/ui/DateRangePicker'
import RevenueChart from '@/components/admin/RevenueChart'

const fetcher = async (url) => {
  const res = await fetch(url, { credentials: 'include' })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch')
  return json?.data ?? json
}

function ExportBtn({ href }) {
  const [h, setH] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 10,
        border: `1.5px solid ${h ? '#6366f1' : '#e2e8f0'}`,
        background: h ? 'rgba(99,102,241,0.06)' : '#fff',
        color: h ? '#6366f1' : '#475569',
        fontSize: 12,
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'all .15s ease',
      }}
    >
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
  if (dateRange.dateTo) qs.set('dateTo', dateRange.dateTo)

  const { data } = useSWR(`/api/analytics/revenue?${qs}`, fetcher)
  const s = data?.summary || {}

  const chartData = useMemo(
    () => (data?.chartData || []).map((d) => ({ date: d.date, revenue: Number(d.revenue || 0), bookings: Number(d.bookings || 0) })),
    [data]
  )

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
        <StatsCard title="Total Revenue" value={`₹${Number(s.totalRevenue || 0).toLocaleString('en-IN')}`} icon="💰" color="green" />
        <StatsCard title="Platform Fee" value={`₹${Number(s.totalPlatformFee || 0).toLocaleString('en-IN')}`} icon="📊" color="blue" />
        <StatsCard title="GST Collected" value={`₹${Number(s.totalGst || 0).toLocaleString('en-IN')}`} icon="🧾" color="purple" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <RevenueChart
          data={chartData}
          title="Revenue Over Time"
          mode="line"
          xAxisKey="date"
          dataKeys={[{ key: 'revenue', color: '#6366f1', name: 'Revenue' }]}
          height={260}
        />
      </div>

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