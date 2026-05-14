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

export default function RegionalAnalytics() {
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

  const STATS = [
    { title: 'Total Revenue', value: `₹${Number(s.totalRevenue || 0).toLocaleString('en-IN')}`, icon: '💰', color: 'green' },
    { title: 'Platform Fee', value: `₹${Number(s.totalPlatformFee || 0).toLocaleString('en-IN')}`, icon: '📊', color: 'blue' },
    { title: 'Total Bookings', value: s.totalBookings || 0, icon: '📅', color: 'purple' },
  ]

  return (
    <>
      <AdminHeader
        title="Regional Analytics"
        subtitle="Revenue insights for your region"
        breadcrumbs={[{ label: 'Dashboard', href: '/regional/dashboard' }, { label: 'Analytics' }]}
      />

      <div style={{ marginBottom: 24 }}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        {STATS.map((stat) => (
          <StatsCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <RevenueChart
          data={chartData}
          title="Revenue Over Time"
          mode="line"
          xAxisKey="date"
          dataKeys={[{ key: 'revenue', color: '#f97316', name: 'Revenue' }]}
          height={260}
        />
      </div>

      <RevenueChart
        data={chartData}
        title="Bookings Per Day"
        mode="bar"
        xAxisKey="date"
        dataKeys={[{ key: 'bookings', color: '#fdba74', name: 'Bookings' }]}
        height={220}
      />
    </>
  )
}