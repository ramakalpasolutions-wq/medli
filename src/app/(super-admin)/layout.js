'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ToastProvider } from '@/context/ToastContext'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'
import SuperAdminSidebar from '@/components/admin/SuperAdminSidebar'

const ALLOWED_ROLES = ['super_admin']
const KF = `@keyframes sa-spin{to{transform:rotate(360deg)}}`

function SuperAdminGuard({ children }) {
  const { user, loading } = useAuth()
  const router            = useRouter()
  const [ready, setReady] = useState(false)
  const timerRef          = useRef(null)

  useEffect(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (loading) return
    if (!user) {
      timerRef.current = setTimeout(() => {
        router.replace('/auth/login?redirect=/super-admin/dashboard')
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
          height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#0a0a14,#12101e)',
          flexDirection: 'column', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.25)',
            borderTopColor: '#6366f1',
            animation: 'sa-spin .8s linear infinite',
          }} />
          <div style={{
            fontSize: 13, fontWeight: 600,
            backgroundImage: 'linear-gradient(135deg,#818cf8,#a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ✅ Responsive layout — column on mobile, row on desktop */}
      <style>{`
        @media(max-width:1023px){
          .sa-layout-container { flex-direction: column !important; }
        }
      `}</style>

      <div
        className="sa-layout-container"
        style={{
          display: 'flex',
          height: '100vh',
          background: '#f8fafc',
          overflow: 'hidden',
        }}
      >
        <SuperAdminSidebar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'clamp(16px,3vw,28px)',
        }}>
          {children}
        </main>
      </div>
    </>
  )
}

export default function SuperAdminLayout({ children }) {
  return (
    <ToastProvider>
      <SuperAdminGuard>{children}</SuperAdminGuard>
    </ToastProvider>
  )
}