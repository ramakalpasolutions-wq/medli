'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Download } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function InvoicesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR(`/api/invoices?page=${page}&limit=20`, fetcher)

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice #', render: (v) => <span className="font-mono text-xs font-medium">{v}</span> },
    { key: 'totalAmount', header: 'Amount', render: (v) => `₹${(v || 0).toFixed(2)}` },
    { key: 'type', header: 'Type', render: (v) => <Badge variant={v === 'credit_note' ? 'danger' : 'info'} size="sm">{v}</Badge> },
    { key: 'createdAt', header: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN') },
    { key: 'actions', header: '', render: (_, row) => (
      <Button size="xs" variant="ghost" leftIcon={<Download className="w-3 h-3" />} onClick={() => window.location.href = `/api/invoices/${row.id}/download`}>PDF</Button>
    )},
  ]

  return (
    <div>
      <AdminHeader title="Invoices" subtitle="All invoices" breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Invoices' }]} />
      <DataTable columns={columns} data={data?.invoices || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
    </div>
  )
}