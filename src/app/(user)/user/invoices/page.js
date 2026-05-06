'use client'

import useSWR from 'swr'
import { useState } from 'react'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { FileText, Download } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function InvoicesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR(`/api/invoices?page=${page}&limit=20`, fetcher)

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice #', render: (v) => <span className="font-mono text-xs font-bold">{v}</span> },
    { key: 'totalAmount', header: 'Amount', render: (v) => `₹${(v || 0).toFixed(2)}` },
    { key: 'type', header: 'Type', render: (v) => <Badge variant={v === 'credit_note' ? 'danger' : 'info'} size="sm">{v}</Badge> },
    { key: 'createdAt', header: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN') },
    { key: 'actions', header: '', render: (_, row) => (
      <Button size="xs" variant="ghost" leftIcon={<Download className="w-3 h-3" />}
        onClick={() => window.location.href = `/api/invoices/${row.id}/download`}>PDF</Button>
    )},
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Invoices</h1>
        {!isLoading && !data?.invoices?.length ? (
          <EmptyState icon={<FileText className="w-12 h-12" />} title="No invoices yet" message="Invoices will appear here after bookings" />
        ) : (
          <DataTable columns={columns} data={data?.invoices || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
        )}
      </div>
      <Footer />
    </div>
  )
}