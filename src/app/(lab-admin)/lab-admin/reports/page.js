'use client'

import { useMemo, useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { SkeletonStats } from '@/components/ui/Skeleton'
import RevenueChart from '@/components/admin/RevenueChart'
import {
  RefreshCw,
  IndianRupee,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  ClipboardList,
  Activity,
  FlaskConical,
} from 'lucide-react'

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

function useBreakpoint() {
  const [bp, setBp] = useState('desktop')

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      setBp(w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop')
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return bp
}

function PresetPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 12px',
        borderRadius: 999,
        border: active ? '1px solid #059669' : '1px solid #e2e8f0',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        background: active
          ? 'linear-gradient(135deg,#10b981,#059669)'
          : '#fff',
        color: active ? '#fff' : '#475569',
        boxShadow: active ? '0 8px 20px rgba(16,185,129,0.18)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      {label}
    </button>
  )
}

function SCard({ title, action, children }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(15,23,42,0.04)',
        overflow: 'hidden',
      }}
    >
      {(title || action) && (
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {title && (
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function EmptyState({ text = 'No data available' }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '32px 16px',
        color: '#94a3b8',
        fontSize: 14,
      }}
    >
      {text}
    </div>
  )
}

const CSS = `
  .rp-preset-bar {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .rp-preset-bar::-webkit-scrollbar { display: none; }

  .rp-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .rp-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .rp-main-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .rp-status-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .rp-test-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid #f8fafc;
    flex-wrap: wrap;
  }

  .rp-test-price {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    .rp-stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    .rp-status-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .rp-test-row {
      flex-wrap: nowrap;
      align-items: center;
    }
  }

  @media (min-width: 1024px) {
    .rp-stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
    .rp-main-grid {
      grid-template-columns: minmax(0,2fr) minmax(260px,1fr);
    }
    .rp-status-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`

export default function LabReportsPage() {
  const [preset, setPreset] = useState('last30')
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

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

  const { data: labData } = useSWR('/api/labs?adminOnly=true', fetcher)
  const labId = labData?.labs?.[0]?.id || labData?.[0]?.id || null

  const { data: testsData } = useSWR(
    labId ? `/api/labs/${labId}/tests` : null,
    fetcher
  )

  const isLoading = rLoad || bLoad
  const error = rError || bError

  const revenueSummary = revenueData?.summary || {}
  const bookingSummary = bookingData?.summary || {}

  const totalRevenue = Number(revenueSummary.totalRevenue || 0)
  const totalBookings = Number(
    revenueSummary.totalBookings || bookingSummary.totalBookings || 0
  )
  const avgOrderValue = totalBookings
    ? Math.round(totalRevenue / totalBookings)
    : 0

  const byStatus = bookingData?.byStatus || []
  const byLabStatus = bookingData?.byLabStatus || []
  const tests = testsData?.tests || testsData || []

  const confirmedCount = byStatus.find((s) => s.status === 'confirmed')?.count || 0
  const completedCount = byStatus.find((s) => s.status === 'completed')?.count || 0
  const cancelledCount = byStatus.find((s) => s.status === 'cancelled')?.count || 0

  const revenueChartData = useMemo(
    () =>
      (revenueData?.chartData || []).map((item) => ({
        date: item.date,
        revenue: Number(item.revenue || 0),
      })),
    [revenueData]
  )

  const bookingChartData = useMemo(
    () =>
      (bookingData?.chartData || []).map((item) => ({
        date: item.date,
        bookings: Number(item.bookings || 0),
      })),
    [bookingData]
  )

  const refreshAll = async () => {
    await Promise.all([mutateRevenue(), mutateBookings()])
  }

  return (
    <>
      <style>{CSS}</style>

      <AdminHeader
        title="Analytics"
        subtitle="Lab revenue, bookings, status tracking, and test catalogue"
        breadcrumbs={[{ label: 'Lab Admin' }, { label: 'Analytics' }]}
      />

      <div className="rp-toolbar">
        <div className="rp-preset-bar" style={{ flex: 1 }}>
          {PRESETS.map((p) => (
            <PresetPill
              key={p.key}
              label={p.label}
              active={preset === p.key}
              onClick={() => setPreset(p.key)}
            />
          ))}
        </div>

        <button
          onClick={refreshAll}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            background: '#fff',
            color: '#334155',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <RefreshCw size={14} strokeWidth={2.3} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 14,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: 14,
          }}
        >
          Failed to load report data.
        </div>
      )}

      {isLoading ? (
        <SkeletonStats count={4} style={{ marginBottom: 20 }} />
      ) : (
        <div className="rp-stats-grid">
          <StatsCard
            title="Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            icon={<IndianRupee size={18} strokeWidth={2.2} />}
            color="green"
          />
          <StatsCard
            title="Total Bookings"
            value={totalBookings}
            icon={<CalendarDays size={18} strokeWidth={2.2} />}
            color="blue"
          />
          <StatsCard
            title="Completed"
            value={completedCount}
            icon={<CheckCircle2 size={18} strokeWidth={2.2} />}
            color="purple"
          />
          <StatsCard
            title="Avg Booking Value"
            value={`₹${avgOrderValue.toLocaleString('en-IN')}`}
            icon={<TrendingUp size={18} strokeWidth={2.2} />}
            color="yellow"
          />
        </div>
      )}

      <div className="rp-main-grid">
        <div style={{ minWidth: 0 }}>
          <RevenueChart
            data={revenueChartData}
            title="Revenue Over Time"
            mode="line"
            xAxisKey="date"
            dataKeys={[{ key: 'revenue', color: '#10b981', name: 'Revenue' }]}
            height={isMobile ? 220 : 280}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <SCard
            title={
              <>
                <ClipboardList size={16} strokeWidth={2.3} />
                Booking Summary
              </>
            }
          >
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { label: 'Confirmed', value: confirmedCount },
                { label: 'Completed', value: completedCount },
                { label: 'Cancelled', value: cancelledCount },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 14,
                    padding: '8px 0',
                    borderBottom: '1px solid #f8fafc',
                  }}
                >
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <strong style={{ color: '#0f172a' }}>{value}</strong>
                </div>
              ))}
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
          height={isMobile ? 200 : 260}
        />
      </div>

      <div className="rp-status-grid">
        <SCard
          title={
            <>
              <BarChart3 size={16} strokeWidth={2.3} />
              Booking by Status
            </>
          }
        >
          {!byStatus.length ? (
            <EmptyState text="No booking status data" />
          ) : (
            byStatus.map((item) => (
              <div
                key={item.status}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #f8fafc',
                  gap: 8,
                }}
              >
                <Badge variant={getStatusVariant(item.status)} size="sm">
                  {item.status?.replace(/_/g, ' ')}
                </Badge>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0f172a',
                    flexShrink: 0,
                  }}
                >
                  {item.count}
                </span>
              </div>
            ))
          )}
        </SCard>

        <SCard
          title={
            <>
              <Activity size={16} strokeWidth={2.3} />
              Lab Workflow Status
            </>
          }
        >
          {!byLabStatus.length ? (
            <EmptyState text="No lab workflow data" />
          ) : (
            byLabStatus.map((item) => (
              <div
                key={item.status}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #f8fafc',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                    textTransform: 'capitalize',
                  }}
                >
                  {item.status.replace(/_/g, ' ')}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0f172a',
                    flexShrink: 0,
                  }}
                >
                  {item.count}
                </span>
              </div>
            ))
          )}
        </SCard>
      </div>

      <SCard
        title={
          <>
            <FlaskConical size={16} strokeWidth={2.3} />
            Test Catalogue
          </>
        }
        action={
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {tests.length} tests
          </span>
        }
      >
        {!tests.length ? (
          <EmptyState text="No tests found for this lab" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tests.map((t) => (
              <div key={t.id} className="rp-test-row">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#0f172a',
                      margin: '0 0 4px',
                      wordBreak: 'break-word',
                    }}
                  >
                    {t.name}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {t.category && (
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        {t.category}
                      </span>
                    )}
                    {t.sampleType && (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {t.sampleType}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rp-test-price">
                  {t.discountedPrice ? (
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#0f172a',
                          margin: 0,
                        }}
                      >
                        ₹{Number(t.discountedPrice).toLocaleString('en-IN')}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                          margin: 0,
                        }}
                      >
                        ₹{Number(t.price).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: 0,
                      }}
                    >
                      ₹{Number(t.price || 0).toLocaleString('en-IN')}
                    </p>
                  )}
                  <Badge variant={t.isActive ? 'success' : 'danger'} size="sm">
                    {t.isActive ? 'Active' : 'Off'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </SCard>
    </>
  )
}