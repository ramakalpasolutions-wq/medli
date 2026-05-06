// src/app/(user)/user/bookings/[id]/failed/page.js
'use client'

import { use, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { XCircle, RefreshCw, Home, Phone } from 'lucide-react'

export default function BookingFailedPage({ params }) {
  const { id }    = use(params)
  const router    = useRouter()
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    setRetrying(true)
    try {
      // Re-initiate payment for same booking
      const res  = await fetch('/api/payments/create-order', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ bookingId: id }),
      })
      const json = await res.json()

      if (!json.success) {
        alert(json.error || 'Failed to retry payment')
        setRetrying(false)
        return
      }

      const { merchantId, reqData, paymentUrl } = json.data

      // Submit form to 1Pay again
      const form       = document.createElement('form')
      form.method      = 'POST'
      form.action      = paymentUrl
      form.style.display = 'none'

      const addField = (name, value) => {
        const input = document.createElement('input')
        input.type  = 'hidden'
        input.name  = name
        input.value = String(value)
        form.appendChild(input)
      }

      addField('merchantId', merchantId)
      addField('reqData',    reqData)

      document.body.appendChild(form)
      form.submit()
    } catch {
      alert('Network error. Please try again.')
      setRetrying(false)
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
        {/* Failed icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="w-10 h-10 text-red-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-500 text-sm mb-2">
            Your payment could not be processed.
          </p>
          <p className="text-gray-400 text-xs mb-8">
            No money has been deducted from your account.
            You can try again or use a different payment method.
          </p>
        </motion.div>

        {/* Booking ID */}
        <div className="bg-gray-50 rounded-xl p-3 mb-6">
          <p className="text-xs text-gray-400">Booking Reference</p>
          <p className="text-sm font-mono font-bold text-gray-700">{id}</p>
        </div>

        {/* Common reasons */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-amber-700 mb-2">
            Common reasons for failure:
          </p>
          <ul className="space-y-1">
            {[
              'Incorrect card details',
              'Insufficient balance',
              'Bank declined the transaction',
              'Payment session timed out',
              'Network interruption',
            ].map((reason) => (
              <li key={reason} className="text-xs text-amber-600 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            {retrying ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Try Payment Again
              </>
            )}
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
        </motion.div>

        {/* Support */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Still having issues?</p>
          <a
            href="mailto:support@medli.in"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
          >
            <Phone className="w-3 h-3" />
            Contact Support
          </a>
        </div>
      </motion.div>
    </div>
  )
}