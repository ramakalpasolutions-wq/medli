// src/app/(super-admin)/super-admin/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import StatsCard from '@/components/ui/StatsCard'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import AdminHeader from '@/components/admin/AdminHeader'
import { SkeletonStats, SkeletonCard } from '@/components/ui/Skeleton'
import {
  Users, Building2, FlaskConical, Stethoscope,
  Calendar, TrendingUp, AlertCircle, RefreshCw, ArrowRight,
  CheckCircle, Clock, XCircle,
} from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const STATUS_CONFIG = {
  confirmed:       { label: 'Confirmed',   color: 'bg-blue-500'    },
  completed:       { label: 'Completed',   color: 'bg-emerald-500' },
  pending_payment: { label: 'Pending Pay', color: 'bg-amber-500'   },
  created:         { label: 'Created',     color: 'bg-gray-400'    },
  cancelled:       { label: 'Cancelled',   color: 'bg-red-500'     },
  refunded:        { label: 'Refunded',    color: 'bg-purple-500'  },
  no_show:         { label: 'No Show',     color: 'bg-orange-400'  },
}

function StatusBreakdown({ data }) {
  const total = data.reduce((s, b) => s + b.count, 0) || 1
  if (!data.length) return <p className="text-sm text-gray-400 text-center py-4">No booking data yet</p>
  return (
    <div className="space-y-3">
      {data.sort((a, b) => b.count - a.count).map((item) => {
        const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: 'bg-gray-300' }
        const pct = Math.round((item.count / total) * 100)
        return (
          <div key={item.status}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.color}`} />
                <span className="text-xs text-gray-600">{cfg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-800">{item.count}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${cfg.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function SuperAdminDashboard() {
  const router  = useRouter()
  const mounted = useMounted()

  const { data, isLoading, mutate } = useSWR('/api/analytics/dashboard', fetcher, { refreshInterval: 60_000 })

  // ✅ Booking columns — patient name as primary
  const bookingCols = [
    {
      key:    'userName',
      header: 'Patient',
      render: (v, row) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{v || 'Unknown'}</p>
          <p className="text-xs text-gray-400 font-mono">{row.bookingId}</p>
        </div>
      ),
    },
    {
      key:    'type',
      header: 'Type',
      render: (v) => (
        <Badge variant={v === 'lab' ? 'success' : v === 'online' ? 'purple' : 'info'} size="sm">{v}</Badge>
      ),
    },
    {
      key:    'status',
      header: 'Status',
      render: (v) => (
        <Badge variant={getStatusVariant(v)} size="sm" dot>{v?.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key:    'totalAmount',
      header: 'Amount',
      render: (v) => (
        <span className="text-sm font-semibold text-gray-800">
          Rs. {Number(v || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key:    'createdAt',
      header: 'Date',
      render: (v) => mounted
        ? new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })
        : '—',
    },
  ]

  if (isLoading) {
    return (
      <div>
        <AdminHeader title="Dashboard" subtitle="Platform overview" />
        <SkeletonStats count={4} className="mb-6" />
        <SkeletonStats count={3} className="mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  const o  = data?.overview        || {}
  const t  = data?.today           || {}
  const a  = data?.alerts          || {}
  const rb = data?.recentBookings  || []
  const bs = data?.bookingsByStatus || []

  const totalAlerts = (a.pendingHospitals || 0) + (a.pendingLabs || 0)
    + (a.pendingSettlements || 0) + (a.pendingRefunds || 0)

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        subtitle="Real-time platform overview"
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Dashboard' }]}
        actions={
          <button onClick={() => mutate()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: 'Total Users',   value: o.totalUsers    || 0, icon: <Users        className="w-5 h-5" />, color: 'blue',   href: '/super-admin/users'     },
          { title: 'Hospitals',     value: o.totalHospitals|| 0, icon: <Building2    className="w-5 h-5" />, color: 'purple', href: '/super-admin/hospitals' },
          { title: 'Labs',          value: o.totalLabs     || 0, icon: <FlaskConical className="w-5 h-5" />, color: 'green',  href: '/super-admin/labs'      },
          { title: 'Doctors',       value: o.totalDoctors  || 0, icon: <Stethoscope  className="w-5 h-5" />, color: 'orange', href: '/super-admin/doctors'   },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="cursor-pointer" onClick={() => router.push(s.href)}>
            <StatsCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Today's Bookings" value={t.bookings || 0}                                icon={<Calendar    className="w-5 h-5" />} color="indigo" />
        <StatsCard title="Today's Revenue"  value={`Rs. ${Number(t.revenue || 0).toLocaleString('en-IN')}`} icon={<TrendingUp  className="w-5 h-5" />} color="green" valueIsString />
        <StatsCard title="Pending Alerts"   value={totalAlerts}                                    icon={<AlertCircle className="w-5 h-5" />} color="red"   />
      </div>

      {totalAlerts > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Hospitals Pending',  count: a.pendingHospitals   || 0, href: '/super-admin/hospitals',   bg: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100' },
            { label: 'Labs Pending',        count: a.pendingLabs       || 0, href: '/super-admin/labs',        bg: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100' },
            { label: 'Settlements',         count: a.pendingSettlements|| 0, href: '/super-admin/settlements', bg: 'bg-blue-50  border-blue-200  text-blue-800  hover:bg-blue-100'  },
            { label: 'Refunds',             count: a.pendingRefunds    || 0, href: '/super-admin/refunds',     bg: 'bg-red-50   border-red-200   text-red-800   hover:bg-red-100'   },
          ].filter((item) => item.count > 0).map((item) => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all hover:shadow-sm ${item.bg}`}>
              <div>
                <p className="text-xs font-medium opacity-80">{item.label}</p>
                <p className="text-2xl font-bold mt-0.5">{item.count}</p>
              </div>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Bookings" animate
          action={
            <button onClick={() => router.push('/super-admin/bookings')}
              className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          {rb.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">No bookings yet</p>
            </div>
          ) : (
            <DataTable columns={bookingCols} data={rb} keyField="id" emptyTitle="No recent bookings" />
          )}
        </Card>

        <div className="space-y-4">
          <Card title="Booking Status Breakdown" animate>
            <StatusBreakdown data={bs} />
          </Card>

          <Card title="Platform Summary" animate>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Bookings',  value: o.totalBookings    || 0, icon: <Calendar    className="w-4 h-4 text-blue-500"   /> },
                { label: 'Confirmed',       value: o.confirmedBookings|| 0, icon: <CheckCircle className="w-4 h-4 text-emerald-500"/> },
                { label: 'Pending Refunds', value: a.pendingRefunds   || 0, icon: <XCircle     className="w-4 h-4 text-red-500"    /> },
                { label: 'Pending Settle',  value: a.pendingSettlements||0, icon: <Clock       className="w-4 h-4 text-amber-500"  /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-base font-bold text-gray-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Quick Actions" animate>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Users',        href: '/super-admin/users'       },
                { label: 'All Bookings', href: '/super-admin/bookings'    },
                { label: 'Settlements',  href: '/super-admin/settlements' },
                { label: 'Revenue',      href: '/super-admin/revenue'     },
                { label: 'Coupons',      href: '/super-admin/coupons'     },
                { label: 'Audit Logs',   href: '/super-admin/audit-logs'  },
              ].map((item) => (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className="text-left px-3 py-2.5 rounded-xl text-xs font-medium text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-100 hover:border-blue-200 transition-all">
                  {item.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}