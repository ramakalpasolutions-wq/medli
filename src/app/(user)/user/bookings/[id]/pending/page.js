// src/app/(user)/user/bookings/[id]/pending/page.js

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function BookingPendingPage({ params }) {
  const { accessToken } = useAuth()
  const [checking, setChecking]   = useState(false)
  const [attempts, setAttempts]   = useState(0)

  // Auto-check payment status every 5 seconds (max 6 times = 30 seconds)
  useEffect(() => {
    if (attempts >= 6) return

    const timer = setTimeout(async () => {
      setChecking(true)
      try {
        const res = await fetch(`/api/bookings/${params.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const data = await res.json()

        if (data.success) {
          const booking = data.data
          if (booking.status === 'confirmed') {
            window.location.href = `/user/bookings/${params.id}/success`
            return
          }
          if (booking.paymentStatus === 'failed') {
            window.location.href = `/user/bookings/${params.id}/failed`
            return
          }
        }
        setAttempts(a => a + 1)
      } catch {
        setAttempts(a => a + 1)
      } finally {
        setChecking(false)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [attempts, params.id, accessToken])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
      >
        {/* Animated icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration:  3,
            repeat:    Infinity,
            ease:      'linear'
          }}
          className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Clock className="h-8 w-8 text-amber-600" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Pending
        </h1>

        <p className="text-gray-500 mb-2">
          Your payment is being processed by 1Pay.
          This may take a few minutes.
        </p>

        <p className="text-sm text-gray-400 mb-6">
          Please do not close or refresh this page.
        </p>

        {/* Auto-check status indicator */}
        {attempts < 6 && (
          <div className="bg-blue-50 rounded-xl p-3 mb-6 flex items-center justify-center gap-2">
            <RefreshCw className={`h-4 w-4 text-blue-600 ${checking ? 'animate-spin' : ''}`} />
            <p className="text-sm text-blue-600">
              Checking payment status...
            </p>
          </div>
        )}

        {attempts >= 6 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <p className="text-sm text-amber-700">
              Payment is taking longer than expected. 
              Check your bookings in a few minutes.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-6">
          Booking ID: {params.id}
        </p>

        <div className="flex gap-3 justify-center">
          <a
            href="/user/bookings"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            My Bookings
          </a>
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </motion.div>
    </div>
  )
}