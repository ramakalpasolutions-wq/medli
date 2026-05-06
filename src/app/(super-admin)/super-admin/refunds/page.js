// src/app/(super-admin)/super-admin/refunds/page.js

'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils/helpers'

const fetcher = (url, token) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(d => d.data)

// 1Pay RF code → display
const RF_CODES = {
  RF000: { label: 'Refunded',             variant: 'success' },
  RF001: { label: 'Txn Not Found',        variant: 'danger'  },
  RF002: { label: 'Txn Failed',           variant: 'danger'  },
  RF003: { label: 'Already Refunded',     variant: 'warning' },
  RF004: { label: 'Pending Settlement',   variant: 'warning' },
  RF005: { label: 'Invalid Amount',       variant: 'danger'  }
}

function RefundStatusBadge({ status, onePayRefundStatus }) {
  // Show 1Pay RF code if available
  if (onePayRefundStatus && RF_CODES[onePayRefundStatus]) {
    const rf = RF_CODES[onePayRefundStatus]
    return (
      <div className="flex flex-col gap-1">
        <Badge variant={rf.variant}>{rf.label}</Badge>
        <span className="text-xs text-gray-400 font-mono">{onePayRefundStatus}</span>
      </div>
    )
  }

  // Fall back to general status
  const map = {
    pending:    'warning',
    processing: 'info',
    completed:  'success',
    failed:     'danger'
  }

  return (
    <Badge variant={map[status] || 'neutral'}>
      {status}
    </Badge>
  )
}

export default function RefundsPage() {
  const { accessToken } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [page,      setPage]      = useState(1)
  const [retrying,  setRetrying]  = useState(null)

  const statusFilter = activeTab === 'all' ? '' : activeTab

  const params = new URLSearchParams({
    page,
    ...(statusFilter && { status: statusFilter })
  })

  const { data, isLoading, mutate } = useSWR(
    accessToken
      ? [`/api/refunds?${params}`, accessToken]
      : null,
    ([url, token]) => fetcher(url, token)
  )

  const handleRetry = async (refundId) => {
    setRetrying(refundId)
    try {
      const res = await fetch(`/api/refunds/${refundId}/retry`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const result = await res.json()

      if (!result.success) {
        toast.error(result.error || 'Retry failed')
        return
      }

      toast.success('Refund retry initiated')
      mutate()
    } catch {
      toast.error('Failed to retry refund')
    } finally {
      setRetrying(null)
    }
  }

  const tabs = [
    { id: 'all',        label: 'All'        },
    { id: 'pending',    label: 'Pending'    },
    { id: 'completed',  label: 'Completed'  },
    { id: 'failed',     label: 'Failed'     }
  ]

  const columns = [
    { key: 'refundNumber', label: 'Refund #' },
    {
      key:    'bookingId',
      label:  'Booking',
      render: (val) => (
        <span className="font-mono text-xs">{val}</span>
      )
    },
    {
      key:    'refundAmount',
      label:  'Amount',
      render: (val) => (
        <span className="font-semibold text-gray-900">
          {val ? formatCurrency(val) : '-'}
        </span>
      )
    },
    {
      key:    'refundPercent',
      label:  'Percent',
      render: (val) => val ? `${val}%` : '-'
    },
    {
      key:    'onePayRefundRequestId',
      label:  '1Pay Ref ID',
      render: (val) => (
        <span className="font-mono text-xs text-gray-500">{val || '-'}</span>
      )
    },
    {
      key:    'status',
      label:  '1Pay Status',
      render: (val, row) => (
        <RefundStatusBadge
          status={val}
          onePayRefundStatus={row.onePayRefundStatus}
        />
      )
    },
    {
      key:    'reason',
      label:  'Reason',
      render: (val) => (
        <span className="text-xs text-gray-500 max-w-32 truncate block">
          {val || '-'}
        </span>
      )
    },
    {
      key:    'createdAt',
      label:  'Date',
      render: (val) => new Date(val).toLocaleDateString('en-IN')
    },
    {
      key:    'id',
      label:  'Action',
      render: (val, row) =>
        row.status === 'failed' ? (
          <Button
            variant="ghost"
            size="xs"
            loading={retrying === val}
            onClick={() => handleRetry(val)}
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        ) : null
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refunds</h1>
        <p className="text-sm text-gray-500 mt-1">
          1Pay refund requests and status
        </p>
      </div>

      {/* RF Code Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-700 mb-2">
          1Pay Refund Status Codes
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(RF_CODES).map(([code, info]) => (
            <div key={code} className="flex items-center gap-1">
              <Badge variant={info.variant} size="sm">
                {code}
              </Badge>
              <span className="text-xs text-gray-500">{info.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={data?.refunds || []}
          loading={isLoading}
          pagination={{
            page:        data?.pagination?.page  || 1,
            pages:       data?.pagination?.pages || 1,
            total:       data?.pagination?.total || 0,
            onPageChange:setPage
          }}
        />
      </div>
    </div>
  )
}