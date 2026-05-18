'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import FileUpload from '@/components/ui/FileUpload'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useToast } from '@/context/ToastContext'
import {
  TestTube2,
  FlaskConical,
  FileText,
  Check,
  ChevronDown,
  House,
  MapPin,
  Phone,
  Upload,
  Loader2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => {
    setM(true)
  }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `
  @keyframes lb-spin { to{transform:rotate(360deg)} }
  @keyframes lb-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
`

const LAB_STEPS = [
  {
    key: 'sample_collected',
    label: 'Sample Collected',
    icon: <TestTube2 size={14} strokeWidth={2.3} />,
  },
  {
    key: 'processing',
    label: 'Processing',
    icon: <FlaskConical size={14} strokeWidth={2.3} />,
  },
  {
    key: 'report_ready',
    label: 'Report Ready',
    icon: <FileText size={14} strokeWidth={2.3} />,
  },
]

function StatusTracker({ status }) {
  const currentIndex = LAB_STEPS.findIndex((s) => s.key === status)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', margin: '12px 0' }}>
      {LAB_STEPS.map((step, i) => {
        const done = i <= currentIndex
        const active = i === currentIndex
        const isLast = i === LAB_STEPS.length - 1

        return (
          <div
            key={step.key}
            style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  background: done
                    ? 'linear-gradient(135deg,#10b981,#059669)'
                    : '#f1f5f9',
                  color: done ? '#fff' : '#94a3b8',
                  boxShadow: active ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none',
                  transition: 'all .3s ease',
                }}
              >
                {i < currentIndex ? <Check size={13} strokeWidth={3} /> : step.icon}
              </div>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  textAlign: 'center',
                  maxWidth: 56,
                  lineHeight: 1.3,
                  color: done ? '#10b981' : '#94a3b8',
                  margin: 0,
                }}
              >
                {step.label}
              </p>
            </div>

            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  margin: '0 4px',
                  marginBottom: 20,
                  background:
                    i < currentIndex
                      ? 'linear-gradient(90deg,#10b981,#059669)'
                      : '#f1f5f9',
                  transition: 'background .3s ease',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 3,
        background: '#f1f5f9',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
      }}
    >
      {tabs.map((t) => (
        <TabBtn
          key={t.key}
          label={t.label}
          active={active === t.key}
          onClick={() => onChange(t.key)}
        />
      ))}
    </div>
  )
}

function TabBtn({ label, active, onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1,
        padding: '10px 8px',
        borderRadius: 12,
        border: 'none',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        background: active ? '#fff' : h ? 'rgba(255,255,255,0.5)' : 'transparent',
        color: active ? '#0f172a' : h ? '#334155' : '#64748b',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      {label}
    </button>
  )
}

function StatusSelect({ value, onChange }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '10px 34px 10px 12px',
          fontSize: 13,
          fontFamily: 'inherit',
          borderRadius: 12,
          border: `1.5px solid ${focused ? '#10b981' : '#e2e8f0'}`,
          background: '#fff',
          color: '#0f172a',
          outline: 'none',
          appearance: 'none',
          cursor: 'pointer',
          boxShadow: focused
            ? '0 0 0 3px rgba(16,185,129,0.12)'
            : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
          boxSizing: 'border-box',
        }}
      >
        <option value="">Select status</option>
        <option value="sample_collected">Sample Collected</option>
        <option value="processing">Processing</option>
        <option value="report_ready">Report Ready</option>
      </select>

      <span
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#94a3b8',
          pointerEvents: 'none',
          display: 'inline-flex',
        }}
      >
        <ChevronDown size={14} strokeWidth={2.3} />
      </span>
    </div>
  )
}

