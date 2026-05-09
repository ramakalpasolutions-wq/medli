'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard   from '@/components/ui/StatsCard'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { useAuth }  from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

// ✅ Returns j.data = { bookings: [], pagination: {} } or { labs: [], ... }
const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `
  @keyframes ld-in      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ld-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`
const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%', animation: 'ld-shimmer 1.5s linear infinite',
}

/* ─── Skeleton ───────────────────────────────────────────────────────── */
function Skeleton({ h = 80 }) {
  return <div style={{ height: h, borderRadius: 14, ...SHIMMER }} />
}

/* ─── Upload Button ──────────────────────────────────────────────────── */
function UploadBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '8px 14px', borderRadius: 10, border: 'none',
        background: h
          ? 'linear-gradient(135deg,#059669,#047857)'
          : 'linear-gradient(135deg,#10b981,#059669)',
        color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        boxShadow: '0 3px 10px rgba(16,185,129,0.35)', transition: 'all .15s ease', flexShrink: 0,
      }}
    >
      ⬆️ Upload
    </button>
  )
}

/* ─── Pending report row ─────────────────────────────────────────────── */
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
        gap: 10,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 3px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {b.bookingId}
        </p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
          {mounted && b.startTime
            ? new Date(b.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })
            : '—'}
          {b.collectionType === 'home' && (
            <span style={{ marginLeft: 6, color: '#10b981', fontWeight: 600 }}>🏠 Home</span>
          )}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <Badge variant={getStatusVariant(b.status)} size="sm">{b.status?.replace(/_/g, ' ')}</Badge>
          <Badge variant="warning" size="sm">{b.labStatus || 'pending'}</Badge>
        </div>
      </div>
      <UploadBtn onClick={onClick} />
    </div>
  )
}

/* ─── Today's schedule row ───────────────────────────────────────────── */
function TodayRow({ b, mounted }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 12,
      background: '#f8fafc', border: '1px solid #f1f5f9', gap: 10,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 2px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {b.bookingId}
        </p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
          {mounted && b.startTime
            ? new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : '—'}
          {b.userName && (
            <span style={{ color: '#475569', marginLeft: 6 }}>· {b.userName}</span>
          )}
          {b.collectionType === 'home' && (
            <span style={{ marginLeft: 6, color: '#10b981', fontWeight: 600 }}>🏠</span>
          )}
        </p>
      </div>
      <Badge variant={getStatusVariant(b.labStatus || 'pending')} size="sm">
        {b.labStatus?.replace(/_/g, ' ') || 'pending'}
      </Badge>
    </div>
  )
}

/* ─── Section Card ───────────────────────────────────────────────────── */
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

/* ─── Quick Stat ─────────────────────────────────────────────────────── */
function QuickStat({ icon, label, value, color, onClick }) {
  const [h, setH] = useState(false)
  const COLORS = {
    blue:   { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1e40af' },
    green:  { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#15803d' },
    orange: { bg: '#fff7ed', border: '#fed7aa', icon: '#ea580c', text: '#c2410c' },
    purple: { bg: '#f5f3ff', border: '#ddd6fe', icon: '#7c3aed', text: '#6d28d9' },
  }
  const c = COLORS[color] || COLORS.blue
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: h ? c.bg : c.bg, borderRadius: 16, padding: '16px 18px',
        border: `1px solid ${c.border}`, animation: 'ld-in .3s ease',
        cursor: onClick ? 'pointer' : 'default',
        transform: h ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform .15s ease',
        boxShadow: h ? `0 4px 12px ${c.border}` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: c.text }}>{label}</span>
      </div>
      <p style={{ fontSize: 26, fontWeight: 900, color: c.icon, margin: 0, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )
}

/* ─── View All Link ──────────────────────────────────────────────────── */
function ViewAllLink({ onClick, color = '#10b981' }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 600,
        color: h ? '#059669' : color, transition: 'color .15s ease',
      }}
    >
      View all →
    </button>
  )
}

