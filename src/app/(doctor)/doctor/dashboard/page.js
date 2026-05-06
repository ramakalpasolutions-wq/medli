// src/app/(doctor)/doctor/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Card from '@/components/ui/Card'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { Calendar, Video, CheckCircle, XCircle, Clock } from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function DoctorDashboard() {
  const { user }  = useAuth()
  const toast     = useToast()
  const mounted   = useMounted()

  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const { data, mutate } = useSWR('/api/bookings?limit=20&status=confirmed', fetcher)
  const bookings = data?.bookings || []

  const greeting = mounted && now
    ? (now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening')
    : 'Hello'

  const updateStatus = async (id, status) => {
    try {
      const res  = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ status }),
      })
      const json = await res.json()
      json.success ? toast.success(`Marked as ${status}`) : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed to update status') }
  }

  return (
    <div>
      <AdminHeader
        title={mounted ? `${greeting}, Dr. ${user?.name?.split(' ').pop() || ''}` : 'Doctor Dashboard'}
        subtitle="Your dashboard overview"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Today's Appointments" value={bookings.length}                                     icon={<Calendar    className="w-5 h-5" />} color="blue"   />
        <StatsCard title="Online Consults"       value={bookings.filter((b) => b.type === 'online').length} icon={<Video       className="w-5 h-5" />} color="green"  />
        <StatsCard title="Completed"             value={0}                                                  icon={<CheckCircle className="w-5 h-5" />} color="purple" />
        <StatsCard title="Pending"               value={bookings.length}                                    icon={<Clock       className="w-5 h-5" />} color="orange" />
      </div>

      <Card title="Today's Schedule">
        {!bookings.length ? (
          <p className="text-sm text-gray-400 text-center py-8">No appointments for today</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const diffMins = mounted && now ? (new Date(b.startTime) - now) / 60_000 : null
              const showJoin = b.type === 'online' && b.meetLink
                && diffMins !== null && diffMins <= 15 && diffMins >= -30

              return (
                <div key={b.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      {/* ✅ Patient name primary */}
                      <p className="text-sm font-bold text-gray-800">
                        {b.userName || 'Patient'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400 font-mono">{b.bookingId}</p>
                        {mounted && (
                          <>
                            <span className="text-xs text-gray-300">·</span>
                            <p className="text-xs text-gray-400">
                              {formatTime(b.startTime)} – {formatTime(b.endTime)}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
                          style={{ minHeight: 44 }}
                        >
                          <Video className="w-3.5 h-3.5" /> JOIN MEET
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <>
                          <Button size="xs" variant="primary" leftIcon={<CheckCircle className="w-3 h-3" />} onClick={() => updateStatus(b.id, 'completed')}>Complete</Button>
                          <Button size="xs" variant="danger"  leftIcon={<XCircle     className="w-3 h-3" />} onClick={() => updateStatus(b.id, 'no_show')}>No-show</Button>
                        </>
                      )}
                    </div>
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