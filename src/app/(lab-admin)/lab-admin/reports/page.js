// src/app/(lab-admin)/lab-admin/reports/page.js
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
import Card from '@/components/ui/Card'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { SkeletonStats } from '@/components/ui/Skeleton'
import { TrendingUp, Calendar, CheckCircle, FlaskConical } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const PRESETS = [
  { key: 'today',       label: 'Today'        },
  { key: 'last7',       label: 'Last 7 Days'  },
  { key: 'last30',      label: 'Last 30 Days' },
  { key: 'thisMonth',   label: 'This Month'   },
  { key: 'last3Months', label: '3 Months'     },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Revenue'
            ? `Rs. ${Number(entry.value).toLocaleString('en-IN')}`
            : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function LabReportsPage() {
  const [preset, setPreset] = useState('last30')

  const { data: revenueData,  isLoading: rLoading } = useSWR(
    `/api/analytics/revenue?preset=${preset}`, fetcher
  )
  const { data: bookingData,  isLoading: bLoading } = useSWR(
    `/api/analytics/bookings?preset=${preset}`, fetcher
  )
  // Lab's own tests for utilization
  const { data: labData } = useSWR('/api/labs?adminOnly=true', fetcher)
  const labId = labData?.labs?.[0]?.id
  const { data: testsData } = useSWR(
    labId ? `/api/labs/${labId}/tests` : null, fetcher
  )

  const isLoading = rLoading || bLoading
  const s         = revenueData?.summary || {}
  const byStatus  = bookingData?.byStatus || []
  const byType    = bookingData?.byType   || []
  const tests     = testsData?.tests || []

  const chartData = (revenueData?.chartData || []).map((d) => ({
    date:     d.date,
    Revenue:  Math.round(d.revenue  || 0),
    Bookings: d.bookings || 0,
  }))

  return (
    <div>
      <AdminHeader
        title="Reports"
        subtitle="Lab revenue and booking analytics"
        breadcrumbs={[{ label: 'Lab Admin' }, { label: 'Reports' }]}
      />

      {/* Preset filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={preset === p.key
              ? 'px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white transition-colors'
              : 'px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats — gross revenue only, no platform fee */}
      {isLoading ? (
        <SkeletonStats count={3} className="mb-6" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Gross Revenue"
            value={`Rs. ${Number(s.totalRevenue || 0).toLocaleString('en-IN')}`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
            valueIsString
          />
          <StatsCard
            title="Total Bookings"
            value={s.totalBookings || 0}
            icon={<Calendar className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title="Completed"
            value={byStatus.find((st) => st.status === 'completed')?.count || 0}
            icon={<CheckCircle className="w-5 h-5" />}
            color="purple"
          />
        </div>
      )}

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <Card title="Revenue Over Time" className="mb-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Bookings chart */}
      {chartData.length > 0 && (
        <Card title="Bookings Per Day" className="mb-6">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Bookings" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {chartData.length === 0 && !isLoading && (
        <Card className="mb-6">
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">No data for selected period</p>
            <p className="text-gray-300 text-xs mt-1">Try a different date range</p>
          </div>
        </Card>
      )}

      {/* Status + type breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <Card title="Booking by Status">
          {byStatus.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No data</p>
          ) : (
            <div className="space-y-2">
              {byStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <Badge variant={getStatusVariant(item.status)} size="sm">
                    {item.status?.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm font-bold text-gray-800">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Lab Status">
          {byStatus.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No data</p>
          ) : (
            <div className="space-y-2">
              {['sample_collected', 'processing', 'report_ready'].map((status) => {
                const found = byStatus.find((s) => s.status === status)
                return (
                  <div key={status} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600 capitalize">{status.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold text-gray-800">{found?.count || 0}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Test catalogue overview */}
      {tests.length > 0 && (
        <Card title="Test Catalogue">
          <div className="space-y-2">
            {tests.slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.name}</p>
                  {t.category && <p className="text-xs text-gray-400">{t.category}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {t.discountedPrice ? (
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">Rs. {Number(t.discountedPrice).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400 line-through">Rs. {Number(t.price).toLocaleString('en-IN')}</p>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-gray-800">Rs. {Number(t.price).toLocaleString('en-IN')}</p>
                  )}
                  <Badge variant={t.isActive ? 'success' : 'danger'} size="sm">
                    {t.isActive ? 'Active' : 'Off'}
                  </Badge>
                </div>
              </div>
            ))}
            {tests.length > 10 && (
              <p className="text-xs text-gray-400 text-center pt-2">
                +{tests.length - 10} more tests
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}