'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import StatsCard from '@/components/ui/StatsCard'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import AdminHeader from '@/components/admin/AdminHeader'
import { SkeletonStats, SkeletonCard } from '@/components/ui/Skeleton'
import {
  Users,
  Building2,
  FlaskConical,
  Stethoscope,
  CalendarDays,
  IndianRupee,
  TriangleAlert,
  Clock3,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes sd-in      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sd-bar     { from{width:0} to{width:var(--w)} }
  @keyframes sd-spin    { to{transform:rotate(360deg)} }
  @keyframes sd-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`

const STATUS_CONFIG = {
  confirmed:       { label: 'Confirmed',   color: '#3b82f6' },
  completed:       { label: 'Completed',   color: '#10b981' },
  pending_payment: { label: 'Pending Pay', color: '#f59e0b' },
  created:         { label: 'Created',     color: '#94a3b8' },
  cancelled:       { label: 'Cancelled',   color: '#ef4444' },
  refunded:        { label: 'Refunded',    color: '#8b5cf6' },
  no_show:         { label: 'No Show',     color: '#f97316' },
}

function StatusBreakdown({ data }) {
  const total = data.reduce((s, b) => s + b.count, 0) || 1

  if (!data.length) {
    return (
      <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>
        No booking data yet
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.sort((a, b) => b.count - a.count).map((item) => {
        const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: '#94a3b8' }
        const pct = Math.round((item.count / total) * 100)

        return (
          <div key={item.status}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#64748b' }}>{cfg.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{item.count}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', width: 32, textAlign: 'right' }}>{pct}%</span>
              </div>
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 3,
                  background: cfg.color,
                  width: `${pct}%`,
                  transition: 'width .8s ease',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RefreshBtn({ onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 10,
        border: `1.5px solid ${h ? '#6366f1' : '#e2e8f0'}`,
        background: h ? 'rgba(99,102,241,0.06)' : '#fff',
        color: h ? '#6366f1' : '#64748b',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all .15s ease',
      }}
    >
      <RotateCcw size={14} />
      Refresh
    </button>
  )
}

function AlertCard({ label, count, href, color }) {
  const [h, setH] = useState(false)

  const colorMap = {
    amber: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', text: '#92400e', hover: 'rgba(245,158,11,0.1)' },
    blue:  { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.2)', text: '#312e81', hover: 'rgba(99,102,241,0.1)' },
    red:   { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', text: '#991b1b', hover: 'rgba(239,68,68,0.1)' },
  }

  const c = colorMap[color] || colorMap.amber

  return (
    <a
      href={href}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderRadius: 14,
        border: `1.5px solid ${c.border}`,
        background: h ? c.hover : c.bg,
        textDecoration: 'none',
        transition: 'all .15s ease',
        cursor: 'pointer',
      }}
    >
      <div>
        <p style={{ fontSize: 11, color: c.text, margin: '0 0 3px', fontWeight: 500, opacity: 0.8 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: c.text, margin: 0, lineHeight: 1 }}>{count}</p>
      </div>
      <span style={{ fontSize: 16, opacity: 0.5 }}>›</span>
    </a>
  )
}

function QuickLink({ label, href }) {
  const [h, setH] = useState(false)

  return (
    <a
      href={href}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'block',
        padding: '9px 12px',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 500,
        color: h ? '#6366f1' : '#64748b',
        background: h ? 'rgba(99,102,241,0.07)' : '#f8fafc',
        border: `1.5px solid ${h ? 'rgba(99,102,241,0.2)' : '#f1f5f9'}`,
        textDecoration: 'none',
        transition: 'all .14s ease',
        textAlign: 'left',
      }}
    >
      {label}
    </a>
  )
}

function SummaryItem({ label, value, icon: Icon }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        background: '#f8fafc',
        borderRadius: 12,
        border: '1px solid #f1f5f9',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          flexShrink: 0,
          color: '#64748b',
        }}
      >
        {Icon ? <Icon size={16} /> : null}
      </div>
      <div>
        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: '1px 0 0' }}>{value}</p>
      </div>
    </div>
  )
}

function SCard({ title, action, children }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #f8fafc',
          }}
        >
          {title && <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>}
          {action}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function ViewAllLink({ href }) {
  const [h, setH] = useState(false)

  return (
    <a
      href={href}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: h ? '#4f46e5' : '#6366f1',
        textDecoration: 'none',
        transition: 'color .14s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
      }}
    >
      View all ›
    </a>
  )
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const mounted = useMounted()

  const { data, isLoading, mutate } = useSWR('/api/analytics/dashboard', fetcher, {
    refreshInterval: 60_000,
  })

  const bookingCols = [
    {
      key: 'userName',
      header: 'Patient',
      render: (v, row) => (
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', margin: 0 }}>{v || 'Unknown'}</p>
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', margin: '2px 0 0' }}>{row.bookingId}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (v) => <Badge variant={v === 'lab' ? 'success' : v === 'online' ? 'purple' : 'info'} size="sm">{v}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v?.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (v) => <span style={{ fontSize: 13, fontWeight: 600 }}>₹{Number(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (v) =>
        mounted ? (
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </span>
        ) : '—',
    },
  ]

  if (isLoading) {
    return (
      <>
        <style>{KF}</style>
        <AdminHeader title="Dashboard" subtitle="Platform overview" />
        <SkeletonStats count={4} style={{ marginBottom: 24 }} />
        <SkeletonStats count={3} style={{ marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </>
    )
  }

  const o = data?.overview || {}
  const t = data?.today || {}
  const a = data?.alerts || {}
  const rb = data?.recentBookings || []
  const bs = data?.bookingsByStatus || []

  const totalAlerts =
    (a.pendingHospitals || 0) +
    (a.pendingLabs || 0) +
    (a.pendingSettlements || 0) +
    (a.pendingRefunds || 0)

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Dashboard"
        subtitle="Real-time platform overview"
        breadcrumbs={[{ label: 'Super Admin' }, { label: 'Dashboard' }]}
        actions={<RefreshBtn onClick={() => mutate()} />}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: 14,
          marginBottom: 20,
          animation: 'sd-in .3s ease',
        }}
      >
        {[
          { title: 'Total Users', value: o.totalUsers || 0, icon: Users, color: 'blue', href: '/super-admin/users' },
          { title: 'Hospitals', value: o.totalHospitals || 0, icon: Building2, color: 'purple', href: '/super-admin/hospitals' },
          { title: 'Labs', value: o.totalLabs || 0, icon: FlaskConical, color: 'green', href: '/super-admin/labs' },
          { title: 'Doctors', value: o.totalDoctors || 0, icon: Stethoscope, color: 'orange', href: '/super-admin/doctors' },
        ].map((s) => (
          <div key={s.title} style={{ cursor: 'pointer' }} onClick={() => router.push(s.href)}>
            <StatsCard title={s.title} value={s.value} icon={s.icon} color={s.color} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
        <StatsCard title="Today's Bookings" value={t.bookings || 0} icon={CalendarDays} color="indigo" />
        <StatsCard title="Today's Revenue" value={t.revenue || 0} prefix="₹" icon={IndianRupee} color="green" />
        <StatsCard title="Pending Alerts" value={totalAlerts} icon={TriangleAlert} color="red" />
      </div>

      {totalAlerts > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Hospitals Pending', count: a.pendingHospitals || 0, href: '/super-admin/hospitals', color: 'amber' },
            { label: 'Labs Pending', count: a.pendingLabs || 0, href: '/super-admin/labs', color: 'amber' },
            { label: 'Settlements', count: a.pendingSettlements || 0, href: '/super-admin/settlements', color: 'blue' },
            { label: 'Refunds', count: a.pendingRefunds || 0, href: '/super-admin/refunds', color: 'red' },
          ].filter((x) => x.count > 0).map((item) => (
            <AlertCard key={item.label} {...item} />
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        <SCard title="Recent Bookings" action={<ViewAllLink href="/super-admin/bookings" />}>
          {!rb.length ? (
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>No bookings yet</p>
          ) : (
            <DataTable columns={bookingCols} data={rb} keyField="id" emptyTitle="No recent bookings" />
          )}
        </SCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SCard title="Booking Status Breakdown">
            <StatusBreakdown data={bs} />
          </SCard>

          <SCard title="Platform Summary">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <SummaryItem label="Total Bookings" value={o.totalBookings || 0} icon={CalendarDays} />
              <SummaryItem label="Confirmed" value={o.confirmedBookings || 0} icon={CheckCircle2} />
              <SummaryItem label="Pending Refunds" value={a.pendingRefunds || 0} icon={RotateCcw} />
              <SummaryItem label="Pending Settle" value={a.pendingSettlements || 0} icon={Clock3} />
            </div>
          </SCard>

          <SCard title="Quick Actions">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Users', href: '/super-admin/users' },
                { label: 'All Bookings', href: '/super-admin/bookings' },
                { label: 'Settlements', href: '/super-admin/settlements' },
                { label: 'Revenue', href: '/super-admin/revenue' },
                { label: 'Coupons', href: '/super-admin/coupons' },
                { label: 'Audit Logs', href: '/super-admin/audit-logs' },
              ].map((item) => <QuickLink key={item.href} {...item} />)}
            </div>
          </SCard>
        </div>
      </div>
    </>
  )
}