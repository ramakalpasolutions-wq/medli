'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function DlBtn({ href }) {
  const [h, setH] = useState(false)
  return (
    <a href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '5px 10px', borderRadius: 8, border: 'none',
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600, textDecoration: 'none',
        transition: 'background .13s ease',
      }}>
      ⬇ PDF
    </a>
  )
}

export default function InvoicesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR(`/api/invoices?page=${page}&limit=20`, fetcher)

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice #', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>{v}</span> },
    { key: 'totalAmount',   header: 'Amount',    render: (v) => <span style={{ fontSize: 13, fontWeight: 600 }}>₹{(v || 0).toFixed(2)}</span> },
    { key: 'type',          header: 'Type',      render: (v) => <Badge variant={v === 'credit_note' ? 'danger' : 'info'} size="sm">{v}</Badge> },
    { key: 'createdAt',     header: 'Date',      render: (v) => <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(v).toLocaleDateString('en-IN')}</span> },
    { key: 'actions',       header: '',          render: (_, row) => <DlBtn href={`/api/invoices/${row.id}/download`} /> },
  ]

  return (
    <>
      <AdminHeader title="Invoices" subtitle="All invoices"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Invoices' }]} />
      <DataTable columns={columns} data={data?.invoices || []} loading={isLoading}
        page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
    </>
  )
}