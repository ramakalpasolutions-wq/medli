'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import RevenueChart from '@/components/admin/RevenueChart'
import DateRangePicker from '@/components/ui/DateRangePicker'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { IndianRupee, TrendingUp, Calendar, CreditCard } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

export default function RegionalReportsPage() {
  const [dateRange, setDateRange] = useState({
    preset: 'last30', dateFrom: '', dateTo: '',
  })

  const qs = new URLSearchParams({ preset: dateRange.preset })
  if (dateRange.dateFrom) qs.set('dateFrom', dateRange.dateFrom)
  if (dateRange.dateTo)   qs.set('dateTo',   dateRange.dateTo)

  const { data: revenue, isLoading } = useSWR(
    `/api/analytics/revenue?${qs}`,
    fetcher
  )

  const { data: bookings } = useSWR(
    `/api/analytics/bookings?${qs}`,
    fetcher
  )

  const s = revenue?.summary || {}

  const STATS = [
    {
      id:    'revenue',
      title: 'Total Revenue',
      value: s.totalRevenue    || 0,
      prefix:'₹',
      icon:  <IndianRupee className="w-5 h-5" />,
      color: 'green',
    },
    {
      id:    'platform-fee',
      title: 'Platform Fee',
      value: s.totalPlatformFee || 0,
      prefix:'₹',
      icon:  <TrendingUp className="w-5 h-5" />,
      color: 'blue',
    },
    {
      id:    'bookings',
      title: 'Total Bookings',
      value: s.totalBookings   || 0,
      icon:  <Calendar className="w-5 h-5" />,
      color: 'purple',
    },
    {
      id:    'gst',
      title: 'GST Collected',
      value: s.totalGst        || 0,
      prefix:'₹',
      icon:  <CreditCard className="w-5 h-5" />,
      color: 'orange',
    },
  ]

  return (
    <div>
      <AdminHeader
        title="Regional Reports"
        subtitle="Revenue and booking analytics for your region"
        breadcrumbs={[
          { label: 'Dashboard', href: '/regional/dashboard' },
          { label: 'Reports' },
        ]}
      />

      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        className="mb-6"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map((s) => (
          <StatsCard
            key={s.id}
            title={s.title}
            value={s.value}
            prefix={s.prefix || ''}
            icon={s.icon}
            color={s.color}
          />
        ))}
      </div>

      {/* Chart */}
      <div className="mb-6">
        <RevenueChart
          data={revenue?.chartData || []}
          title="Revenue Trend"
          dataKeys={[
            { key: 'revenue',  color: '#1286f5', name: 'Revenue (₹)' },
            { key: 'bookings', color: '#10b981', name: 'Bookings' },
          ]}
        />
      </div>

      {/* Booking breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Bookings by Status">
          <div className="space-y-3">
            {(bookings?.byStatus || []).map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <Badge
                  variant={
                    item.status === 'completed'  ? 'success'
                    : item.status === 'cancelled' ? 'danger'
                    : item.status === 'confirmed' ? 'info'
                    : 'warning'
                  }
                  size="md"
                >
                  {item.status?.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm font-semibold text-gray-800">
                  {item.count}
                </span>
              </div>
            ))}
            {!bookings?.byStatus?.length && (
              <p className="text-xs text-gray-400 text-center py-4">
                No data for selected period
              </p>
            )}
          </div>
        </Card>

        <Card title="Bookings by Type">
          <div className="space-y-3">
            {(bookings?.byType || []).map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <Badge variant="info" size="md">
                  {item.type}
                </Badge>
                <span className="text-sm font-semibold text-gray-800">
                  {item.count}
                </span>
              </div>
            ))}
            {!bookings?.byType?.length && (
              <p className="text-xs text-gray-400 text-center py-4">
                No data for selected period
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}