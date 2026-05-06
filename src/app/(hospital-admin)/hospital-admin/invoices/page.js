// src/app/(hospital-admin)/hospital-admin/invoices/page.js
'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { Download } from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function HospitalInvoices() {
  const toast   = useToast()
  const mounted = useMounted()
  const [page,  setPage] = useState(1)
  const [dlId,  setDlId] = useState(null)

  const { data, isLoading } = useSWR(`/api/invoices?page=${page}&limit=20`, fetcher)
  const invoices   = data?.invoices   || []
  const totalPages = data?.pagination?.totalPages || 1

  const handleDownload = async (invoiceId, invoiceNumber) => {
    setDlId(invoiceId)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/download`, { credentials: 'include' })
      if (!res.ok) { toast.error('Download failed'); return }
      const blob   = await res.blob()
      const url    = URL.createObjectURL(blob)
      const a      = document.createElement('a')
      a.href       = url
      a.download   = `MEDLI-${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    } finally {
      setDlId(null)
    }
  }

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice #', render: (v) => <span className="font-mono text-xs font-bold">{v}</span> },
    { key: 'totalAmount',   header: 'Amount',    render: (v) => `Rs. ${Number(v || 0).toLocaleString('en-IN')}` },
    { key: 'type',          header: 'Type',      render: (v) => <Badge variant={v === 'credit_note' ? 'danger' : 'info'} size="sm">{v}</Badge> },
    {
      key: 'createdAt', header: 'Date',
      render: (v) => mounted ? new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—',
    },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <Button
          size="xs"
          variant="ghost"
          leftIcon={dlId === row.id
            ? <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            : <Download className="w-3 h-3" />
          }
          onClick={() => handleDownload(row.id, row.invoiceNumber)}
          disabled={dlId === row.id}
        >
          PDF
        </Button>
      ),
    },
  ]

  return (
    <div>
      <AdminHeader title="Invoices" subtitle="Hospital invoices and receipts" breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Invoices' }]} />
      <DataTable
        columns={columns}
        data={invoices}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No invoices yet"
        emptyMessage="Invoices appear after payments"
      />
    </div>
  )
}