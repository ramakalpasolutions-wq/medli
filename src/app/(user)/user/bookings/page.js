// src/app/(user)/user/bookings/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { Calendar, ChevronRight, FlaskConical, Video, Building2 } from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const TABS = [
  { key: 'upcoming',  label: 'Upcoming',  icon: '📅' },
  { key: 'completed', label: 'Completed', icon: '✅' },
  { key: 'cancelled', label: 'Cancelled', icon: '❌' },
]

function TypeIcon({ type }) {
  if (type === 'lab')    return <FlaskConical className="w-4 h-4 text-green-500" />
  if (type === 'online') return <Video className="w-4 h-4 text-purple-500" />
  return <Building2 className="w-4 h-4 text-blue-500" />
}

function TypeLabel({ type }) {
  if (type === 'lab')    return 'Lab Test'
  if (type === 'online') return 'Online Consult'
  return 'Hospital Visit'
}

function BookingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-5 w-16 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

function BookingCard({ booking, onClick, mounted }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-all"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          {/* ✅ Patient name as primary */}
          <p className="text-sm font-bold text-gray-800">
            {booking.userName || 'Patient'}
          </p>
          {/* Booking ID as secondary */}
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            {booking.bookingId}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {mounted
              ? new Date(booking.startTime).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : '—'}
          </p>
        </div>
        <Badge variant={getStatusVariant(booking.status)} size="sm" dot>
          {booking.status?.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600">
            <TypeIcon type={booking.type} />
            <TypeLabel type={booking.type} />
          </span>
          {booking.type === 'lab' && booking.labStatus && (
            <Badge variant={getStatusVariant(booking.labStatus)} size="sm">
              {booking.labStatus?.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-800">
            Rs. {Number(booking.totalAmount || 0).toLocaleString('en-IN')}
          </p>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      {mounted && booking.type === 'online' && booking.status === 'confirmed' && (() => {
        const diff = (new Date(booking.startTime) - new Date()) / 60000
        return diff <= 15 && diff >= -30
      })() && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-600 font-medium">Consultation available now</span>
        </div>
      )}
    </motion.div>
  )
}

export default function BookingsPage() {
  const [tab,  setTab]  = useState('upcoming')
  const router  = useRouter()
  const mounted = useMounted()

  const { data, isLoading } = useSWR(`/api/bookings?filter=${tab}&limit=20`, fetcher)
  const bookings = data?.bookings || []

  const emptyMessages = {
    upcoming:  { title: 'No upcoming bookings', message: 'Book a hospital, lab, or doctor consultation' },
    completed: { title: 'No completed bookings', message: 'Your completed appointments will appear here' },
    cancelled: { title: 'No cancelled bookings', message: "You haven't cancelled any bookings" },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <a href="/hospitals" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            + New Booking
          </a>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
          {TABS.map((t) => {
            const count = !isLoading && tab === t.key ? bookings.length : null
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={tab === t.key
                  ? 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white text-gray-900 shadow-sm transition-all'
                  : 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-all'}
              >
                <span className="hidden sm:inline">{t.icon}</span>
                <span>{t.label}</span>
                {count !== null && count > 0 && (
                  <span className={tab === t.key
                    ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold'
                    : 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold'}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <BookingCardSkeleton key={i} />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={<Calendar className="w-12 h-12 text-gray-300" />}
                  title={emptyMessages[tab].title}
                  message={emptyMessages[tab].message}
                  action={tab === 'upcoming'
                    ? <a href="/hospitals" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">Book Now</a>
                    : null}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    mounted={mounted}
                    onClick={() => router.push(`/user/bookings/${b.id}`)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  )
}