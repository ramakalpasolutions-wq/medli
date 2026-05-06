// src/app/payment/error/page.js
'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function PaymentErrorPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      >
        {/* Error icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <AlertCircle className="w-10 h-10 text-red-500" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Error
        </h1>

        <p className="text-gray-500 text-sm mb-2">
          Something went wrong while processing your payment.
        </p>

        <p className="text-gray-400 text-xs mb-8">
          Your booking has not been confirmed. No money has been deducted.
          If money was deducted, it will be refunded within 5-7 business days.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>

          <button
            onClick={() => router.push('/user/bookings')}
            className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors py-2"
          >
            View My Bookings
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Need help?{' '}
            <a
              href="mailto:support@medli.in"
              className="text-blue-600 hover:underline font-medium"
            >
              support@medli.in
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}