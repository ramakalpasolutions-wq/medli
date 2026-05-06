// src/app/(lab-admin)/lab-admin/bookings/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import FileUpload from '@/components/ui/FileUpload'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useToast } from '@/context/ToastContext'
import { Upload, FlaskConical } from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const LAB_STEPS = [
  { key: 'sample_collected', label: 'Sample Collected', emoji: '🧪' },
  { key: 'processing',       label: 'Processing',       emoji: '⚗️'  },
  { key: 'report_ready',     label: 'Report Ready',     emoji: '📄' },
]

function StatusTracker({ status }) {
  const currentIndex = LAB_STEPS.findIndex((s) => s.key === status)
  return (
    <div className="flex items-start gap-0 my-3">
      {LAB_STEPS.map((step, i) => {
        const done   = i <= currentIndex
        const active = i === currentIndex
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'} ${active ? 'ring-2 ring-blue-300 ring-offset-1' : ''}`}>
                {i < currentIndex ? '✓' : step.emoji}
              </div>
              <p className={`text-[9px] font-medium text-center leading-tight max-w-[56px] ${done ? 'text-blue-600' : 'text-gray-400'}`}>
                {step.label}
              </p>
            </div>
            {i < LAB_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 -translate-y-3 ${i < currentIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

const TABS = [
  { key: 'all',       label: 'All'       },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function LabBookingsPage() {
  const toast   = useToast()
  const mounted = useMounted()

  const [tab,         setTab]         = useState('all')
  const [page,        setPage]        = useState(1)
  const [updateModal, setUpdateModal] = useState(null)
  const [uploadModal, setUploadModal] = useState(null)
  const [newStatus,   setNewStatus]   = useState('')
  const [updating,    setUpdating]    = useState(false)

  const qs = new URLSearchParams({ page, limit: 20, type: 'lab' })
  if (tab !== 'all') qs.set('status', tab)

  const { data, isLoading, mutate } = useSWR(`/api/bookings?${qs}`, fetcher)
  const bookings   = data?.bookings   || []
  const totalPages = data?.pagination?.totalPages || 1

  const updateStatus = async () => {
    if (!newStatus) { toast.error('Select a status'); return }
    setUpdating(true)
    try {
      const res  = await fetch(`/api/bookings/${updateModal.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ labStatus: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Status updated successfully')
        setUpdateModal(null)
        mutate()
      } else {
        toast.error(json.error || 'Failed to update status')
      }
    } catch { toast.error('Network error') }
    finally { setUpdating(false) }
  }

  return (
    <div>
      <AdminHeader title="Lab Bookings" subtitle="Manage lab test bookings and reports"
        breadcrumbs={[{ label: 'Lab Admin' }, { label: 'Bookings' }]} />

      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1) }}
            className={tab === t.key
              ? 'flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white text-gray-900 shadow-sm transition-all'
              : 'flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-all'}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : bookings.length === 0 ? (
        <EmptyState icon={<FlaskConical className="w-10 h-10 text-gray-300" />} title="No bookings found" message="Lab bookings will appear here" />
      ) : (
        <div className="space-y-4">
          {bookings.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {/* ✅ Patient name primary */}
                    <p className="text-sm font-bold text-gray-800">
                      {b.userName || 'Patient'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400 font-mono">{b.bookingId}</p>
                      {mounted && b.startTime && (
                        <>
                          <span className="text-xs text-gray-300">·</span>
                          <p className="text-xs text-gray-400">
                            {new Date(b.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </p>
                        </>
                      )}
                    </div>
                    {b.collectionType && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {b.collectionType === 'home' ? '🏠 Home Collection' : '🚶 Walk-in'}
                      </p>
                    )}
                    {b.userPhone && (
                      <p className="text-xs text-gray-400 mt-0.5">📞 {b.userPhone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
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

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                  <p className="text-sm font-bold text-gray-800">
                    Rs. {Number(b.totalAmount || 0).toLocaleString('en-IN')}
                  </p>
                  <div className="flex gap-2">
                    {b.status === 'confirmed' && (
                      <Button size="xs" variant="secondary"
                        onClick={() => { setUpdateModal(b); setNewStatus(b.labStatus || '') }}>
                        Update Status
                      </Button>
                    )}
                    {b.status === 'confirmed' && b.labStatus !== 'report_ready' && (
                      <Button size="xs" variant="primary" leftIcon={<Upload className="w-3 h-3" />}
                        onClick={() => setUploadModal(b)}>
                        Upload Report
                      </Button>
                    )}
                    {b.labStatus === 'report_ready' && (
                      <span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded-lg">
                        ✓ Report Ready
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            Next
          </button>
        </div>
      )}

      <Modal open={!!updateModal} onClose={() => setUpdateModal(null)} title="Update Lab Status" size="sm">
        <p className="text-sm text-gray-500 mb-4">
          Patient: <span className="font-semibold text-gray-800">{updateModal?.userName || 'Unknown'}</span>
          <span className="text-gray-400 font-mono text-xs ml-2">({updateModal?.bookingId})</span>
        </p>
        <Select label="Lab Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
          <option value="">Select status</option>
          <option value="sample_collected">Sample Collected</option>
          <option value="processing">Processing</option>
          <option value="report_ready">Report Ready</option>
        </Select>
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setUpdateModal(null)}>Cancel</Button>
          <Button className="flex-1" onClick={updateStatus} loading={updating}>Update Status</Button>
        </div>
      </Modal>

      <Modal open={!!uploadModal} onClose={() => setUploadModal(null)}
        title={`Upload Report — ${uploadModal?.userName || uploadModal?.bookingId}`} size="sm">
        <p className="text-sm text-gray-500 mb-4">
          Upload the PDF lab report for <span className="font-semibold text-gray-800">{uploadModal?.userName || 'this patient'}</span>.
        </p>
        <FileUpload
          purpose="lab_report" entityId={uploadModal?.id} accept="application/pdf"
          label="Upload PDF Report" maxSizeMB={10}
          onSuccess={() => { toast.success('Report uploaded successfully'); setUploadModal(null); mutate() }}
        />
      </Modal>
    </div>
  )
}