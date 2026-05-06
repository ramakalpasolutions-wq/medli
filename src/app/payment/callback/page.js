'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const bookingId = searchParams.get('bookingId')
    const orderId   = searchParams.get('orderId')
    const success   = searchParams.get('success')

    const timer = setTimeout(() => {
      if (success === 'true' && bookingId) {
        router.replace(`/user/bookings/${bookingId}/success`)
      } else if (orderId) {
        router.replace(`/user/bookings/failed?orderId=${orderId}`)
      } else {
        router.replace('/user/bookings')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800">Processing your payment</p>
        <p className="text-sm text-gray-400 mt-1">Please wait, do not press back...</p>
      </div>
      <div className="text-4xl">🏥</div>
      <p className="text-blue-600 font-bold text-lg">MEDLI</p>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}><CallbackContent /></Suspense>
}