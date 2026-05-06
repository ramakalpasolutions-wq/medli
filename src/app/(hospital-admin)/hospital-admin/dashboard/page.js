// src/app/(hospital-admin)/hospital-admin/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Card from '@/components/ui/Card'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { Calendar, Users, Video, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function HospitalAdminDashboard() {
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

  const greeting = mounted && now
    ? (now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening')
    : 'Hello'

  const todayStr = mounted ? new Date().toISOString().split('T')[0] : ''

  const { data: bookingsData, mutate } = useSWR(
    mounted && todayStr
      ? `/api/bookings?limit=20&dateFrom=${todayStr}&dateTo=${todayStr}`
      : null,
    fetcher
  )

  const { data: statsData } = useSWR('/api/analytics/dashboard', fetcher)

  const bookings = bookingsData?.bookings || []

  const updateStatus = async (id, status) => {
    try {
      const res  = await fetch(`/api/bookings/${id}/status`, {
        method:      'PATCH',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ status }),
      })
      const json = await res.json()
      json.success ? toast.success(`Marked as ${status}`) : toast.error(json.error)
      mutate()
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div>
      <AdminHeader
        title={mounted ? `${greeting}` : 'Hospital Dashboard'}
        subtitle="Hospital management overview"
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Dashboard' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Today's Bookings" value={bookings.length}                                              icon={<Calendar className="w-5 h-5" />}    color="blue"   />
        <StatsCard title="Online Consults"  value={bookings.filter((b) => b.type === 'online').length}           icon={<Video className="w-5 h-5" />}       color="green"  />
        <StatsCard title="Confirmed"        value={bookings.filter((b) => b.status === 'confirmed').length}      icon={<CheckCircle className="w-5 h-5" />} color="purple" />
        <StatsCard title="Total Bookings"   value={statsData?.overview?.totalBookings || bookings.length}        icon={<TrendingUp className="w-5 h-5" />}  color="orange" />
      </div>

      <Card
        title="Today's Schedule"
        action={
          <button
            onClick={() => router.push('/hospital-admin/bookings')}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            View all
          </button>
        }
      >
        {!bookings.length ? (
          <EmptyState title="No appointments today" message="Bookings will appear here" />
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const diffMins = mounted && now
                ? (new Date(b.startTime) - now) / 60_000
                : null
              const showJoin = b.type === 'online' && b.meetLink
                && diffMins !== null && diffMins <= 15 && diffMins >= -30

              return (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-800 font-mono">{b.bookingId}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {mounted && b.startTime
                        ? new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </p>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <Badge variant="info" size="sm">{b.type}</Badge>
                      <Badge variant={getStatusVariant(b.status)} size="sm" dot>
                        {b.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {mounted && showJoin && (
                      <button
                        onClick={() => window.open(b.meetLink, '_blank')}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                        style={{ minHeight: 36 }}
                      >
                        <Video className="w-3.5 h-3.5" /> JOIN MEET
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <>
                        <Button size="xs" variant="primary" leftIcon={<CheckCircle className="w-3 h-3" />} onClick={() => updateStatus(b.id, 'completed')}>Complete</Button>
                        <Button size="xs" variant="danger"  leftIcon={<XCircle className="w-3 h-3" />}     onClick={() => updateStatus(b.id, 'no_show')}>No-show</Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}