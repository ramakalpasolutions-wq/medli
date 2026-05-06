// src/app/(user)/user/dashboard/page.js
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { Video as VideoIcon } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

// ✅ Shared useMounted hook
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted
}

const QUICK = [
  { icon: '🏥', label: 'Book Appointment', href: '/hospitals', color: 'bg-blue-50 text-blue-600'   },
  { icon: '🧪', label: 'Book Lab Test',    href: '/labs',      color: 'bg-green-50 text-green-600'  },
  { icon: '👨‍⚕️', label: 'Online Consult',   href: '/doctors',   color: 'bg-purple-50 text-purple-600'},
  { icon: '📄', label: 'My Reports',       href: '/user/bookings', color: 'bg-orange-50 text-orange-600'},
]

export default function UserDashboard() {
  const { user } = useAuth()
  const mounted  = useMounted()

  // ✅ Clock — only on client
  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const { data } = useSWR(
    mounted ? '/api/bookings?limit=3&filter=upcoming' : null,
    fetcher
  )
  const bookings = data?.bookings || []

  // ✅ Derived values — only after mount
  const greeting = !mounted || !now
    ? 'Hello'
    : now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 17
        ? 'Good afternoon'
        : 'Good evening'

  const firstName = mounted ? (user?.name?.split(' ')[0] || 'there') : ''

  const upcoming  = bookings[0]
  const diffMins  = mounted && upcoming && now
    ? (new Date(upcoming.startTime) - now) / 60_000
    : null
  const showJoin  = upcoming?.type === 'online'
    && diffMins !== null
    && diffMins <= 15
    && diffMins >= -30

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* ── Greeting ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* ✅ Static shell — same on server & client, content fills after mount */}
          <h1 className="text-2xl font-bold text-gray-900">
            {mounted
              ? `${greeting}, ${firstName}! 👋`
              : 'Hello! 👋'
            }
          </h1>
          <p className="text-gray-500 text-sm mt-1">Stay healthy, stay happy</p>
        </motion.div>

        {/* ── Upcoming booking banner ───────────────────────────────── */}
        {mounted && upcoming && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
            <p className="text-blue-100 text-xs font-medium mb-1">
              UPCOMING APPOINTMENT
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-bold">{upcoming.bookingId}</p>
                <p className="text-blue-100 text-sm">
                  {new Date(upcoming.startTime).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                <Badge variant="info" size="sm" className="mt-2">
                  {upcoming.type} · ₹{upcoming.totalAmount}
                </Badge>
              </div>
              {showJoin && (
                <button
                  onClick={() => window.open(upcoming.meetLink, '_blank')}
                  className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
                  style={{ minHeight: 44 }}
                >
                  <VideoIcon className="w-4 h-4" /> JOIN MEET
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Quick actions ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {QUICK.map((q, i) => (
            <motion.a
              key={q.label}
              href={q.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 text-center cursor-pointer"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <div className={`w-10 h-10 rounded-xl ${q.color} flex items-center justify-center text-xl mx-auto mb-2`}>
                {q.icon}
              </div>
              <p className="text-xs font-medium text-gray-700">{q.label}</p>
            </motion.a>
          ))}
        </div>

        {/* ── Recent bookings ───────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-gray-100 p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Recent Bookings</h3>
            <a href="/user/bookings" className="text-xs text-blue-600 font-medium hover:underline">
              View all
            </a>
          </div>

          {!mounted ? (
            /* ✅ Skeleton — identical structure, no text mismatch */
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No bookings yet.{' '}
              <a href="/hospitals" className="text-blue-600">Book now</a>
            </p>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.bookingId}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(b.startTime).toLocaleDateString('en-IN')} · {b.type}
                  </p>
                </div>
                <Badge variant={getStatusVariant(b.status)} size="sm" dot>
                  {b.status?.replace('_', ' ')}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}