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
        border: active ? '1px solid #4f46e5' : '1px solid #e2e8f0',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        flexShrink: 0,
        background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff',
        color: active ? '#fff' : '#475569',
      }}
    >
      {label}
    </button>
  )
}

function SCard({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

function EmptyState({ text = 'No data available' }) {
  return <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', fontSize: 14 }}>{text}</div>
}

export default function HospitalReportsPage() {
  const [preset, setPreset] = useState('last30')

  const { data: revenueData, isLoading: rLoad } = useSWR(`/api/analytics/revenue?preset=${preset}`, fetcher)
  const { data: bookingData, isLoading: bLoad } = useSWR(`/api/analytics/bookings?preset=${preset}`, fetcher)
  const { data: hospitalData } = useSWR('/api/hospitals?adminOnly=true', fetcher)
  const hospitalId = hospitalData?.hospitals?.[0]?.id
  const { data: doctorData } = useSWR(hospitalId ? `/api/hospitals/${hospitalId}/doctors` : null, fetcher)

  const isLoading = rLoad || bLoad
  const s = revenueData?.summary || {}
  const byStatus = bookingData?.byStatus || []
  const byType = bookingData?.byType || []
  const doctors = Array.isArray(doctorData) ? doctorData : (doctorData?.doctors || [])

  const revenueChartData = useMemo(
    () => (revenueData?.chartData || []).map((d) => ({ date: d.date, revenue: Number(d.revenue || 0) })),
    [revenueData]
  )

  const bookingChartData = useMemo(
    () => (bookingData?.chartData || []).map((d) => ({ date: d.date, bookings: Number(d.bookings || 0) })),
    [bookingData]
  )

  return (
    <>
      <AdminHeader
        title="Reports"
        subtitle="Hospital booking and revenue analytics"
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Reports' }]}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {PRESETS.map((p) => (
          <PresetPill key={p.key} label={p.label} active={preset === p.key} onClick={() => setPreset(p.key)} />
        ))}
      </div>

      {isLoading ? (
        <SkeletonStats count={3} style={{ marginBottom: 24 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
          <StatsCard title="Gross Revenue" value={`₹${Number(s.totalRevenue || 0).toLocaleString('en-IN')}`} icon="💰" color="green" />
          <StatsCard title="Total Bookings" value={s.totalBookings || 0} icon="📅" color="blue" />
          <StatsCard title="Completed" value={byStatus.find((st) => st.status === 'completed')?.count || 0} icon="✅" color="purple" />
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <RevenueChart
          data={revenueChartData}
          title="Revenue Over Time"
          mode="line"
          xAxisKey="date"
          dataKeys={[{ key: 'revenue', color: '#6366f1', name: 'Revenue' }]}
          height={260}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <RevenueChart
          data={bookingChartData}
          title="Bookings Per Day"
          mode="bar"
          xAxisKey="date"
          dataKeys={[{ key: 'bookings', color: '#818cf8', name: 'Bookings' }]}
          height={220}
        />
      </div>

      {!revenueChartData.length && !bookingChartData.length && !isLoading && (
        <div style={{ marginBottom: 20 }}>
          <SCard>
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>No data for selected period</p>
              <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>Try a different date range</p>
            </div>
          </SCard>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 20 }}>
        <SCard title="Booking by Status">
          {!byStatus.length ? (
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No data</p>
          ) : byStatus.map((item) => (
            <div key={item.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
              <Badge variant={getStatusVariant(item.status)} size="sm">{item.status?.replace(/_/g, ' ')}</Badge>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{item.count}</span>
            </div>
          ))}
        </SCard>

        <SCard title="Booking by Type">
          {!byType.length ? (
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No data</p>
          ) : byType.map((item) => (
            <div key={item.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
              <Badge variant="info" size="sm">{item.type}</Badge>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{item.count}</span>
            </div>
          ))}
        </SCard>
      </div>

      {doctors.length > 0 && (
        <SCard title="Doctors">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doctors.map((d) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>Dr. {d.name}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                    {(d.specialization || []).join(', ') || 'General'}{d.experience ? ` · ${d.experience} yrs` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge variant={d.isVerified ? 'success' : 'warning'} size="sm">{d.isVerified ? 'Verified' : 'Pending'}</Badge>
                  <Badge variant={d.isActive ? 'info' : 'danger'} size="sm">{d.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </SCard>
      )}
    </>
  )
}