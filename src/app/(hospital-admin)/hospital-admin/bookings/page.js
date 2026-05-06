// src/app/(hospital-admin)/hospital-admin/bookings/page.js
'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/ToastContext'
import { Search, RefreshCw } from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function HospitalAdminBookings() {
  const toast   = useToast()
  const mounted = useMounted()

  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelOpen,   setCancelOpen]   = useState(false)
  const [cancelling,   setCancelling]   = useState(false)
  const [targetId,     setTargetId]     = useState(null)

  const qs = new URLSearchParams({ page, limit: 20 })
  if (statusFilter) qs.set('status', statusFilter)

  const { data, isLoading, mutate } = useSWR(`/api/bookings?${qs}`, fetcher)
  const bookings   = data?.bookings   || []
  const totalPages = data?.pagination?.totalPages || 1

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res  = await fetch(`/api/bookings/${targetId}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ reason: 'Cancelled by hospital admin' }),
      })
      const json = await res.json()
      json.success ? toast.success('Booking cancelled') : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed to cancel') }
    finally { setCancelling(false); setCancelOpen(false); setTargetId(null) }
  }

  const columns = [
    {
      key:    'userName',
      header: 'Patient',
      render: (v, row) => (
        <div>
          {/* ✅ Patient name primary */}
          <p className="text-sm font-semibold text-gray-800">{v || 'Unknown'}</p>
          <p className="text-xs text-gray-400 font-mono">{row.bookingId}</p>
        </div>
      ),
    },
    {
      key:    'doctorName',
      header: 'Doctor',
      render: (v) => v
        ? <span className="text-sm text-gray-700">Dr. {v}</span>
        : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key:    'type',
      header: 'Type',
      render: (v) => <Badge variant="info" size="sm">{v}</Badge>,
    },
    {
      key:    'status',
      header: 'Status',
      render: (v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v?.replace(/_/g, ' ')}</Badge>,
    },
    {
      key:    'totalAmount',
      header: 'Amount',
      render: (v) => `Rs. ${Number(v || 0).toLocaleString('en-IN')}`,
    },
    {
      key:    'startTime',
      header: 'Date',
      render: (v) => mounted
        ? new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })
        : '—',
    },
    {
      key:    'actions',
      header: '',
      render: (_, row) => (
        <div className="flex gap-2">
          {['created', 'confirmed', 'pending_payment'].includes(row.status) && (
            <button
              onClick={() => { setTargetId(row.id); setCancelOpen(true) }}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <AdminHeader title="Bookings" subtitle="Manage hospital bookings" breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Bookings' }]} />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
        </div>
        {['', 'confirmed', 'completed', 'cancelled', 'pending_payment'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={statusFilter === s
              ? 'px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white'
              : 'px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'}>
            {s || 'All Status'}
          </button>
        ))}
        <button onClick={() => mutate()} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No bookings found"
      />

      <ConfirmModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        loading={cancelling}
        title="Cancel Booking?"
        message="Are you sure you want to cancel this booking?"
        confirmText="Cancel Booking"
        variant="danger"
      />
    </div>
  )
}