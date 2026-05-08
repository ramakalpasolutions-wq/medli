'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ToastProvider } from '@/context/ToastContext'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'
import HospitalAdminSidebar from '@/components/admin/HospitalAdminSidebar'

const ALLOWED_ROLES = ['hospital_admin', 'super_admin']

const KF = `@keyframes ha-spin { to{transform:rotate(360deg)} }`

function HospitalAdminGuard({ children }) {
  const { user, loading } = useAuth()
  const router            = useRouter()
  const [ready, setReady] = useState(false)
  const timerRef          = useRef(null)

  useEffect(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
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
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [user, loading, router])

  if (loading || !ready) {
    return (
      <>
        <style>{KF}</style>
        <div style={{
          height: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#0f0f1a,#1e1b4b)',
          flexDirection: 'column', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.3)',
            borderTopColor: '#6366f1',
            animation: 'ha-spin .8s linear infinite',
          }} />
          <div style={{
            fontSize: 14, fontWeight: 600,
            backgroundImage: 'linear-gradient(135deg,#818cf8,#a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Loading...
          </div>
        </div>
      </>
    )
  }

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: '#f8fafc', overflow: 'hidden',
    }}>
      <HospitalAdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,3vw,28px)' }}>
        {children}
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