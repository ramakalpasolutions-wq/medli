'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import RevenueChart from '@/components/admin/RevenueChart'
import DateRangePicker from '@/components/ui/DateRangePicker'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import {
  IndianRupee,
  TrendingUp,
  CreditCard,
  Calendar,
  Download,
  Building2,
  FlaskConical,
  Video,
} from 'lucide-react'

const fetcher = async (url) => {
  const res = await fetch(url, { credentials: 'include' })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch')
  return json?.data ?? json
}

const BOOKING_TYPE_CONFIG = [
  { key: 'hospital', label: 'Hospital', icon: <Building2 className="w-4 h-4" />, color: 'blue' },
  { key: 'online', label: 'Online', icon: <Video className="w-4 h-4" />, color: 'purple' },
  { key: 'lab', label: 'Lab Tests', icon: <FlaskConical className="w-4 h-4" />, color: 'green' },
]

export default function RevenuePage() {
  const [dateRange, setDateRange] = useState({
    preset: 'last30',
    dateFrom: '',
    dateTo: '',
  })

  const qs = new URLSearchParams({ preset: dateRange.preset })
  if (dateRange.dateFrom) qs.set('dateFrom', dateRange.dateFrom)
  if (dateRange.dateTo) qs.set('dateTo', dateRange.dateTo)

  const { data, isLoading } = useSWR(`/api/analytics/revenue?${qs}`, fetcher)
  const s = data?.summary || {}

  const chartData = useMemo(
    () => (data?.chartData || []).map((row) => ({
      date: row.date,
      revenue: Number(row.revenue || 0),
      bookings: Number(row.bookings || 0),
    })),
    [data]
  )

  const handleExportCSV = () => {
    window.location.href = `/api/analytics/export?format=csv&${qs}`
  }

  const STATS = [
    {
      id: 'total-revenue',
      title: 'Total Revenue',
      value: s.totalRevenue || 0,
      prefix: '₹',
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'green',
    },
    {
      id: 'platform-fee',
      title: 'Platform Fee Earned',
      value: s.totalPlatformFee || 0,
      prefix: '₹',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'blue',
    },
    {
      id: 'gst-collected',
      title: 'GST Collected',
      value: s.totalGst || 0,
      prefix: '₹',
      icon: <CreditCard className="w-5 h-5" />,
      color: 'purple',
    },
    {
      id: 'total-bookings',
      title: 'Paid Bookings',
      value: s.totalBookings || 0,
      icon: <Calendar className="w-5 h-5" />,
      color: 'orange',
    },
    {
      id: 'avg-order',
      title: 'Avg. Order Value',
      value: s.totalBookings > 0 ? Math.round((s.totalRevenue || 0) / s.totalBookings) : 0,
      prefix: '₹',
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'indigo',
    },
    {
      id: 'net-to-providers',
      title: 'Net to Providers',
      value: Math.max(0, (s.totalRevenue || 0) - (s.totalPlatformFee || 0) - (s.totalGst || 0)),
      prefix: '₹',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'green',
    },
  ]

  return (
    <div>
      <AdminHeader
        title="Revenue Analytics"
        subtitle="Platform revenue insights and breakdown"
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Revenue' },
        ]}
        actions={
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        }
      />

      <div className="mb-6">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {STATS.map((stat) => (
            <StatsCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              prefix={stat.prefix || ''}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>
      )}

      <div className="mb-6">
        <RevenueChart
          data={chartData}
          title="Revenue Over Time"
          dataKeys={[
            { key: 'revenue', color: '#1286f5', name: 'Revenue' },
            { key: 'bookings', color: '#10b981', name: 'Bookings' },
          ]}
          xAxisKey="date"
          mode="line"
          height={320}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue by Booking Type">
          <div className="space-y-4">
            {BOOKING_TYPE_CONFIG.map((type) => {
              const amount = data?.breakdown?.[type.key] || 0
              const total = s.totalRevenue || 1
              const percentage = Math.round((amount / total) * 100)

              return (
                <div key={type.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{type.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{type.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-800">₹{amount.toLocaleString('en-IN')}</span>
                      <Badge variant="info" size="sm">{percentage}%</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor:
                          type.color === 'blue' ? '#1286f5' :
                          type.color === 'purple' ? '#8b5cf6' :
                          '#10b981',
                      }}
                    />
                  </div>
                </div>
              )
            })}

            {!data?.breakdown && !isLoading && (
              <p className="text-xs text-gray-400 text-center py-4">No revenue data for selected period</p>
            )}
          </div>
        </Card>

        <Card title="Daily Revenue Summary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Bookings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {chartData.slice(-10).reverse().map((row) => (
                  <tr key={row.date} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                      {new Date(row.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800 text-xs">
                      ₹{row.revenue.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-500 text-xs">
                      {row.bookings}
                    </td>
                  </tr>
                ))}
                {!chartData.length && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-xs text-gray-400">
                      No data for selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}