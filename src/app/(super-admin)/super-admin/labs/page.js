'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/ToastContext'
import { Search, CheckCircle, ToggleLeft } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function LabsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)
  const { data, isLoading, mutate } = useSWR(`/api/labs?${qs}`, fetcher)

  const doAction = async () => {
    setLoading(true)
    const { type, lab } = action
    try {
      const url = type === 'approve' ? `/api/labs/${lab.id}/approve` : `/api/labs/${lab.id}/activate`
      const res = await fetch(url, { method: 'PATCH', credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success(json.message) : toast.error(json.error)
      mutate()
    } catch { toast.error('Action failed') }
    setLoading(false)
    setAction(null)
  }

  const columns = [
    { key: 'name', header: 'Lab', render: (v, row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">{v?.charAt(0)}</div>
        <div>
          <p className="text-sm font-medium text-gray-800">{v}</p>
          <p className="text-xs text-gray-400">{row.address?.city || '—'}</p>
        </div>
      </div>
    )},
    { key: 'isApproved', header: 'Approved', render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Yes' : 'Pending'}</Badge> },
    { key: 'isActive', header: 'Active', render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'platformFeePercent', header: 'Fee %', render: (v) => `${v}%` },
    { key: 'actions', header: 'Actions', render: (_, row) => (
      <div className="flex gap-1.5">
        {!row.isApproved && <Button size="xs" variant="primary" leftIcon={<CheckCircle className="w-3 h-3" />} onClick={() => setAction({ type: 'approve', lab: row })}>Approve</Button>}
        <Button size="xs" variant={row.isActive ? 'danger' : 'outline'} leftIcon={<ToggleLeft className="w-3 h-3" />} onClick={() => setAction({ type: 'toggle', lab: row })}>
          {row.isActive ? 'Disable' : 'Enable'}
        </Button>
      </div>
    )},
  ]

  return (
    <div>
      <AdminHeader title="Labs" subtitle="Manage lab partners" breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Labs' }]} />
      <div className="mb-4">
        <Input placeholder="Search labs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} leftIcon={<Search className="w-4 h-4" />} className="w-72" />
      </div>
      <DataTable columns={columns} data={data?.labs || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
      <ConfirmModal open={!!action} onClose={() => setAction(null)} onConfirm={doAction} title={action?.type === 'approve' ? 'Approve Lab?' : 'Toggle Status?'} confirmText="Confirm" variant={action?.type === 'approve' ? 'success' : 'warning'} loading={loading} details={{ Name: action?.lab?.name }} />
    </div>
  )
}