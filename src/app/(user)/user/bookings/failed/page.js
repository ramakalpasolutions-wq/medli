'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle } from 'lucide-react'

function FailedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="w-12 h-12 text-red-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-500 text-sm mb-2">Your payment could not be processed.</p>
          {orderId && <p className="text-xs text-gray-400 font-mono mb-6">Order: {orderId}</p>}
          <p className="text-xs text-gray-400 mb-8">No amount has been deducted. Please try again.</p>

          <div className="flex gap-3">
            <button onClick={() => router.back()}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Try Again
            </button>
            <button onClick={() => router.push('/')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-800 text-white hover:bg-gray-900 transition-colors">
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function FailedPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}><FailedContent /></Suspense>
}