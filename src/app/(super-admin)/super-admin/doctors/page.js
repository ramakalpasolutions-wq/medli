'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader  from '@/components/admin/AdminHeader'
import DataTable    from '@/components/ui/DataTable'
import Badge        from '@/components/ui/Badge'
import Button       from '@/components/ui/Button'
import Input        from '@/components/ui/Input'
import Modal        from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/ToastContext'
import { Search, ShieldCheck, ShieldOff, Eye } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const DAY_MAP = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }

export default function DoctorsPage() {
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [action,   setAction]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)
  const { data, isLoading, mutate } = useSWR(`/api/doctors?${qs}`, fetcher)

  const doAction = async () => {
    setLoading(true)
    const { type, doctor } = action
    try {
      const url  = type === 'verify' ? `/api/doctors/${doctor.id}/verify` : `/api/doctors/${doctor.id}/activate`
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
      key: 'name', header: 'Doctor',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#6366f1', flexShrink: 0, overflow: 'hidden',
          }}>
            {row.avatar
              ? <img src={row.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : v?.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{v}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>{row.specialization?.join(', ') || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'isVerified', header: 'Verified', render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Verified' : 'Pending'}</Badge> },
    { key: 'isActive',   header: 'Active',   render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'experience', header: 'Exp',      render: (v) => v ? `${v} yrs` : '—' },
    {
      key: 'actions', header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Button size="xs" variant="ghost" leftIcon={<Eye className="w-3 h-3" />}
            onClick={() => setViewItem(row)}>View</Button>
          {!row.isVerified && (
            <Button size="xs" variant="primary" leftIcon={<ShieldCheck className="w-3 h-3" />}
              onClick={() => setAction({ type: 'verify', doctor: row })}>Verify</Button>
          )}
          <Button size="xs" variant={row.isActive ? 'danger' : 'outline'}
            leftIcon={<ShieldOff className="w-3 h-3" />}
            onClick={() => setAction({ type: 'toggle', doctor: row })}>
            {row.isActive ? 'Disable' : 'Enable'}
          </Button>
        </div>
      ),
    },
  ]

  const doctors    = data?.doctors    || []
  const totalPages = data?.pagination?.totalPages || 1

  return (
    <div>
      <AdminHeader title="Doctors" subtitle="Manage doctors"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Doctors' }]} />

      <div style={{ marginBottom: 16 }}>
        <Input placeholder="Search doctors..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          leftIcon={<Search className="w-4 h-4" />} className="w-72" />
      </div>

      <DataTable columns={columns} data={doctors} loading={isLoading}
        page={page} totalPages={totalPages} onPageChange={setPage}
        emptyTitle="No doctors found" />

      {/* ── View Detail Modal ── */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Doctor Details" size="md">
        {viewItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Avatar + Name */}
            <div style={{
              display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
              padding: 16, background: '#f8fafc', borderRadius: 16,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 28, fontWeight: 700, flexShrink: 0,
              }}>
                {viewItem.avatar
                  ? <img src={viewItem.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : viewItem.name?.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  Dr. {viewItem.name}
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>
                  {viewItem.experience ? `${viewItem.experience} years experience` : ''}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge variant={viewItem.isVerified ? 'success' : 'warning'} size="sm" dot>
                    {viewItem.isVerified ? 'Verified' : 'Pending'}
                  </Badge>
                  <Badge variant={viewItem.isActive ? 'success' : 'neutral'} size="sm">
                    {viewItem.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Specializations */}
            {viewItem.specialization?.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  Specializations
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewItem.specialization.map((s) => (
                    <span key={s} style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100,
                      background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Qualifications */}
            {viewItem.qualifications?.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  Qualifications
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewItem.qualifications.map((q) => (
                    <span key={q} style={{
                      fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 100,
                      background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
                    }}>{q}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Consultation Fee */}
            {viewItem.consultationFee && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12,
              }}>
                <div style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: 11, color: '#16a34a', margin: '0 0 4px', fontWeight: 600 }}>Offline Fee</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#15803d', margin: 0 }}>
                    ₹{viewItem.consultationFee.offline || 0}
                  </p>
                </div>
                <div style={{ padding: '12px 14px', background: '#f5f3ff', borderRadius: 12, border: '1px solid #ddd6fe' }}>
                  <p style={{ fontSize: 11, color: '#7c3aed', margin: '0 0 4px', fontWeight: 600 }}>Online Fee</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#6d28d9', margin: 0 }}>
                    ₹{viewItem.consultationFee.online || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Consultation Types */}
            {viewItem.consultationTypes?.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  Consultation Types
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewItem.consultationTypes.map((t) => (
                    <Badge key={t} variant="info" size="sm">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            {viewItem.availability?.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  Availability Slots
                </p>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8,
                }}>
                  {viewItem.availability.map((slot, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', background: '#f0fdf4', borderRadius: 10,
                      border: '1px solid #bbf7d0',
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', margin: '0 0 4px' }}>
                        {DAY_MAP[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`}
                      </p>
                      <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>
                        {slot.startTime} – {slot.endTime}
                      </p>
                      <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>
                        {slot.slotDuration} min slots
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rating */}
            {viewItem.rating?.average > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a',
              }}>
                <span style={{ fontSize: 24 }}>⭐</span>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#92400e', margin: 0 }}>
                  {viewItem.rating.average.toFixed(1)}
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#b45309' }}> ({viewItem.rating.count})</span>
                </p>
              </div>
            )}

            {/* IDs */}
            <div style={{
              padding: '12px 14px', background: '#f8fafc', borderRadius: 12,
              border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <IDRow label="Doctor ID" value={viewItem.id} />
              {viewItem.userId && <IDRow label="User ID" value={viewItem.userId} />}
              {viewItem.hospitalId && <IDRow label="Hospital ID" value={viewItem.hospitalId} />}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!action} onClose={() => setAction(null)} onConfirm={doAction}
        title={action?.type === 'verify' ? 'Verify Doctor?' : 'Toggle Status?'}
        message="This action will be logged." confirmText="Confirm"
        variant={action?.type === 'verify' ? 'success' : 'warning'}
        loading={loading} details={{ Name: action?.doctor?.name }} />
    </div>
  )
}

function IDRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}