'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ToastProvider } from '@/context/ToastContext'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'
import RegionalSidebar from '@/components/admin/RegionalSidebar'

const ALLOWED_ROLES = ['regional_manager', 'super_admin']
const KF = `@keyframes rg-spin{to{transform:rotate(360deg)}}`

function RegionalGuard({ children }) {
  const { user, loading } = useAuth()
  const router            = useRouter()
  const [ready, setReady] = useState(false)
  const timerRef          = useRef(null)

  useEffect(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
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
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [user, loading, router])

  if (loading || !ready) {
    return (
      <>
        <style>{KF}</style>
        <div style={{
          height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#0f172a,#431407)',
          flexDirection: 'column', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid rgba(249,115,22,0.3)',
            borderTopColor: '#f97316',
            animation: 'rg-spin .8s linear infinite',
          }} />
          <div style={{
            fontSize: 14, fontWeight: 600,
            backgroundImage: 'linear-gradient(135deg,#fdba74,#fb923c)',
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
          .rg-layout-container { flex-direction: column !important; }
        }
      `}</style>

      <div
        className="rg-layout-container"
        style={{
          display: 'flex',
          height: '100vh',
          background: '#f8fafc',
          overflow: 'hidden',
        }}
      >
        <RegionalSidebar />
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

export default function RegionalLayout({ children }) {
  return (
    <ToastProvider>
      <RegionalGuard>{children}</RegionalGuard>
    </ToastProvider>
  )
}