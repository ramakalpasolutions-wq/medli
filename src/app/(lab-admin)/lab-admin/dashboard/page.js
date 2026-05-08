'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes ld-in     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ld-shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`
const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%', animation: 'ld-shimmer 1.5s linear infinite',
}

/* ─── Booking row ────────────────────────────────────────────────────── */
function PendingRow({ b, mounted, idx, onClick }) {
  const [h, setH] = useState(false)
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 14, borderRadius: 14,
        background: h ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)',
        border: `1px solid ${h ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.15)'}`,
        transition: 'all .15s ease',
        animation: `ld-in .2s ease ${idx * 0.05}s both`,
      }}
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 3px', fontFamily: 'monospace' }}>{b.bookingId}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
          {mounted && b.startTime
            ? new Date(b.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })
            : '—'}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <Badge variant={getStatusVariant(b.status)} size="sm">{b.status?.replace(/_/g, ' ')}</Badge>
          <Badge variant="warning" size="sm">{b.labStatus || 'pending'}</Badge>
        </div>
      </div>
      <UploadBtn onClick={onClick} />
    </div>
  )
}

function UploadBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '8px 14px', borderRadius: 10, border: 'none',
        background: h ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#10b981,#059669)',
        color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        boxShadow: '0 3px 10px rgba(16,185,129,0.35)', transition: 'all .15s ease',
        flexShrink: 0,
      }}>
      ⬆️ Upload
    </button>
  )
}

function TodayRow({ b, mounted }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 12,
      background: '#f8fafc', border: '1px solid #f1f5f9',
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 2px', fontFamily: 'monospace' }}>{b.bookingId}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
          {mounted && b.startTime
            ? new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : '—'}
          {b.collectionType === 'home' && (
            <span style={{ marginLeft: 8, color: '#10b981', fontWeight: 600 }}>🏠 Home</span>
          )}
        </p>
      </div>
      <Badge variant={getStatusVariant(b.labStatus || 'pending')} size="sm">
        {b.labStatus?.replace(/_/g, ' ') || 'pending'}
      </Badge>
    </div>
  )
}

/* ─── Section card ───────────────────────────────────────────────────── */
function SCard({ title, action, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
          {title && <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>}
          {action}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function ViewAllLink({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: h ? '#059669' : '#10b981', transition: 'color .15s ease' }}>
      View all →
    </button>
  )
}

function RefreshBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: h ? '#e2e8f0' : '#f1f5f9', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s ease' }}>
      🔄
    </button>
  )
}

export default function LabAdminDashboard() {
  const { user } = useAuth()
  const toast    = useToast()
  const router   = useRouter()
  const mounted  = useMounted()

  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const todayStr = mounted ? new Date().toISOString().split('T')[0] : ''

  const { data: labData }  = useSWR('/api/labs?adminOnly=true', fetcher)
  const labId = labData?.labs?.[0]?.id

  const { data: todayData, mutate } = useSWR(
    mounted && todayStr
      ? `/api/bookings?limit=20&type=lab&dateFrom=${todayStr}&dateTo=${todayStr}`
      : null,
    fetcher
  )
  const { data: allData } = useSWR('/api/bookings?limit=50&type=lab', fetcher)

  const todayBookings   = todayData?.bookings || []
  const allBookings     = allData?.bookings   || []
  const pendingReports  = allBookings.filter((b) => b.labStatus !== 'report_ready' && b.status === 'confirmed')
  const homeCollections = todayBookings.filter((b) => b.collectionType === 'home')

  const { data: pendingSettlement } = useSWR('/api/settlements/pending', fetcher)
  const mySettlement  = (pendingSettlement?.labs || []).find((l) => l.id === labId)
  const pendingAmount = mySettlement?.netSettlementAmount || 0

  const greeting = mounted && now
    ? now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
    : 'Hello'

  const STATS = [
    { title:"Today's Bookings",    value:todayBookings.length,   icon:'🧪', color:'blue'   },
    { title:'Pending Reports',     value:pendingReports.length,  icon:'⏳', color:'orange' },
    { title:'Home Collections',    value:homeCollections.length, icon:'🏠', color:'green'  },
    { title:'Pending Settlement',  value:`₹${Number(pendingAmount).toLocaleString('en-IN')}`, icon:'💰', color:'purple' },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title={mounted ? `${greeting}, ${user?.name?.split(' ')[0] || 'Admin'}` : 'Lab Dashboard'}
        subtitle="Lab management overview"
        breadcrumbs={[{ label: 'Lab Admin' }, { label: 'Dashboard' }]}
        actions={<RefreshBtn onClick={() => mutate()} />}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        {STATS.map((s) => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Pending reports */}
      <div style={{ marginBottom: 20 }}>
        <SCard title="Pending Reports" action={<ViewAllLink onClick={() => router.push('/lab-admin/bookings')} />}>
          {!pendingReports.length ? (
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#10b981', margin: 0 }}>All reports uploaded</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0' }}>No pending reports</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingReports.slice(0, 5).map((b, i) => (
                <PendingRow key={b.id} b={b} mounted={mounted} idx={i} onClick={() => router.push('/lab-admin/bookings')} />
              ))}
              {pendingReports.length > 5 && (
                <button onClick={() => router.push('/lab-admin/bookings')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#10b981', fontWeight: 600, padding: '6px 0', textDecoration: 'underline' }}>
                  +{pendingReports.length - 5} more pending reports
                </button>
              )}
            </div>
          )}
        </SCard>
      </div>

      {/* Today's schedule */}
      {todayBookings.length > 0 && (
        <SCard title="Today's Schedule">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayBookings.map((b) => (
              <TodayRow key={b.id} b={b} mounted={mounted} />
            ))}
          </div>
        </SCard>
      )}
    </>
  )
}