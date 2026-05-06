'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function RegionalLabs() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR(`/api/labs?page=${page}&limit=20`, fetcher)

  const columns = [
    { key: 'name', header: 'Lab', render: (v) => <span className="font-medium">{v}</span> },
    { key: 'address', header: 'City', render: (v) => v?.city || '—' },
    { key: 'isApproved', header: 'Approved', render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm">{v ? 'Yes' : 'Pending'}</Badge> },
    { key: 'isActive', header: 'Active', render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge> },
  ]

  return (
    <div>
      <AdminHeader title="Labs" subtitle="Region labs (read-only)" />
      <DataTable columns={columns} data={data?.labs || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
    </div>
  )
}