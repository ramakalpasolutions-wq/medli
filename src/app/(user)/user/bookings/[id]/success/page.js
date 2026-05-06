// src/app/(user)/user/bookings/[id]/success/page.js
'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  CheckCircle, Calendar, Clock,
  Download, Home, FileText,
} from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

export default function BookingSuccessPage({ params }) {
  const { id }  = use(params)
  const router  = useRouter()
  const mounted = useMounted()

  const { data: booking } = useSWR(
    `/api/bookings/${id}`,
    fetcher,
    { refreshInterval: 0 }
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      >
        {/* Success icon with animation */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay:      0.2,
              type:       'spring',
              stiffness:  200,
              damping:    15,
            }}
            className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Confirmed! 🎉
            </h1>
            <p className="text-gray-500 text-sm">
              Your payment was successful and booking is confirmed.
            </p>
          </motion.div>
        </div>

        {/* Booking details */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6"
          >
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Booking ID</span>
                <span className="text-xs font-mono font-bold text-gray-800">
                  {booking.bookingId}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Type</span>
                <span className="text-xs font-medium text-gray-800 capitalize">
                  {booking.type === 'lab'
                    ? 'Lab Test'
                    : booking.type === 'online'
                      ? 'Online Consultation'
                      : 'Hospital Visit'}
                </span>
              </div>

              {booking.startTime && mounted && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date
                    </span>
                    <span className="text-xs font-medium text-gray-800">
                      {new Date(booking.startTime).toLocaleDateString('en-IN', {
                        dateStyle: 'medium',
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Time
                    </span>
                    <span className="text-xs font-medium text-gray-800">
                      {new Date(booking.startTime).toLocaleTimeString('en-IN', {
                        hour:   '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                <span className="text-xs font-semibold text-gray-700">Amount Paid</span>
                <span className="text-sm font-bold text-emerald-700">
                  Rs. {Number(booking.totalAmount || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Skeleton while loading */}
        {!booking && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={() => router.push(`/user/bookings/${id}`)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Booking Details
          </button>

          <button
            onClick={() => router.push('/user/bookings')}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            My Bookings
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2 text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </motion.div>

        {/* Invoice note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-gray-400 mt-4"
        >
          Invoice will be sent to your registered email.
          You can also download it from booking details.
        </motion.p>
      </motion.div>
    </div>
  )
}