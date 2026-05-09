'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader  from '@/components/admin/AdminHeader'
import DataTable    from '@/components/ui/DataTable'
import Badge        from '@/components/ui/Badge'
import Button       from '@/components/ui/Button'
import Input        from '@/components/ui/Input'
import Modal        from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/ToastContext'
import { Search, CheckCircle, ToggleLeft, Eye, MapPin, Phone, Mail, Clock } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

export default function HospitalsPage() {
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [action,   setAction]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)

  const { data, isLoading, mutate } = useSWR(`/api/hospitals?${qs}`, fetcher)

  const performAction = async () => {
    setLoading(true)
    const { type, hospital } = action
    try {
      const url  = type === 'approve'
        ? `/api/hospitals/${hospital.id}/approve`
        : `/api/hospitals/${hospital.id}/activate`
      const res  = await fetch(url, { method: 'PATCH', credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success(json.message) : toast.error(json.error)
      mutate()
    } catch { toast.error('Action failed') }
    setLoading(false)
    setAction(null)
  }

  const columns = [
    {
      key: 'name', header: 'Hospital',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {row.images?.logo ? (
            <img src={row.images.logo} alt=""
              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>🏥</div>
          )}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{v}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>
              {row.address?.city || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'isApproved', header: 'Approved',
      render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Yes' : 'Pending'}</Badge>,
    },
    {
      key: 'isActive', header: 'Active',
      render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'platformFeePercent', header: 'Fee %',
      render: (v) => `${v}%`,
    },
    {
      key: 'createdAt', header: 'Added',
      render: (v) => new Date(v).toLocaleDateString('en-IN'),
    },
    {
      key: 'actions', header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Button size="xs" variant="ghost" leftIcon={<Eye className="w-3 h-3" />}
            onClick={() => setViewItem(row)}>
            View
          </Button>
          {!row.isApproved && (
            <Button size="xs" variant="primary" leftIcon={<CheckCircle className="w-3 h-3" />}
              onClick={() => setAction({ type: 'approve', hospital: row })}>
              Approve
            </Button>
          )}
          <Button size="xs" variant={row.isActive ? 'danger' : 'outline'}
            leftIcon={<ToggleLeft className="w-3 h-3" />}
            onClick={() => setAction({ type: 'toggle', hospital: row })}>
            {row.isActive ? 'Disable' : 'Enable'}
          </Button>
        </div>
      ),
    },
  ]

  const hospitals    = data?.hospitals   || []
  const totalPages   = data?.pagination?.totalPages || 1
  const pendingCount = hospitals.filter((h) => !h.isApproved).length

  return (
    <div>
      <AdminHeader
        title="Hospitals" subtitle="Manage hospital partners"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Hospitals' }]}
        actions={pendingCount > 0 && (
          <Badge variant="warning" size="lg" dot pulse>{pendingCount} Pending</Badge>
        )}
      />

      <div style={{ marginBottom: 16 }}>
        <Input placeholder="Search hospitals..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          leftIcon={<Search className="w-4 h-4" />} className="w-72" />
      </div>

      <DataTable columns={columns} data={hospitals} loading={isLoading}
        page={page} totalPages={totalPages} onPageChange={setPage}
        emptyTitle="No hospitals found" />

      {/* ── View Detail Modal ── */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Hospital Details" size="lg">
        {viewItem && <HospitalDetail hospital={viewItem} />}
      </Modal>

      <ConfirmModal open={!!action} onClose={() => setAction(null)} onConfirm={performAction}
        title={action?.type === 'approve' ? 'Approve Hospital?' : action?.hospital?.isActive ? 'Disable Hospital?' : 'Enable Hospital?'}
        message={action?.type === 'approve' ? 'This hospital will become visible on the platform.' : 'Toggle hospital active status.'}
        confirmText={action?.type === 'approve' ? 'Approve' : 'Confirm'}
        variant={action?.type === 'approve' ? 'success' : 'warning'}
        loading={loading}
        details={{ Name: action?.hospital?.name, City: action?.hospital?.address?.city || '—' }}
      />
    </div>
  )
}

function HospitalDetail({ hospital: h }) {
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
        padding: 16, background: '#f8fafc', borderRadius: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(135deg,#dbeafe,#c7d2fe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, flexShrink: 0,
        }}>
          {h.images?.logo
            ? <img src={h.images.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '🏥'
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
            {h.name}
          </h3>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>
            {h.slug}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant={h.isApproved ? 'success' : 'warning'} size="sm" dot>
              {h.isApproved ? 'Approved' : 'Pending'}
            </Badge>
            <Badge variant={h.isActive ? 'success' : 'neutral'} size="sm">
              {h.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="info" size="sm">
              Fee: {h.platformFeePercent}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
      }}>
        <InfoCard icon={<MapPin style={{ width: 16, height: 16, color: '#6366f1' }} />} label="Address"
          value={[h.address?.line1, h.address?.city, h.address?.state, h.address?.pinCode].filter(Boolean).join(', ') || '—'} />
        <InfoCard icon={<Phone style={{ width: 16, height: 16, color: '#10b981' }} />} label="Phone"
          value={h.contactPhone || '—'} />
        <InfoCard icon={<Mail style={{ width: 16, height: 16, color: '#8b5cf6' }} />} label="Email"
          value={h.contactEmail || '—'} />
        <InfoCard icon={<Clock style={{ width: 16, height: 16, color: '#f59e0b' }} />} label="Added"
          value={new Date(h.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} />
      </div>

      {/* Rating */}
      {h.rating?.average > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
          <span style={{ fontSize: 24 }}>⭐</span>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#92400e', margin: 0 }}>
              {h.rating.average.toFixed(1)}
            </p>
            <p style={{ fontSize: 11, color: '#b45309', margin: 0 }}>{h.rating.count} reviews</p>
          </div>
        </div>
      )}

      {/* Departments */}
      {h.departments?.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Departments ({h.departments.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {h.departments.map((d) => (
              <span key={d} style={{
                fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(99,102,241,0.08)', color: '#6366f1',
              }}>{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {h.services?.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Services ({h.services.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {h.services.map((s) => (
              <span key={s} style={{
                fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(16,185,129,0.08)', color: '#059669',
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Operating Hours */}
      {h.operatingHours && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374141', marginBottom: 8 }}>
            Operating Hours
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
          }}>
            {DAYS.map((day) => {
              const slot = h.operatingHours?.[day]
              return (
                <div key={day} style={{
                  padding: '8px 12px', borderRadius: 10,
                  background: slot?.isOpen ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${slot?.isOpen ? '#bbf7d0' : '#e2e8f0'}`,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 2px' }}>
                    {DAY_LABELS[day]}
                  </p>
                  <p style={{
                    fontSize: 11, margin: 0,
                    color: slot?.isOpen ? '#16a34a' : '#94a3b8',
                  }}>
                    {slot?.isOpen ? `${slot.open} – ${slot.close}` : 'Closed'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Gallery */}
      {h.images?.gallery?.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Gallery ({h.images.gallery.length})
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 8,
          }}>
            {h.images.gallery.map((img, i) => (
              <div key={i} style={{
                borderRadius: 12, overflow: 'hidden',
                aspectRatio: '4/3', background: '#f1f5f9',
              }}>
                <img src={img} alt={`Gallery ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      {h.location?.coordinates?.length === 2 && (
        <div style={{
          padding: '10px 14px', background: '#f0f9ff',
          borderRadius: 12, border: '1px solid #bae6fd',
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#0369a1', margin: '0 0 4px' }}>
            📍 Location Coordinates
          </p>
          <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#0c4a6e', margin: 0 }}>
            Lat: {h.location.coordinates[1]}, Lng: {h.location.coordinates[0]}
          </p>
        </div>
      )}

      {/* IDs */}
      <div style={{
        padding: '10px 14px', background: '#f8fafc',
        borderRadius: 12, border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <IDRow label="Hospital ID" value={h.id} />
        {h.adminUserId && <IDRow label="Admin User ID" value={h.adminUserId} />}
        {h.regionId    && <IDRow label="Region ID" value={h.regionId} />}
        {h.bankAccountId && <IDRow label="Bank Account ID" value={h.bankAccountId} />}
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '12px 14px',
      background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>{label}</p>
        <p style={{
          fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0,
          wordBreak: 'break-word',
        }}>
          {value}
        </p>
      </div>
    </div>
  )
}

function IDRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{value}</span>
    </div>
  )
}