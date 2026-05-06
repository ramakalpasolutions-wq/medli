// src/app/(doctor)/doctor/appointments/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import { CheckCircle, XCircle, X, Save, Video, Calendar, Phone } from 'lucide-react'

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

function formatDateLabel(date) {
  return {
    weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    day:     date.getDate(),
    month:   date.toLocaleDateString('en-IN', { month: 'short' }),
  }
}

export default function AppointmentsPage() {
  const toast   = useToast()
  const mounted = useMounted()

  const [selectedDate,    setSelectedDate]    = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [notes,           setNotes]           = useState('')
  const [filter,          setFilter]          = useState('all')
  const [dates,           setDates]           = useState([])

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const generated = []
    for (let i = -3; i <= 10; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      generated.push(d)
    }
    setDates(generated)
    setSelectedDate(today.toISOString().split('T')[0])
  }, [])

  const todayStr = mounted ? new Date().toISOString().split('T')[0] : ''

  const { data, mutate } = useSWR(
    selectedDate ? `/api/bookings?limit=50&dateFrom=${selectedDate}&dateTo=${selectedDate}` : null,
    fetcher
  )

  const bookings = (data?.bookings || []).filter((b) => filter === 'all' || b.type === filter)

  const updateStatus = async (id, status) => {
    try {
      const res  = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ status }),
      })
      const json = await res.json()
      json.success ? toast.success(`Marked ${status}`) : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed to update status') }
  }

  return (
    <div>
      <AdminHeader title="Appointments" subtitle="Your appointment schedule" />

      {mounted && dates.length > 0 && (
        <div className="overflow-x-auto flex gap-2 pb-2 mb-4">
          {dates.map((d) => {
            const ds       = d.toISOString().split('T')[0]
            const isToday  = ds === todayStr
            const isActive = ds === selectedDate
            const labels   = formatDateLabel(d)
            return (
              <button key={ds} onClick={() => setSelectedDate(ds)}
                className={isActive
                  ? 'flex flex-col items-center min-w-[56px] px-3 py-2 rounded-xl text-xs bg-blue-600 text-white transition-colors'
                  : isToday
                    ? 'flex flex-col items-center min-w-[56px] px-3 py-2 rounded-xl text-xs bg-blue-50 text-blue-600 border border-blue-200 transition-colors'
                    : 'flex flex-col items-center min-w-[56px] px-3 py-2 rounded-xl text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors'}>
                <span className="font-semibold">{labels.weekday}</span>
                <span className="text-lg font-bold leading-tight">{labels.day}</span>
                <span>{labels.month}</span>
              </button>
            )
          })}
        </div>
      )}

      {!mounted && (
        <div className="flex gap-2 pb-2 mb-4 overflow-hidden">
          {[1,2,3,4,5,6,7].map((i) => (
            <div key={i} className="flex-shrink-0 min-w-[56px] h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'all',      label: 'All'       },
          { key: 'hospital', label: 'In-Person' },
          { key: 'online',   label: 'Online'    },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={filter === f.key
              ? 'px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-600 text-white transition-colors'
              : 'px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!selectedDate ? (
          <EmptyState title="Loading appointments…" />
        ) : bookings.length === 0 ? (
          <EmptyState icon={<Calendar className="w-10 h-10 text-gray-300" />} title="No appointments" message="No appointments on this date" />
        ) : (
          bookings.map((b, i) => {
            const now      = mounted ? new Date() : null
            const diffMins = now ? (new Date(b.startTime) - now) / 60_000 : null
            const showJoin = b.type === 'online' && b.meetLink
              && diffMins !== null && diffMins <= 15 && diffMins >= -30

            return (
              <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div
                  className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                  onClick={() => { setSelectedBooking(b); setNotes(b.doctorNotes || '') }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                            <p className="text-xs text-gray-400">{formatTime(b.startTime)}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="info" size="sm">{b.type}</Badge>
                      <Badge variant={getStatusVariant(b.status)} size="sm" dot>
                        {b.status?.replace(/_/g, ' ')}
                      </Badge>
                      {mounted && showJoin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(b.meetLink, '_blank') }}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                          style={{ minHeight: 36 }}
                        >
                          <Video className="w-3 h-3" /> JOIN
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      <AnimatePresence>
        {selectedBooking && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedBooking(null)} />
            <motion.div
              initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-full max-w-sm bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                {/* ✅ Patient name in panel header */}
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">
                    {selectedBooking.userName || 'Patient'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">{selectedBooking.bookingId}</p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-0 divide-y divide-gray-50">
                  {[
                    ['Patient',  selectedBooking.userName  || 'Unknown'],
                    ['Phone',    selectedBooking.userPhone || '—'],
                    ['Type',     selectedBooking.type],
                    ['Status',   selectedBooking.status?.replace(/_/g, ' ')],
                    ['Time',     mounted ? formatTime(selectedBooking.startTime) : '—'],
                    ['Amount',   `Rs. ${selectedBooking.totalAmount}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2">
                      <span className="text-xs text-gray-500">{k}</span>
                      <span className="text-xs font-medium text-gray-800 capitalize">{v}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Doctor Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    placeholder="Add consultation notes..."
                  />
                  <Button size="sm" className="mt-2" leftIcon={<Save className="w-3 h-3" />}
                    onClick={() => toast.info('Notes save coming soon')}>
                    Save Notes
                  </Button>
                </div>
              </div>

              {selectedBooking.status === 'confirmed' && (
                <div className="p-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
                  <Button className="flex-1" variant="primary" leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => { updateStatus(selectedBooking.id, 'completed'); setSelectedBooking(null) }}>
                    Complete
                  </Button>
                  <Button className="flex-1" variant="danger" leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => { updateStatus(selectedBooking.id, 'no_show'); setSelectedBooking(null) }}>
                    No-show
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}