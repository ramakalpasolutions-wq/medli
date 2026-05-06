// src/app/(regional)/layout.js
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ToastProvider } from '@/context/ToastContext'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'
import RegionalSidebar from '@/components/admin/RegionalSidebar'

const ALLOWED_ROLES = ['regional_manager', 'super_admin']

function RegionalGuard({ children }) {
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
        router.replace('/auth/login?redirect=/regional/dashboard')
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
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <RegionalSidebar />
      <main className="flex-1 overflow-auto lg:ml-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

export default function RegionalLayout({ children }) {
  return (
    <ToastProvider>
      <RegionalGuard>{children}</RegionalGuard>
    </ToastProvider>
  )
}