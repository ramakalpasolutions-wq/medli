// src/app/(user)/user/bookings/[id]/pending/page.js
'use client'

import { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Clock, RefreshCw, Home } from 'lucide-react'

export default function BookingPendingPage({ params }) {
  const { id }     = use(params)
  const router     = useRouter()
  const [attempts, setAttempts] = useState(0)
  const [checking, setChecking] = useState(false)

  // Auto-check payment status every 5 seconds (max 12 attempts = 1 minute)
  useEffect(() => {
    if (attempts >= 12) return

    const timer = setTimeout(async () => {
      setChecking(true)
      try {
        // Step 1: get booking to know txnId + local status
        const bookingRes  = await fetch(`/api/bookings/${id}`, {
          credentials: 'include',
        })
        const bookingJson = await bookingRes.json()

        if (!bookingJson.success || !bookingJson.data) {
          setAttempts((a) => a + 1)
          return
        }

        const booking = bookingJson.data

        // If already resolved locally, redirect
        if (booking.status === 'confirmed' || booking.paymentStatus === 'paid') {
          router.replace(`/user/bookings/${id}/success`)
          return
        }
        if (booking.paymentStatus === 'failed') {
          router.replace(`/user/bookings/${id}/failed`)
          return
        }

        // Step 2: if we have a txnId, force verify with 1Pay
        if (booking.onePayTxnId) {
          await fetch(`/api/payments/verify/${booking.onePayTxnId}`, {
            credentials: 'include',
          })

          // Step 3: re-fetch booking and decide
          const refreshedRes  = await fetch(`/api/bookings/${id}`, {
            credentials: 'include',
          })
          const refreshedJson = await refreshedRes.json()
          if (refreshedJson.success && refreshedJson.data) {
            const refreshed = refreshedJson.data
            if (refreshed.status === 'confirmed' || refreshed.paymentStatus === 'paid') {
              router.replace(`/user/bookings/${id}/success`)
              return
            }
            if (refreshed.paymentStatus === 'failed') {
              router.replace(`/user/bookings/${id}/failed`)
              return
            }
          }
        }

        setAttempts((a) => a + 1)
      } catch {
        setAttempts((a) => a + 1)
      } finally {
        setChecking(false)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [attempts, id, router])

  const handleManualCheck = async () => {
    setChecking(true)
    try {
      const bookingRes  = await fetch(`/api/bookings/${id}`, {
        credentials: 'include',
      })
      const bookingJson = await bookingRes.json()

      if (!bookingJson.success || !bookingJson.data) {
        alert('Could not fetch booking. Please try again.')
        return
      }

      const booking = bookingJson.data

      if (booking.status === 'confirmed' || booking.paymentStatus === 'paid') {
        router.replace(`/user/bookings/${id}/success`)
        return
      }
      if (booking.paymentStatus === 'failed') {
        router.replace(`/user/bookings/${id}/failed`)
        return
      }

      if (booking.onePayTxnId) {
        await fetch(`/api/payments/verify/${booking.onePayTxnId}`, {
          credentials: 'include',
        })

        const refreshedRes  = await fetch(`/api/bookings/${id}`, {
          credentials: 'include',
        })
        const refreshedJson = await refreshedRes.json()
        if (refreshedJson.success && refreshedJson.data) {
          const refreshed = refreshedJson.data
          if (refreshed.status === 'confirmed' || refreshed.paymentStatus === 'paid') {
            router.replace(`/user/bookings/${id}/success`)
            return
          }
          if (refreshed.paymentStatus === 'failed') {
            router.replace(`/user/bookings/${id}/failed`)
            return
          }
        }
      }

      alert('Payment is still being processed. Please wait.')
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      >
        {/* Animated clock icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Clock className="w-10 h-10 text-amber-500" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Pending
        </h1>

        <p className="text-gray-500 text-sm mb-2">
          Your payment is being processed by 1Pay.
        </p>

        <p className="text-gray-400 text-xs mb-6">
          This may take a few minutes.
          Please do not close or refresh this page.
        </p>

        {/* Auto-check status */}
        {attempts < 12 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 text-blue-500 ${checking ? 'animate-spin' : ''}`} />
            <p className="text-sm text-blue-600">
              {checking
                ? 'Checking payment status...'
                : `Auto-checking in a moment... (${attempts}/12)`}
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <p className="text-sm text-amber-700">
              Payment is taking longer than expected.
              Please check your bookings in a few minutes.
            </p>
          </div>
        )}

        {/* Booking ID */}
        <div className="bg-gray-50 rounded-xl p-3 mb-6">
          <p className="text-xs text-gray-400">Booking Reference</p>
          <p className="text-sm font-mono font-bold text-gray-700">{id}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            Check Payment Status
          </button>

          <button
            onClick={() => router.push('/user/bookings')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition-colors"
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
        </div>

        {/* Support note */}
        <p className="text-xs text-gray-400 mt-6">
          If money was deducted but booking not confirmed,
          contact{' '}
          <a
            href="mailto:support@medli.in"
            className="text-blue-600 hover:underline"
          >
            support@medli.in
          </a>
        </p>
      </motion.div>
    </div>
  )
}