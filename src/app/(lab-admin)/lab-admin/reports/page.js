'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { SkeletonStats } from '@/components/ui/Skeleton'
import RevenueChart from '@/components/admin/RevenueChart'

const fetcher = async (url) => {
  const res = await fetch(url, { credentials: 'include' })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch')
  return json?.data ?? json
}

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'last3Months', label: '3 Months' },
]

function PresetPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 14px',
        borderRadius: 999,
        border: active ? '1px solid #059669' : '1px solid #e2e8f0',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        flexShrink: 0,
        background: active ? 'linear-gradient(135deg,#10b981,#059669)' : '#fff',
        color: active ? '#fff' : '#475569',
        boxShadow: active ? '0 8px 20px rgba(16,185,129,0.18)' : 'none',
      }}
    >
      {label}
    </button>
  )
}

function SCard({ title, action, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
      {(title || action) && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {title && <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>}
          {action}
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

function EmptyState({ text = 'No data available' }) {
  return <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', fontSize: 14 }}>{text}</div>
}

export default function LabReportsPage() {
  const [preset, setPreset] = useState('last30')

  const {
    data: revenueData,
    isLoading: rLoad,
    error: rError,
    mutate: mutateRevenue,
  } = useSWR(`/api/analytics/revenue?preset=${preset}`, fetcher)

  const {
    data: bookingData,
    isLoading: bLoad,
    error: bError,
    mutate: mutateBookings,
  } = useSWR(`/api/analytics/bookings?preset=${preset}`, fetcher)

  const { data: labData, error: labError } = useSWR('/api/labs?adminOnly=true', fetcher)
  const labId = labData?.labs?.[0]?.id || labData?.[0]?.id || null
  const { data: testsData, error: testsError } = useSWR(labId ? `/api/labs/${labId}/tests` : null, fetcher)

  const isLoading = rLoad || bLoad
  const error = rError || bError || labError || testsError

  const revenueSummary = revenueData?.summary || {}
  const bookingSummary = bookingData?.summary || {}

  const totalRevenue = Number(revenueSummary.totalRevenue || 0)
  const totalBookings = Number(revenueSummary.totalBookings || bookingSummary.totalBookings || 0)
  const avgOrderValue = totalBookings ? Math.round(totalRevenue / totalBookings) : 0

  const byStatus = bookingData?.byStatus || []
  const byLabStatus = bookingData?.byLabStatus || []
  const tests = testsData?.tests || testsData || []

  const confirmedCount = byStatus.find((s) => s.status === 'confirmed')?.count || 0
  const completedCount = byStatus.find((s) => s.status === 'completed')?.count || 0
  const cancelledCount = byStatus.find((s) => s.status === 'cancelled')?.count || 0

  const revenueChartData = useMemo(
    () => (revenueData?.chartData || []).map((item) => ({ date: item.date, revenue: Number(item.revenue || 0) })),
    [revenueData]
  )

  const bookingChartData = useMemo(
    () => (bookingData?.chartData || []).map((item) => ({ date: item.date, bookings: Number(item.bookings || 0) })),
    [bookingData]
  )

  const refreshAll = async () => {
    await Promise.all([mutateRevenue(), mutateBookings()])
  }

  return (
    <>
      <AdminHeader
        title="Reports"
        subtitle="Lab revenue, bookings, status tracking, and test catalogue"
        breadcrumbs={[{ label: 'Lab Admin' }, { label: 'Reports' }]}
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24, overflowX: 'auto', paddingBottom: 4, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <PresetPill key={p.key} label={p.label} active={preset === p.key} onClick={() => setPreset(p.key)} />
          ))}
        </div>

        <button onClick={refreshAll} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 14, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14 }}>
          Failed to load report data.
        </div>
      )}

      {isLoading ? (
        <SkeletonStats count={4} style={{ marginBottom: 24 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
          <StatsCard title="Gross Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon="💰" color="green" />
          <StatsCard title="Total Bookings" value={totalBookings} icon="📅" color="blue" />
          <StatsCard title="Completed" value={completedCount} icon="✅" color="purple" />
          <StatsCard title="Avg Booking Value" value={`₹${avgOrderValue.toLocaleString('en-IN')}`} icon="📈" color="yellow" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(280px,1fr)', gap: 16, marginBottom: 20 }}>
        <div style={{ minWidth: 0 }}>
          <RevenueChart
            data={revenueChartData}
            title="Revenue Over Time"
            mode="line"
            xAxisKey="date"
            dataKeys={[{ key: 'revenue', color: '#10b981', name: 'Revenue' }]}
            height={280}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <SCard title="Booking Summary">
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Confirmed</span>
                <strong style={{ color: '#0f172a' }}>{confirmedCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Completed</span>
                <strong style={{ color: '#0f172a' }}>{completedCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Cancelled</span>
                <strong style={{ color: '#0f172a' }}>{cancelledCount}</strong>
              </div>
            </div>
          </SCard>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <RevenueChart
          data={bookingChartData}
          title="Bookings Per Day"
          mode="bar"
          xAxisKey="date"
          dataKeys={[{ key: 'bookings', color: '#34d399', name: 'Bookings' }]}
          height={260}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 20 }}>
        <SCard title="Booking by Status">
          {!byStatus.length ? (
            <EmptyState text="No booking status data" />
          ) : (
            byStatus.map((item) => (
              <div key={item.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                <Badge variant={getStatusVariant(item.status)} size="sm">{item.status?.replace(/_/g, ' ')}</Badge>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.count}</span>
              </div>
            ))
          )}
        </SCard>

        <SCard title="Lab Workflow Status">
          {!byLabStatus.length ? (
            <EmptyState text="No lab workflow data" />
          ) : (
            byLabStatus.map((item) => (
              <div key={item.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 13, color: '#64748b', textTransform: 'capitalize' }}>{item.status.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.count}</span>
              </div>
            ))
          )}
        </SCard>
      </div>

      <SCard title="Test Catalogue" action={<span style={{ fontSize: 12, color: '#94a3b8' }}>{tests.length} tests</span>}>
        {!tests.length ? (
          <EmptyState text="No tests found for this lab" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tests.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid #f8fafc', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>{t.name}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {t.category && <span style={{ fontSize: 12, color: '#64748b' }}>{t.category}</span>}
                    {t.sampleType && <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.sampleType}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {t.discountedPrice ? (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>₹{Number(t.discountedPrice).toLocaleString('en-IN')}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through', margin: 0 }}>₹{Number(t.price).toLocaleString('en-IN')}</p>
                    </div>
                  ) : (
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>₹{Number(t.price || 0).toLocaleString('en-IN')}</p>
                  )}
                  <Badge variant={t.isActive ? 'success' : 'danger'} size="sm">{t.isActive ? 'Active' : 'Off'}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </SCard>
    </>
  )
}