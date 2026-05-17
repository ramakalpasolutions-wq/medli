'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ToastProvider } from '@/context/ToastContext'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'
import LabAdminSidebar from '@/components/admin/LabAdminSidebar'

const ALLOWED_ROLES = ['lab_admin', 'super_admin']
const KF = `@keyframes la-spin{to{transform:rotate(360deg)}}`

function LabAdminGuard({ children }) {
  const { user, loading } = useAuth()
  const router            = useRouter()
  const [ready, setReady] = useState(false)
  const timerRef          = useRef(null)

  useEffect(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (loading) return
    if (!user) {
      timerRef.current = setTimeout(() => {
        router.replace('/auth/login?redirect=/lab-admin/dashboard')
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
          background: 'linear-gradient(135deg,#0f172a,#064e3b)',
          flexDirection: 'column', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid rgba(16,185,129,0.3)',
            borderTopColor: '#10b981',
            animation: 'la-spin .8s linear infinite',
          }} />
          <div style={{
            fontSize: 14, fontWeight: 600,
            backgroundImage: 'linear-gradient(135deg,#6ee7b7,#34d399)',
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
          .la-layout-container { flex-direction: column !important; }
        }
      `}</style>

      <div
        className="la-layout-container"
        style={{
          display: 'flex',
          height: '100vh',
          background: '#f8fafc',
          overflow: 'hidden',
        }}
      >
        <LabAdminSidebar />
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

export default function LabAdminLayout({ children }) {
  return (
    <ToastProvider>
      <LabAdminGuard>{children}</LabAdminGuard>
    </ToastProvider>
  )
}