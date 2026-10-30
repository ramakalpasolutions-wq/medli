
'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import {
  CalendarDays, CheckCircle2, PartyPopper, Video, IndianRupee,
  User, Check, X, Building2, Star, ChevronRight, Stethoscope,
  TicketPercent, FileText, Ban,
} from 'lucide-react'

const fetcher = async (url) => {
  const res = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  })

  const json = await res.json()

  if (!res.ok || json?.success === false) {
    throw new Error(
      json?.message ||
      json?.error ||
      `Request failed (${res.status})`
    )
  }

  return json?.data ?? json
}

function indiaDate() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const get = (type) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

const rupees = (number) =>
  `₹${Number(number || 0).toLocaleString('en-IN')}`

const palette = {
  blue: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: '#2563eb',
    label: '#1e40af',
  },
  green: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: '#16a34a',
    label: '#15803d',
  },
  purple: {
    bg: '#f5f3ff',
    border: '#ddd6fe',
    icon: '#7c3aed',
    label: '#6d28d9',
  },
  orange: {
    bg: '#fff7ed',
    border: '#fed7aa',
    icon: '#ea580c',
    label: '#c2410c',
  },
}

function QuickStat({ icon: Icon, label, value, color = 'blue' }) {
  const c = palette[color]

  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        padding: '16px 18px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 9,
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 32,
            height: 32,
            background: '#ffffffcc',
            borderRadius: 10,
            color: c.icon,
          }}
        >
          <Icon size={18} strokeWidth={2.3} />
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: c.label,
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: c.icon,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Panel({ title, children, extraHeader }) {
  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #f1f5f9',
        borderRadius: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        padding: 20,
        minWidth: 0,
      }}
    >
      {title && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '.5px',
              textTransform: 'uppercase',
              color: '#94a3b8',
            }}
          >
            {title}
          </h3>
          {extraHeader}
        </div>
      )}
      {children}
    </section>
  )
}

function ErrorMessage({ error, title }) {
  if (!error) return null

  return (
    <div
      role="alert"
      style={{
        padding: 14,
        marginBottom: 16,
        border: '1px solid #fecaca',
        background: '#fef2f2',
        color: '#b91c1c',
        borderRadius: 12,
        fontSize: 13,
      }}
    >
      <strong>{title}:</strong> {error.message}
    </div>
  )
}

function SkeletonStats() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))',
        gap: 14,
        marginBottom: 24,
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          style={{
            height: 94,
            background: '#f1f5f9',
            borderRadius: 16,
          }}
        />
      ))}
    </div>
  )
}

const actionStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: 'none',
  borderRadius: 10,
  padding: '8px 11px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 12,
}

