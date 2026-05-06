// src/app/(lab-admin)/lab-admin/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Card from '@/components/ui/Card'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { FlaskConical, Clock, Home, TrendingUp, Upload, RefreshCw } from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function LabAdminDashboard() {
  const { user }  = useAuth()
  const toast     = useToast()
  const router    = useRouter()
  const mounted   = useMounted()

  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const todayStr = mounted ? new Date().toISOString().split('T')[0] : ''

  // Fetch lab info
  const { data: labData }  = useSWR('/api/labs?adminOnly=true', fetcher)
  const labId = labData?.labs?.[0]?.id

  // Today's bookings
  const { data: todayData, mutate } = useSWR(
    mounted && todayStr
      ? `/api/bookings?limit=20&type=lab&dateFrom=${todayStr}&dateTo=${todayStr}`
      : null,
    fetcher
  )

  // All recent bookings for pending reports
  const { data: allData } = useSWR('/api/bookings?limit=50&type=lab', fetcher)

  const todayBookings = todayData?.bookings   || []
  const allBookings   = allData?.bookings     || []

  const pendingReports   = allBookings.filter((b) => b.labStatus !== 'report_ready' && b.status === 'confirmed')
  const homeCollections  = todayBookings.filter((b) => b.collectionType === 'home')

  // Pending settlement amount (test revenue only — no platform fee)
  const { data: pendingSettlement } = useSWR('/api/settlements/pending', fetcher)
  const mySettlement = (pendingSettlement?.labs || []).find((l) => l.id === labId)
  const pendingAmount = mySettlement?.netSettlementAmount || 0

  const greeting = mounted && now
    ? (now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening')
    : 'Hello'

  const uploadReport = (bookingId) => {
    router.push(`/lab-admin/bookings?upload=${bookingId}`)
  }

  return (
    <div>
      <AdminHeader
        title={mounted ? `${greeting}, ${user?.name?.split(' ')[0] || 'Admin'}` : 'Lab Dashboard'}
        subtitle="Lab management overview"
        actions={
          <button
            onClick={() => mutate()}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        }
      />

      {/* Stats — NO revenue shown, only test bookings info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Today's Bookings"
          value={todayBookings.length}
          icon={<FlaskConical className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Pending Reports"
          value={pendingReports.length}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
        <StatsCard
          title="Home Collections"
          value={homeCollections.length}
          icon={<Home className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Pending Settlement"
          value={`Rs. ${Number(pendingAmount).toLocaleString('en-IN')}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
          valueIsString
        />
      </div>

      {/* Pending reports */}
      <Card
        title="Pending Reports"
        action={
          <button
            onClick={() => router.push('/lab-admin/bookings')}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            View all
          </button>
        }
      >
        {pendingReports.length === 0 ? (
          <EmptyState
            title="All reports uploaded"
            message="No pending reports"
          />
        ) : (
          <div className="space-y-3">
            {pendingReports.slice(0, 5).map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800 font-mono">{b.bookingId}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {mounted && b.startTime
                      ? new Date(b.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                      : '—'}
                  </p>
                  <div className="flex gap-2 mt-1.5">
                    <Badge variant={getStatusVariant(b.status)} size="sm">{b.status?.replace(/_/g, ' ')}</Badge>
                    <Badge variant="warning" size="sm">{b.labStatus || 'pending'}</Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => router.push('/lab-admin/bookings')}
                >
                  Upload
                </Button>
              </motion.div>
            ))}
            {pendingReports.length > 5 && (
              <button
                onClick={() => router.push('/lab-admin/bookings')}
                className="w-full text-xs text-blue-600 font-medium py-2 hover:underline"
              >
                +{pendingReports.length - 5} more pending reports
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Today's schedule */}
      {todayBookings.length > 0 && (
        <Card title="Today's Schedule" className="mt-5">
          <div className="space-y-3">
            {todayBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800 font-mono">{b.bookingId}</p>
                  <p className="text-xs text-gray-400">
                    {mounted && b.startTime
                      ? new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                    {b.collectionType === 'home' && (
                      <span className="ml-2 text-green-600 font-medium">🏠 Home</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(b.labStatus || 'pending')} size="sm">
                    {b.labStatus?.replace(/_/g, ' ') || 'pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}