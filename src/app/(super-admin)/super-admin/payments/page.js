// src/app/(super-admin)/super-admin/payments/page.js

'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { formatCurrency } from '@/lib/utils/helpers'

const fetcher = (url, token) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(d => d.data)

// 1Pay status → badge variant mapping
function getPaymentBadge(status) {
  const map = {
    created: 'neutral',
    success: 'success',
    failure: 'danger',
    timeout: 'warning',
    pending: 'info'
  }
  return map[status] || 'neutral'
}

export default function PaymentsPage() {
  const { accessToken } = useAuth()
  const [status,   setStatus]   = useState('')
  const [page,     setPage]     = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const params = new URLSearchParams({
    page,
    ...(status   && { status }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo   && { dateTo })
  })

  const { data, isLoading } = useSWR(
    accessToken
      ? [`/api/payments?${params}`, accessToken]
      : null,
    ([url, token]) => fetcher(url, token)
  )

  const columns = [
    {
      key:    'onePayTxnId',
      label:  'Transaction ID',
      render: (val) => (
        <span className="font-mono text-xs text-gray-700">{val || '-'}</span>
      )
    },
    {
      key:    'onePayPgRefId',
      label:  'PG Reference',
      render: (val) => (
        <span className="font-mono text-xs text-gray-700">{val || '-'}</span>
      )
    },
    {
      key:    'onePayInstrumentType',
      label:  'Instrument',
      render: (val) => (
        <span className="text-xs text-gray-600 capitalize">{val || '-'}</span>
      )
    },
    {
      key:    'amount',
      label:  'Amount',
      render: (val) => (
        <span className="font-semibold text-gray-900">
          {val ? formatCurrency(val) : '-'}
        </span>
      )
    },
    {
      key:    'status',
      label:  'Status',
      render: (val) => (
        <Badge variant={getPaymentBadge(val)}>
          {val}
        </Badge>
      )
    },
    {
      key:    'createdAt',
      label:  'Date',
      render: (val) => new Date(val).toLocaleDateString('en-IN')
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          All 1Pay gateway transactions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="created">Created</option>
          <option value="success">Success</option>
          <option value="failure">Failed</option>
          <option value="timeout">Timeout</option>
          <option value="pending">Pending</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Payment status legend */}
      <div className="flex flex-wrap gap-2">
        {[
          { status: 'success', label: 'Success',  variant: 'success' },
          { status: 'failure', label: 'Failed',   variant: 'danger'  },
          { status: 'timeout', label: 'Timeout',  variant: 'warning' },
          { status: 'pending', label: 'Pending',  variant: 'info'    },
          { status: 'created', label: 'Created',  variant: 'neutral' }
        ].map(item => (
          <Badge key={item.status} variant={item.variant}>
            {item.label}
          </Badge>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={data?.payments || []}
          loading={isLoading}
          pagination={{
            page:       data?.pagination?.page || 1,
            pages:      data?.pagination?.pages || 1,
            total:      data?.pagination?.total || 0,
            onPageChange: setPage
          }}
        />
      </div>
    </div>
  )
}