/* ─── Refresh Button ─────────────────────────────────────────────────── */
function RefreshBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 36, height: 36, borderRadius: 10, border: 'none',
        background: h ? '#e2e8f0' : '#f1f5f9', cursor: 'pointer', fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s ease',
      }}
    >
      🔄
    </button>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────────── */
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

  // ── Fetch lab info ──────────────────────────────────────────────────
  const { data: labData } = useSWR('/api/labs?adminOnly=true', fetcher)
  // ✅ labData = { labs: [], pagination: {} }
  const lab   = labData?.labs?.[0]
  const labId = lab?.id

  // ── Fetch today's bookings ──────────────────────────────────────────
  const { data: todayData, isLoading: todayLoading, mutate } = useSWR(
    mounted && todayStr
      ? `/api/bookings?limit=50&type=lab&dateFrom=${todayStr}&dateTo=${todayStr}`
      : null,
    fetcher
  )

  // ── Fetch all recent lab bookings (for pending reports) ─────────────
  const { data: allData, isLoading: allLoading } = useSWR(
    '/api/bookings?limit=100&type=lab&status=confirmed',
    fetcher
  )

  // ✅ Correctly read from paginatedResponse shape
  const todayBookings  = todayData?.bookings  || []
  const allBookings    = allData?.bookings    || []

  // Pending = confirmed but report not ready
  const pendingReports   = allBookings.filter((b) =>
    b.status === 'confirmed' && b.labStatus !== 'report_ready'
  )
  const homeCollections  = todayBookings.filter((b) => b.collectionType === 'home')
  const reportsReady     = todayBookings.filter((b) => b.labStatus === 'report_ready')

  // ── Settlement pending ──────────────────────────────────────────────
  const { data: pendingSettlement } = useSWR('/api/settlements/pending', fetcher)
  const mySettlement  = labId ? (pendingSettlement?.labs || []).find((l) => l.id === labId) : null
  const pendingAmount = mySettlement?.netSettlementAmount || 0

  const greeting = mounted && now
    ? now.getHours() < 12 ? 'Good morning'
      : now.getHours() < 17 ? 'Good afternoon'
      : 'Good evening'
    : 'Hello'

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title={mounted ? `${greeting}, ${user?.name?.split(' ')[0] || 'Admin'} 👋` : 'Lab Dashboard'}
        subtitle={lab ? `Managing ${lab.name}` : 'Lab management overview'}
        breadcrumbs={[{ label: 'Lab Admin' }, { label: 'Dashboard' }]}
        actions={<RefreshBtn onClick={() => mutate()} />}
      />

      {/* ── Stats Grid ── */}
      {todayLoading || allLoading ? (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} h={90} />)}
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          <QuickStat
            icon="🧪" label="Today's Bookings"
            value={todayBookings.length} color="blue"
            onClick={() => router.push('/lab-admin/bookings')}
          />
          <QuickStat
            icon="⏳" label="Pending Reports"
            value={pendingReports.length} color="orange"
            onClick={() => router.push('/lab-admin/bookings')}
          />
          <QuickStat
            icon="🏠" label="Home Collections"
            value={homeCollections.length} color="green"
          />
          <QuickStat
            icon="💰" label="Pending Settlement"
            value={`₹${Number(pendingAmount).toLocaleString('en-IN')}`}
            color="purple"
            onClick={() => router.push('/lab-admin/settlements')}
          />
        </div>
      )}

      {/* ── Lab Info Card ── */}
      {lab && (
        <div style={{ marginBottom: 20 }}>
          <SCard>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 13, overflow: 'hidden', flexShrink: 0,
                background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>
                {lab.images?.logo
                  ? <img src={lab.images.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🧪'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lab.name}
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>
                  {lab.address?.city || '—'}
                  {lab.address?.state ? `, ${lab.address.state}` : ''}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge variant={lab.isApproved ? 'success' : 'warning'} size="sm" dot>
                    {lab.isApproved ? 'Approved' : 'Pending Approval'}
                  </Badge>
                  <Badge variant={lab.isActive ? 'success' : 'neutral'} size="sm">
                    {lab.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {lab.homeCollection?.enabled && (
                    <Badge variant="info" size="sm">🏠 Home Collection</Badge>
                  )}
                </div>
              </div>
              {lab.rating?.average > 0 && (
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#92400e', margin: 0 }}>
                    ⭐ {lab.rating.average.toFixed(1)}
                  </p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                    {lab.rating.count} reviews
                  </p>
                </div>
              )}
            </div>

            {/* Certifications */}
            {lab.certifications?.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {lab.certifications.map((c) => (
                    <span key={c} style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100,
                      background: 'rgba(16,185,129,0.08)', color: '#059669',
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </SCard>
        </div>
      )}

      {/* ── Pending Reports ── */}
      <div style={{ marginBottom: 20 }}>
        <SCard
          title={`Pending Reports ${pendingReports.length > 0 ? `(${pendingReports.length})` : ''}`}
          action={<ViewAllLink onClick={() => router.push('/lab-admin/bookings')} />}
        >
          {allLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} h={80} />)}
            </div>
          ) : !pendingReports.length ? (
            <div style={{ textAlign: 'center', padding: '28px 16px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#10b981', margin: 0 }}>
                All reports uploaded!
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                No pending reports at this time
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingReports.slice(0, 5).map((b, i) => (
                <PendingRow
                  key={b.id} b={b} mounted={mounted} idx={i}
                  onClick={() => router.push('/lab-admin/bookings')}
                />
              ))}
              {pendingReports.length > 5 && (
                <button
                  onClick={() => router.push('/lab-admin/bookings')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: '#10b981', fontWeight: 600,
                    padding: '6px 0', textDecoration: 'underline',
                  }}
                >
                  +{pendingReports.length - 5} more pending reports →
                </button>
              )}
            </div>
          )}
        </SCard>
      </div>

      {/* ── Today's Schedule ── */}
      <div style={{ marginBottom: 20 }}>
        <SCard
          title="Today's Schedule"
          action={<ViewAllLink onClick={() => router.push('/lab-admin/bookings')} />}
        >
          {todayLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} h={60} />)}
            </div>
          ) : !todayBookings.length ? (
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No bookings today</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayBookings.map((b) => (
                <TodayRow key={b.id} b={b} mounted={mounted} />
              ))}
            </div>
          )}
        </SCard>
      </div>

      {/* ── Quick Actions ── */}
      <SCard title="Quick Actions">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
        }}>
          {[
            { label: '📅 All Bookings',      href: '/lab-admin/bookings'    },
            { label: '🧪 Manage Tests',       href: '/lab-admin/tests'       },
            { label: '💰 Settlements',        href: '/lab-admin/settlements' },
            { label: '📋 Reports & Analytics',href: '/lab-admin/reports'     },
            { label: '⚙️ Lab Settings',       href: '/lab-admin/settings'    },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                padding: '12px 14px', borderRadius: 12, border: '1px solid #f1f5f9',
                background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', textAlign: 'left', transition: 'all .13s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0fdf4'
                e.currentTarget.style.borderColor = '#bbf7d0'
                e.currentTarget.style.color = '#15803d'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc'
                e.currentTarget.style.borderColor = '#f1f5f9'
                e.currentTarget.style.color = '#374151'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </SCard>
    </>
  )
}