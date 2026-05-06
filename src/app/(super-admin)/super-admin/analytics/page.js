'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import RevenueChart from '@/components/admin/RevenueChart'
import DateRangePicker from '@/components/ui/DateRangePicker'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { IndianRupee, TrendingUp, CreditCard, Users, Download } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({ preset: 'last30', dateFrom: '', dateTo: '' })
  const qs = new URLSearchParams({ preset: dateRange.preset })
  if (dateRange.dateFrom) qs.set('dateFrom', dateRange.dateFrom)
  if (dateRange.dateTo) qs.set('dateTo', dateRange.dateTo)

  const { data } = useSWR(`/api/analytics/revenue?${qs}`, fetcher)
  const s = data?.summary || {}

  return (
    <div>
      <AdminHeader title="Revenue Analytics" subtitle="Platform revenue insights" actions={
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={() => window.location.href = `/api/analytics/export?format=csv&${qs}`}>Export CSV</Button>
        </div>
      } />
      <DateRangePicker value={dateRange} onChange={setDateRange} className="mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Revenue" value={s.totalRevenue || 0} prefix="₹" icon={<IndianRupee className="w-5 h-5" />} color="green" />
        <StatsCard title="Platform Fee" value={s.totalPlatformFee || 0} prefix="₹" icon={<TrendingUp className="w-5 h-5" />} color="blue" />
        <StatsCard title="GST Collected" value={s.totalGst || 0} prefix="₹" icon={<CreditCard className="w-5 h-5" />} color="purple" />
      </div>
      <RevenueChart data={data?.chartData || []} className="mb-6" />
      <Card title="Breakdown by Type">
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(data?.breakdown || {}).map(([type, amount]) => (
            <div key={type} className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1 capitalize">{type}</p>
              <p className="text-lg font-bold text-gray-800">₹{(amount || 0).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}