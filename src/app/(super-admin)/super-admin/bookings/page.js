'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import DateRangePicker from '@/components/ui/DateRangePicker'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/ToastContext'
import { Search, Eye, XCircle, RotateCcw } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function BookingsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [dateRange, setDateRange] = useState({ preset: 'last30', dateFrom: '', dateTo: '' })
  const [viewBooking, setViewBooking] = useState(null)
  const [cancelBooking, setCancelBooking] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)
  if (type) qs.set('type', type)
  if (status) qs.set('status', status)
  const { data, isLoading, mutate } = useSWR(`/api/bookings?${qs}`, fetcher)

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch(`/api/bookings/${cancelBooking.id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ reason: 'Cancelled by admin' }),
      })
      const json = await res.json()
      json.success ? toast.success(`Cancelled. Refund: ₹${json.data?.refundAmount || 0}`) : toast.error(json.error)
      mutate()
    } catch { toast.error('Cancel failed') }
    setCancelling(false)
    setCancelBooking(null)
  }

  const columns = [
    { key: 'bookingId', header: 'ID', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'type', header: 'Type', render: (v) => <Badge variant="info" size="sm">{v}</Badge> },
    { key: 'status', header: 'Status', render: (v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v?.replace('_', ' ')}</Badge> },
    { key: 'totalAmount', header: 'Amount', render: (v) => `₹${(v || 0).toLocaleString('en-IN')}` },
    { key: 'startTime', header: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN') },
    { key: 'actions', header: '', render: (_, row) => (
      <div className="flex gap-1.5">
        <Button size="xs" variant="ghost" onClick={() => setViewBooking(row)}><Eye className="w-3.5 h-3.5" /></Button>
        {!['cancelled', 'completed', 'refunded'].includes(row.status) && (
          <Button size="xs" variant="danger" onClick={() => setCancelBooking(row)}><XCircle className="w-3.5 h-3.5" /></Button>
        )}
      </div>
    )},
  ]

  return (
    <div>
      <AdminHeader title="Bookings" subtitle="All platform bookings" breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Bookings' }]} />
      <div className="flex flex-wrap gap-3 mb-4">
        <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} leftIcon={<Search className="w-4 h-4" />} className="w-56" />
        <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} className="w-36"><option value="">All Types</option><option value="hospital">Hospital</option><option value="online">Online</option><option value="lab">Lab</option></Select>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="w-40"><option value="">All Status</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="pending_payment">Pending</option></Select>
      </div>
      <DateRangePicker value={dateRange} onChange={setDateRange} className="mb-4" />
      <DataTable columns={columns} data={data?.bookings || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
      <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title={`Booking ${viewBooking?.bookingId}`} size="md">
        {viewBooking && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries({ Type: viewBooking.type, Status: viewBooking.status, 'Payment': viewBooking.paymentStatus, 'Base Fee': `₹${viewBooking.baseFee}`, 'Platform Fee': `₹${viewBooking.platformFee}`, GST: `₹${viewBooking.gst}`, 'Total': `₹${viewBooking.totalAmount}`, Date: new Date(viewBooking.startTime).toLocaleString('en-IN') }).map(([k, v]) => (
              <div key={k} className="py-2 border-b border-gray-50">
                <p className="text-xs text-gray-400">{k}</p>
                <p className="text-sm font-medium text-gray-800">{v}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!cancelBooking} onClose={() => setCancelBooking(null)} onConfirm={handleCancel} title="Cancel Booking?" message="Refund will be calculated based on cancellation policy." variant="danger" loading={cancelling} details={{ ID: cancelBooking?.bookingId, Amount: `₹${cancelBooking?.totalAmount}` }} />
    </div>
  )
}