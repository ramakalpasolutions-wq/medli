'use client'

import { use } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function BookingSuccessPage({ params }) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed! 🎉</h1>
          <p className="text-gray-500 text-sm mb-2">Your appointment has been successfully booked.</p>
          <p className="text-xs text-gray-400 mb-8">Confirmation details have been sent to your registered contact.</p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6">
            <p className="text-xs text-emerald-600 font-medium">Booking ID</p>
            <p className="text-sm font-bold text-emerald-800 font-mono">{id}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => router.push('/user/bookings')}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              View Booking
            </button>
            <button onClick={() => router.push('/')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}