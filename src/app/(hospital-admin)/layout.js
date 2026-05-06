// src/app/(hospital-admin)/layout.js
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ToastProvider } from '@/context/ToastContext'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'
import HospitalAdminSidebar from '@/components/admin/HospitalAdminSidebar'

const ALLOWED_ROLES = ['hospital_admin', 'super_admin']

function HospitalAdminGuard({ children }) {
  const { user, loading } = useAuth()
  const router            = useRouter()
  const [ready, setReady] = useState(false)
  const timerRef          = useRef(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (loading) return

    if (!user) {
      timerRef.current = setTimeout(() => {
        router.replace('/auth/login?redirect=/hospital-admin/dashboard')
      }, 150)
      return
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      router.replace(getDashboardForRole(user.role))
      return
    }

    setReady(true)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [user, loading, router])

  if (loading || !ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <HospitalAdminSidebar />
      <main className="flex-1 overflow-auto lg:ml-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

export default function HospitalAdminLayout({ children }) {
  return (
    <ToastProvider>
      <HospitalAdminGuard>{children}</HospitalAdminGuard>
    </ToastProvider>
  )
}