'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials:'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes inv-spin{to{transform:rotate(360deg)}}`

function DownloadBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading}
      onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:'none',
        background:h?'rgba(99,102,241,0.1)':'transparent',
        color:h?'#6366f1':'#94a3b8', fontSize:12, fontWeight:600, cursor:isLoading?'not-allowed':'pointer',
        transition:'all .12s ease', opacity:isLoading?.6:1,
      }}>
      {isLoading
        ? <span style={{ width:12,height:12,borderRadius:'50%',border:'2px solid #94a3b8',borderTopColor:'transparent',animation:'inv-spin .7s linear infinite',display:'inline-block' }} />
        : '⬇'}
      PDF
    </button>
  )
}

export default function HospitalInvoices() {
  const toast   = useToast()
  const mounted = useMounted()
  const [page, setPage] = useState(1)
  const [dlId, setDlId] = useState(null)

  const { data, isLoading } = useSWR(`/api/invoices?page=${page}&limit=20`, fetcher)
  const invoices   = data?.invoices   || []
  const totalPages = data?.pagination?.totalPages || 1

  const handleDownload = async (invoiceId, invoiceNumber) => {
    setDlId(invoiceId)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/download`, { credentials:'include' })
      if (!res.ok) { toast.error('Download failed'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href=url; a.download=`MEDLI-${invoiceNumber}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
    finally { setDlId(null) }
  }

  const columns = [
    { key:'invoiceNumber', header:'Invoice #', render:(v) => <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'#334155' }}>{v}</span> },
    { key:'totalAmount',   header:'Amount',    render:(v) => <span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>₹{Number(v||0).toLocaleString('en-IN')}</span> },
    { key:'type',          header:'Type',      render:(v) => <Badge variant={v==='credit_note'?'danger':'info'} size="sm">{v}</Badge> },
    { key:'createdAt',     header:'Date',      render:(v) => mounted?<span style={{ fontSize:12, color:'#64748b' }}>{new Date(v).toLocaleDateString('en-IN',{dateStyle:'medium'})}</span>:'—' },
    { key:'actions',       header:'',          render:(_,row) => <DownloadBtn onClick={() => handleDownload(row.id,row.invoiceNumber)} loading={dlId===row.id} /> },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Invoices" subtitle="Hospital invoices and receipts" breadcrumbs={[{label:'Hospital Admin'},{label:'Invoices'}]} />
      <DataTable columns={columns} data={invoices} loading={isLoading}
        page={page} totalPages={totalPages} onPageChange={setPage}
        emptyTitle="No invoices yet" emptyMessage="Invoices appear after payments" />
    </>
  )
}