'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Card from '@/components/ui/Card'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { Calendar, Users, Video, Clock, CheckCircle, XCircle } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function DoctorDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, mutate } = useSWR('/api/bookings?limit=20&status=confirmed', fetcher)
  const [now, setNow] = useState(new Date())

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t) }, [])

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/bookings/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status }) })
      const json = await res.json()
      json.success ? toast.success(`Marked as ${status}`) : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed') }
  }

  return (
    <div>
      <AdminHeader title={`${greeting}, Dr. ${user?.name?.split(' ').pop() || ''}`} subtitle="Your dashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Today Appointments" value={(data?.bookings || []).length} icon={<Calendar className="w-5 h-5" />} color="blue" />
        <StatsCard title="Online Consults" value={(data?.bookings || []).filter((b) => b.type === 'online').length} icon={<Video className="w-5 h-5" />} color="green" />
        <StatsCard title="Completed" value={0} icon={<CheckCircle className="w-5 h-5" />} color="purple" />
        <StatsCard title="Pending" value={(data?.bookings || []).length} icon={<Clock className="w-5 h-5" />} color="orange" />
      </div>

      <Card title="Today's Schedule">
        {(data?.bookings || []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No appointments for today</p>
        ) : (
          <div className="space-y-3">
            {(data?.bookings || []).map((b) => {
              const diffMins = (new Date(b.startTime) - now) / 60000
              const showJoin = b.type === 'online' && diffMins <= 15 && diffMins >= -30

              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{b.bookingId}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} –
                        {new Date(b.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={getStatusVariant(b.type === 'online' ? 'info' : 'neutral')} size="sm">{b.type}</Badge>
                        <Badge variant={getStatusVariant(b.status)} size="sm" dot>{b.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {showJoin && (
                        <button
                          onClick={() => window.open(b.meetLink, '_blank')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" /> JOIN MEET
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <>
                          <Button size="xs" variant="primary" leftIcon={<CheckCircle className="w-3 h-3" />} onClick={() => updateStatus(b.id, 'completed')}>Complete</Button>
                          <Button size="xs" variant="danger" leftIcon={<XCircle className="w-3 h-3" />} onClick={() => updateStatus(b.id, 'no_show')}>No-show</Button>
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