function BookingRow({ booking, now, onStatusChange }) {
  const [busy, setBusy] = useState(false)
  const starts = booking.startTime
    ? new Date(booking.startTime)
    : null

  const time = starts
    ? starts.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  const date = starts
    ? starts.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
      })
    : '—'

  const diffMinutes =
    starts && now
      ? (starts.getTime() - now.getTime()) / 60000
      : null

  const joinAllowed =
    booking.type === 'online' &&
    booking.meetLink &&
    diffMinutes !== null &&
    diffMinutes <= 15 &&
    diffMinutes >= -30

  const changeStatus = async (status) => {
    setBusy(true)
    try {
      await onStatusChange(booking.id, status)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: 15,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#1e293b',
            fontFamily: 'monospace',
          }}
        >
          {booking.bookingId || booking.id}
        </div>

        <div
          style={{
            fontSize: 12,
            color: '#6366f1',
            margin: '4px 0',
          }}
        >
          {time} · {date}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'center',
            fontSize: 12,
          }}
        >
          <Badge size="sm" variant="info">
            {booking.type}
          </Badge>

          <Badge
            size="sm"
            variant={getStatusVariant(booking.status)}
          >
            {booking.status?.replace(/_/g, ' ')}
          </Badge>

          {booking.patient?.name ||
          booking.user?.name ||
          booking.userName ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                color: '#64748b',
              }}
            >
              <User size={12} />
              {booking.patient?.name ||
                booking.user?.name ||
                booking.userName}
            </span>
          ) : null}

          {Number(booking.totalAmount) > 0 && (
            <span
              style={{
                color: '#16a34a',
                fontWeight: 700,
              }}
            >
              {rupees(booking.totalAmount)}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {joinAllowed && (
          <button
            onClick={() =>
              window.open(
                booking.meetLink,
                '_blank',
                'noopener,noreferrer'
              )
            }
            style={{
              ...actionStyle,
              background: '#10b981',
              color: '#fff',
            }}
          >
            <Video size={14} /> Join Meet
          </button>
        )}

        {booking.status === 'confirmed' && (
          <>
            <button
              disabled={busy}
              onClick={() => changeStatus('completed')}
              style={{
                ...actionStyle,
                background: '#6366f1',
                color: '#fff',
              }}
            >
              <Check size={14} /> Complete
            </button>

            <button
              disabled={busy}
              onClick={() => changeStatus('no_show')}
              style={{
                ...actionStyle,
                background: '#fee2e2',
                color: '#b91c1c',
              }}
            >
              <X size={14} /> Not Attended
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const quickActions = [
  {
    label: 'View All Bookings',
    href: '/hospital-admin/bookings',
    icon: CalendarDays,
  },
  {
    label: 'Manage Doctors',
    href: '/hospital-admin/doctors',
    icon: Stethoscope,
  },
  {
    label: 'Hospital Coupons',
    href: '/hospital-admin/coupons',
    icon: TicketPercent,
  },
  {
    label: 'Settlements',
    href: '/hospital-admin/settlements',
    icon: IndianRupee,
  },
  {
    label: 'Invoices',
    href: '/hospital-admin/invoices',
    icon: FileText,
  },
  {
    label: 'Analytics',
    href: '/hospital-admin/reports',
    icon: CheckCircle2,
  },
  {
    label: 'Doctor Unavailability',
    href: '/hospital-admin/doctor-unavailability',
    icon: Ban,
  },
  {
    label: 'Settings',
    href: '/hospital-admin/settings',
    icon: CheckCircle2,
  },
]

export default function HospitalAdminDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [now, setNow] = useState(null)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(
      () => setNow(new Date()),
      30_000
    )
    return () => clearInterval(timer)
  }, [])

  const todayKey = now ? indiaDate() : null

  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
    mutate: refreshStats,
  } = useSWR(
    '/api/hospital-admin/dashboard',
    fetcher,
    { refreshInterval: 30_000 }
  )

  const {
    data: bookingsData,
    error: bookingsError,
    isLoading: bookingsLoading,
    mutate: refreshBookings,
  } = useSWR(
    todayKey
      ? `/api/bookings?limit=50&dateFrom=${todayKey}&dateTo=${todayKey}`
      : null,
    fetcher,
    { refreshInterval: 30_000 }
  )

  const {
    data: hospitalData,
    error: hospitalError,
  } = useSWR(
    '/api/hospitals?adminOnly=true',
    fetcher
  )

  const {
    data: pendingData,
    error: pendingError,
    mutate: refreshPending,
  } = useSWR(
    '/api/settlements/pending',
    fetcher
  )

  const hospital = hospitalData?.hospitals?.[0]

  const myPending = hospital
    ? (pendingData?.hospitals || []).find(
        (h) => h.id === hospital.id
      )
    : null

  const bookings = bookingsData?.bookings || []
  const daily = stats?.today || {}
  const overall = stats?.overall || {}

  const hour = now?.getHours()

  const greeting =
    hour === undefined
      ? 'Hello'
      : hour < 12
        ? 'Good morning'
        : hour < 17
          ? 'Good afternoon'
          : 'Good evening'

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(
        `/api/bookings/${id}/status`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      )

      const json = await res.json()

      if (!res.ok || json?.success === false) {
        throw new Error(
          json?.message ||
          json?.error ||
          'Failed to update booking'
        )
      }

      toast.success(
        `Marked as ${status.replace('_', ' ')}`
      )

      await Promise.all([
        refreshBookings(),
        refreshStats(),
        refreshPending(),
      ])
    } catch (error) {
      toast.error(
        error.message || 'Failed to update booking'
      )
    }
  }

  return (
    <>
      <AdminHeader
        title={`${greeting}${user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋`}
        subtitle={
          hospital
            ? `Managing ${hospital.name}`
            : 'Hospital management overview'
        }
        breadcrumbs={[
          { label: 'Hospital Admin' },
          { label: 'Dashboard' },
        ]}
      />

      <ErrorMessage
        error={statsError}
        title="Statistics API failed"
      />
      <ErrorMessage
        error={bookingsError}
        title="Today's bookings API failed"
      />
      <ErrorMessage
        error={hospitalError}
        title="Hospital details API failed"
      />
      <ErrorMessage
        error={pendingError}
        title="Pending settlements API failed"
      />

      {statsLoading ? (
        <SkeletonStats />
      ) : !statsError && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(165px,1fr))',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {/* <QuickStat
            icon={CalendarDays}
            label="Today's Bookings"
            value={daily.bookings ?? 0}
            color="blue"
          /> */}
          {/* <QuickStat
            icon={CheckCircle2}
            label="Confirmed"
            value={daily.confirmed ?? 0}
            color="purple"
          /> */}
          {/* <QuickStat
            icon={PartyPopper}
            label="Completed"
            value={daily.completed ?? 0}
            color="green"
          />
          <QuickStat
            icon={Video}
            label="Online Consults"
            value={daily.online ?? 0}
            color="blue"
          />
          <QuickStat
            icon={IndianRupee}
            label="Today's Paid Value"
            value={rupees(daily.paidAmount)}
            color="orange"
          /> */}
        </div>
      )}

      {!statsLoading && !statsError && (
        <div style={{ marginBottom: 22 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#1e293b',
              margin: '0 0 12px',
            }}
          >
            Overall Hospital Statistics
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(165px,1fr))',
              gap: 14,
            }}
          >
            <QuickStat
              icon={CalendarDays}
              label="All Bookings"
              value={overall.bookings ?? 0}
              color="blue"
            />
            <QuickStat
              icon={CheckCircle2}
              label="All Confirmed"
              value={overall.confirmed ?? 0}
              color="purple"
            />
            <QuickStat
              icon={PartyPopper}
              label="All Completed"
              value={overall.completed ?? 0}
              color="green"
            />
            <QuickStat
              icon={Video}
              label="All Online Consults"
              value={overall.online ?? 0}
              color="blue"
            />
            <QuickStat
              icon={IndianRupee}
              label="Total Paid Value"
              value={rupees(overall.paidAmount)}
              color="orange"
            />
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit,minmax(280px,1fr))',
          gap: 16,
          marginBottom: 20,
          alignItems: 'stretch',
        }}
      >
        {hospital && (
          <Panel title="Hospital Info">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#dbeafe',
                  color: '#2563eb',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {hospital.images?.logo ? (
                  <img
                    src={hospital.images.logo}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <Building2 size={22} />
                )}
              </span>

              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  {hospital.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#94a3b8',
                  }}
                >
                  {hospital.address?.city || '—'}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 12,
              }}
            >
              <Badge
                size="sm"
                dot
                variant={
                  hospital.isApproved
                    ? 'success'
                    : 'warning'
                }
              >
                {hospital.isApproved
                  ? 'Approved'
                  : 'Pending Approval'}
              </Badge>

              <Badge
                size="sm"
                variant={
                  hospital.isActive
                    ? 'success'
                    : 'neutral'
                }
              >
                {hospital.isActive
                  ? 'Active'
                  : 'Inactive'}
              </Badge>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 5,
              }}
            >
              {(hospital.departments || [])
                .slice(0, 4)
                .map((dept) => (
                  <span
                    key={dept}
                    style={{
                      fontSize: 10,
                      padding: '3px 8px',
                      background: '#eef2ff',
                      color: '#6366f1',
                      borderRadius: 50,
                    }}
                  >
                    {dept}
                  </span>
                ))}

              {(hospital.departments || []).length > 4 && (
                <span
                  style={{
                    fontSize: 10,
                    color: '#94a3b8',
                  }}
                >
                  +{hospital.departments.length - 4} more
                </span>
              )}
            </div>

            {hospital.rating?.average > 0 && (
              <p
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 13,
                  color: '#92400e',
                }}
              >
                <Star size={14} fill="#fbbf24" />
                {Number(
                  hospital.rating.average
                ).toFixed(1)}
                {' '}
                ({hospital.rating.count || 0} reviews)
              </p>
            )}
          </Panel>
        )}

        {myPending && (
          <Panel title="Pending Settlement">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    color: '#64748b',
                    fontSize: 11,
                  }}
                >
                  Bookings
                </div>
                <strong>
                  {myPending.totalBookings || 0}
                </strong>
              </div>

              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    color: '#059669',
                    fontSize: 11,
                  }}
                >
                  You Get
                </div>
                <strong style={{ color: '#047857' }}>
                  {rupees(
                    myPending.netSettlementAmount
                  )}
                </strong>
              </div>
            </div>

            <button
              onClick={() =>
                router.push(
                  '/hospital-admin/settlements'
                )
              }
              style={{
                ...actionStyle,
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                marginTop: 14,
                background: '#e0e7ff',
                color: '#6366f1',
              }}
            >
              View Settlements
              <ChevronRight size={14} />
            </button>
          </Panel>
        )}

        <Panel title="Quick Actions">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {quickActions.map(
              ({ icon: Icon, label, href }) => (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: '1px solid #f1f5f9',
                    padding: '11px 14px',
                    borderRadius: 12,
                    width: '100%',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    color: '#374151',
                    fontSize: 13,
                    textAlign: 'left',
                  }}
                >
                  <Icon
                    size={16}
                    strokeWidth={2}
                  />
                  {label}
                </button>
              )
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Today's Schedule"
        extraHeader={
          <button
            onClick={() =>
              router.push(
                '/hospital-admin/bookings'
              )
            }
            style={{
              border: 'none',
              background: 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              color: '#6366f1',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            View all
            <ChevronRight size={14} />
          </button>
        }
      >
        {bookingsLoading ? (
          <div
            style={{
              color: '#94a3b8',
              textAlign: 'center',
              padding: 30,
            }}
          >
            Loading appointments…
          </div>
        ) : bookingsError ? (
          <div
            style={{
              color: '#b91c1c',
              textAlign: 'center',
              padding: 30,
            }}
          >
            Unable to show today's appointments.
          </div>
        ) : bookings.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 16px',
              color: '#94a3b8',
            }}
          >
            <CalendarDays
              size={30}
              style={{
                margin: '0 auto 12px',
              }}
            />

            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              No appointments today
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 12,
              }}
            >
              Appointments scheduled for today
              will appear here.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {bookings.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                now={now}
                onStatusChange={updateStatus}
              />
            ))}

            {(bookingsData?.pagination?.total || 0) >
              bookings.length && (
              <p
                style={{
                  color: '#64748b',
                  fontSize: 12,
                }}
              >
                Showing {bookings.length} of{' '}
                {bookingsData.pagination.total}{' '}
                appointments. Select View all for
                the complete list.
              </p>
            )}
          </div>
        )}
      </Panel>
    </>
  )
}
