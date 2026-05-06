'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { Search } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

export default function RegionalBookingsPage() {
  const [page,      setPage]      = useState(1)
  const [type,      setType]      = useState('')
  const [status,    setStatus]    = useState('')
  const [dateRange, setDateRange] = useState({
    preset: 'last30', dateFrom: '', dateTo: '',
  })

  const qs = new URLSearchParams({ page, limit: 20 })
  if (type)   qs.set('type',   type)
  if (status) qs.set('status', status)
  if (dateRange.dateFrom) qs.set('dateFrom', dateRange.dateFrom)
  if (dateRange.dateTo)   qs.set('dateTo',   dateRange.dateTo)

  const { data, isLoading } = useSWR(`/api/bookings?${qs}`, fetcher)

  const columns = [
    {
      key:    'bookingId',
      header: 'Booking ID',
      render: (v) => (
        <span className="font-mono text-xs font-semibold">{v}</span>
      ),
    },
    {
      key:    'type',
      header: 'Type',
      render: (v) => <Badge variant="info" size="sm">{v}</Badge>,
    },
    {
      key:    'status',
      header: 'Status',
      render: (v) => (
        <Badge variant={getStatusVariant(v)} size="sm" dot>
          {v?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key:    'paymentStatus',
      header: 'Payment',
      render: (v) => (
        <Badge variant={getStatusVariant(v)} size="sm">
          {v?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key:    'baseFee',
      header: 'Base',
      render: (v) => `₹${(v || 0).toFixed(0)}`,
    },
    {
      key:    'totalAmount',
      header: 'Total',
      render: (v) => (
        <span className="font-semibold text-gray-800">
          ₹{(v || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key:    'startTime',
      header: 'Date',
      render: (v) =>
        new Date(v).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        }),
    },
    {
      key:    'isSettled',
      header: 'Settled',
      render: (v) => (
        <Badge variant={v ? 'success' : 'warning'} size="sm">
          {v ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <AdminHeader
        title="Bookings"
        subtitle="View all bookings in your region (read-only)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/regional/dashboard' },
          { label: 'Bookings' },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1) }}
          className="w-36"
          placeholder="All Types"
        >
          <option value="hospital">Hospital</option>
          <option value="online">Online</option>
          <option value="lab">Lab</option>
        </Select>

        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="w-44"
          placeholder="All Status"
        >
          <option value="created">Created</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="no_show">No Show</option>
          <option value="refunded">Refunded</option>
        </Select>
      </div>

      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        className="mb-4"
      />

      <DataTable
        columns={columns}
        data={data?.bookings || []}
        loading={isLoading}
        page={page}
        totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage}
        emptyTitle="No bookings found"
        emptyMessage="Bookings in your region will appear here"
      />
    </div>
  )
}