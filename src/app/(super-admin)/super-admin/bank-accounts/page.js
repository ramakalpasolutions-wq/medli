'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { useToast } from '@/context/ToastContext'
import { ShieldCheck } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function BankAccountsPage() {
  const [page,       setPage]       = useState(1)
  const [entityType, setEntityType] = useState('')
  const [verifying,  setVerifying]  = useState(null)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (entityType) qs.set('entityType', entityType)

  const { data, isLoading, mutate } = useSWR(
    `/api/bank-accounts?${qs}`,
    fetcher
  )

  const verify = async (id) => {
    setVerifying(id)
    try {
      const res  = await fetch(`/api/bank-accounts/${id}/verify`, {
        method:      'POST',
        credentials: 'include',
      })
      const json = await res.json()
      json.success
        ? toast.success(json.message)
        : toast.error(json.error)
      mutate()
    } catch {
      toast.error('Verification failed')
    }
    setVerifying(null)
  }

  const columns = [
    {
      key:    'accountHolderName',
      header: 'Account Holder',
      render: (v) => (
        <span className="font-medium text-gray-800">{v || '—'}</span>
      ),
    },
    {
      key:    'entityType',
      header: 'Type',
      render: (v) => <Badge variant="info" size="sm">{v}</Badge>,
    },
    {
      key:    'bankName',
      header: 'Bank',
      render: (v) => v || '—',
    },
    {
      key:    'accountNumber',
      header: 'Account',
      render: (v) => (
        <span className="font-mono text-xs">
          {v ? `****${v.slice(-4)}` : '—'}
        </span>
      ),
    },
    {
      key:    'ifscCode',
      header: 'IFSC',
      render: (v) => (
        <span className="font-mono text-xs">{v || '—'}</span>
      ),
    },
    {
      key:    'isVerified',
      header: 'Verified',
      render: (v) => (
        <Badge variant={v ? 'success' : 'warning'} size="sm" dot>
          {v ? 'Verified' : 'Pending'}
        </Badge>
      ),
    },
    {
      key:    'actions',
      header: '',
      render: (_, row) =>
        !row.isVerified && (
          <Button
            size="xs"
            variant="outline"
            loading={verifying === row.id}
            leftIcon={<ShieldCheck className="w-3 h-3" />}
            onClick={() => verify(row.id)}
          >
            Verify
          </Button>
        ),
    },
  ]

  return (
    <div>
      <AdminHeader
        title="Bank Accounts"
        subtitle="Manage provider bank accounts"
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Bank Accounts' },
        ]}
      />

      <div className="mb-4">
        <Select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1) }}
          className="w-44"
          placeholder="All Types"
        >
          <option value="hospital">Hospital</option>
          <option value="lab">Lab</option>
          <option value="user">User</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        loading={isLoading}
        page={page}
        totalPages={Math.ceil((data?.length || 0) / 20)}
        onPageChange={setPage}
        emptyTitle="No bank accounts found"
        emptyMessage="Bank accounts will appear here once added"
      />
    </div>
  )
}