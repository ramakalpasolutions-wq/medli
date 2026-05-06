'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import RevenueChart from '@/components/admin/RevenueChart'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { IndianRupee, TrendingUp, CreditCard } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function RegionalAnalytics() {
  const [dateRange, setDateRange] = useState({ preset: 'last30', dateFrom: '', dateTo: '' })
  const qs = new URLSearchParams({ preset: dateRange.preset })
  const { data } = useSWR(`/api/analytics/revenue?${qs}`, fetcher)
  const s = data?.summary || {}

  return (
    <div>
      <AdminHeader title="Regional Analytics" subtitle="Revenue insights for your region" />
      <DateRangePicker value={dateRange} onChange={setDateRange} className="mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Revenue" value={s.totalRevenue || 0} prefix="₹" icon={<IndianRupee className="w-5 h-5" />} color="green" />
        <StatsCard title="Platform Fee" value={s.totalPlatformFee || 0} prefix="₹" icon={<TrendingUp className="w-5 h-5" />} color="blue" />
        <StatsCard title="Bookings" value={s.totalBookings || 0} icon={<CreditCard className="w-5 h-5" />} color="purple" />
      </div>
      <RevenueChart data={data?.chartData || []} />
    </div>
  )
}