function BookingCard({ b, mounted, idx, onUpdateStatus, onUploadReport }) {
  const [h, setH] = useState(false)
  const canUpload = b.status === 'confirmed' && b.labStatus !== 'report_ready'
  const reportReady = b.labStatus === 'report_ready'

  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: '#fff',
        borderRadius: 20,
        border: `1.5px solid ${h ? '#bbf7d0' : '#f1f5f9'}`,
        padding: 18,
        boxShadow: h
          ? '0 8px 24px rgba(16,185,129,0.08)'
          : '0 2px 6px rgba(0,0,0,0.04)',
        transition: 'all .2s ease',
        animation: `lb-in .2s ease ${idx * 0.04}s both`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 4,
          gap: 12,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#1e293b',
              margin: '0 0 3px',
            }}
          >
            {b.userName || 'Patient'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
              {b.bookingId}
            </span>

            {mounted && b.startTime && (
              <>
                <span style={{ color: '#e2e8f0' }}>·</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  {new Date(b.startTime).toLocaleDateString('en-IN', {
                    dateStyle: 'medium',
                  })}
                </span>
              </>
            )}
          </div>

          {b.collectionType && (
            <p
              style={{
                fontSize: 11,
                color: '#64748b',
                margin: '4px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {b.collectionType === 'home' ? (
                <>
                  <House size={12} strokeWidth={2.3} />
                  Home Collection
                </>
              ) : (
                <>
                  <MapPin size={12} strokeWidth={2.3} />
                  Walk-in
                </>
              )}
            </p>
          )}

          {b.userPhone && (
            <p
              style={{
                fontSize: 11,
                color: '#94a3b8',
                margin: '2px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Phone size={12} strokeWidth={2.3} />
              {b.userPhone}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Badge variant={getStatusVariant(b.status)} size="sm" dot>
            {b.status?.replace(/_/g, ' ')}
          </Badge>
          {b.labStatus && (
            <Badge variant={getStatusVariant(b.labStatus)} size="sm">
              {b.labStatus?.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>
      </div>

      <StatusTracker status={b.labStatus} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingTop: 12,
          borderTop: '1px solid #f8fafc',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {b.status === 'confirmed' && (
            <ActionBtn label="Update Status" color="secondary" onClick={() => onUpdateStatus(b)} />
          )}

          {canUpload && (
            <ActionBtn
              label="Upload Report"
              color="primary"
              icon={<Upload size={13} strokeWidth={2.4} />}
              onClick={() => onUploadReport(b)}
            />
          )}

          {reportReady && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#10b981',
                padding: '5px 10px',
                background: 'rgba(16,185,129,0.08)',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Check size={13} strokeWidth={2.6} />
              Report Ready
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ label, color, onClick, icon }) {
  const [h, setH] = useState(false)

  const V = {
    primary: {
      base: 'linear-gradient(135deg,#10b981,#059669)',
      hov: 'linear-gradient(135deg,#059669,#047857)',
      color: '#fff',
      border: 'none',
      shadow: '0 3px 10px rgba(16,185,129,0.35)',
    },
    secondary: {
      base: '#fff',
      hov: '#f8fafc',
      color: '#475569',
      border: '1.5px solid #e2e8f0',
      shadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
  }

  const s = V[color] || V.secondary

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '7px 12px',
        borderRadius: 10,
        border: s.border || 'none',
        background: h ? s.hov : s.base,
        color: s.color,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: s.shadow,
        transition: 'all .15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function UpdateStatusModal({ booking, onClose, onSave, saving }) {
  const [status, setStatus] = useState(booking?.labStatus || '')
  const [sh, setSh] = useState(false)

  return (
    <Modal open={!!booking} onClose={onClose} title="Update Lab Status" size="sm">
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
        Patient: <strong style={{ color: '#1e293b' }}>{booking?.userName || 'Unknown'}</strong>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#94a3b8',
            marginLeft: 8,
          }}
        >
          ({booking?.bookingId})
        </span>
      </p>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#475569',
            display: 'block',
            marginBottom: 6,
          }}
        >
          Lab Status
        </label>
        <StatusSelect value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '11px',
            borderRadius: 12,
            border: '1.5px solid #e2e8f0',
            background: '#fff',
            color: '#475569',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>

        <button
          onClick={() => onSave(status)}
          disabled={saving || !status}
          onMouseEnter={() => setSh(true)}
          onMouseLeave={() => setSh(false)}
          style={{
            flex: 1,
            padding: '11px',
            borderRadius: 12,
            border: 'none',
            background: saving
              ? '#e2e8f0'
              : sh
                ? 'linear-gradient(135deg,#059669,#047857)'
                : 'linear-gradient(135deg,#10b981,#059669)',
            color: saving ? '#94a3b8' : '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: saving || !status ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all .15s ease',
          }}
        >
          {saving && (
            <Loader2 size={14} strokeWidth={2.4} style={{ animation: 'lb-spin .7s linear infinite' }} />
          )}
          Update Status
        </button>
      </div>
    </Modal>
  )
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 20,
        flexWrap: 'wrap',
      }}
    >
      <PageBtn
        label="Previous"
        iconLeft={<ChevronLeft size={14} strokeWidth={2.4} />}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      <span style={{ fontSize: 13, color: '#64748b' }}>
        Page {page} of {totalPages}
      </span>
      <PageBtn
        label="Next"
        iconRight={<ChevronRight size={14} strokeWidth={2.4} />}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      />
    </div>
  )
}

function PageBtn({ label, disabled, onClick, iconLeft, iconRight }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '8px 16px',
        borderRadius: 12,
        border: `1.5px solid ${h && !disabled ? '#10b981' : '#e2e8f0'}`,
        background: h && !disabled ? 'rgba(16,185,129,0.06)' : '#fff',
        color: disabled ? '#cbd5e1' : h ? '#10b981' : '#64748b',
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all .15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {iconLeft}
      {label}
      {iconRight}
    </button>
  )
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function LabBookingsPage() {
  const toast = useToast()
  const mounted = useMounted()

  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [updateModal, setUpdateModal] = useState(null)
  const [uploadModal, setUploadModal] = useState(null)
  const [updating, setUpdating] = useState(false)

  const qs = new URLSearchParams({ page, limit: 20, type: 'lab' })
  if (tab !== 'all') qs.set('status', tab)

  const { data, isLoading, mutate } = useSWR(`/api/bookings?${qs}`, fetcher)
  const bookings = data?.bookings || []
  const totalPages = data?.pagination?.totalPages || 1

  const updateStatus = async (newStatus) => {
    if (!newStatus) {
      toast.error('Select a status')
      return
    }

    setUpdating(true)
    try {
      const res = await fetch(`/api/bookings/${updateModal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ labStatus: newStatus }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success('Status updated')
        setUpdateModal(null)
        mutate()
      } else {
        toast.error(json.error || 'Failed to update status')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Lab Bookings"
        subtitle="Manage lab test bookings and reports"
        breadcrumbs={[{ label: 'Lab Admin' }, { label: 'Bookings' }]}
      />

      <TabBar
        tabs={TABS}
        active={tab}
        onChange={(t) => {
          setTab(t)
          setPage(1)
        }}
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !bookings.length ? (
        <EmptyState
          icon={<ClipboardList size={48} strokeWidth={1.8} />}
          title="No bookings found"
          message="Lab bookings will appear here"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bookings.map((b, i) => (
            <BookingCard
              key={b.id}
              b={b}
              mounted={mounted}
              idx={i}
              onUpdateStatus={() => setUpdateModal(b)}
              onUploadReport={() => setUploadModal(b)}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {updateModal && (
        <UpdateStatusModal
          booking={updateModal}
          onClose={() => setUpdateModal(null)}
          onSave={updateStatus}
          saving={updating}
        />
      )}

      <Modal
        open={!!uploadModal}
        onClose={() => setUploadModal(null)}
        title={`Upload Report — ${uploadModal?.userName || uploadModal?.bookingId}`}
        size="sm"
      >
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          Upload the PDF lab report for{' '}
          <strong style={{ color: '#1e293b' }}>
            {uploadModal?.userName || 'this patient'}
          </strong>
          .
        </p>

        <FileUpload
          purpose="lab_report"
          entityId={uploadModal?.id}
          accept="application/pdf"
          label="Upload PDF Report"
          maxSizeMB={10}
          onSuccess={() => {
            toast.success('Report uploaded successfully')
            setUploadModal(null)
            mutate()
          }}
        />
      </Modal>
    </>
  )
}