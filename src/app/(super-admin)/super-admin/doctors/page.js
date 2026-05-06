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
import { Search, ShieldCheck, ShieldOff } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function DoctorsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)
  const { data, isLoading, mutate } = useSWR(`/api/doctors?${qs}`, fetcher)

  const doAction = async () => {
    setLoading(true)
    const { type, doctor } = action
    try {
      const url = type === 'verify' ? `/api/doctors/${doctor.id}/verify` : `/api/doctors/${doctor.id}/activate`
      const res = await fetch(url, { method: 'PATCH', credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success(json.message) : toast.error(json.error)
      mutate()
    } catch { toast.error('Action failed') }
    setLoading(false)
    setAction(null)
  }

  const columns = [
    { key: 'name', header: 'Doctor', render: (v, row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">{v?.charAt(0)}</div>
        <div>
          <p className="text-sm font-medium text-gray-800">{v}</p>
          <p className="text-xs text-gray-400">{row.specialization?.join(', ') || '—'}</p>
        </div>
      </div>
    )},
    { key: 'isVerified', header: 'Verified', render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Verified' : 'Pending'}</Badge> },
    { key: 'isActive', header: 'Active', render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'experience', header: 'Exp', render: (v) => v ? `${v} yrs` : '—' },
    { key: 'actions', header: 'Actions', render: (_, row) => (
      <div className="flex gap-1.5">
        {!row.isVerified && <Button size="xs" variant="primary" leftIcon={<ShieldCheck className="w-3 h-3" />} onClick={() => setAction({ type: 'verify', doctor: row })}>Verify</Button>}
        <Button size="xs" variant={row.isActive ? 'danger' : 'outline'} leftIcon={<ShieldOff className="w-3 h-3" />} onClick={() => setAction({ type: 'toggle', doctor: row })}>
          {row.isActive ? 'Disable' : 'Enable'}
        </Button>
      </div>
    )},
  ]

  return (
    <div>
      <AdminHeader title="Doctors" subtitle="Manage doctors" breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Doctors' }]} />
      <div className="mb-4">
        <Input placeholder="Search doctors..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} leftIcon={<Search className="w-4 h-4" />} className="w-72" />
      </div>
      <DataTable columns={columns} data={data?.doctors || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
      <ConfirmModal open={!!action} onClose={() => setAction(null)} onConfirm={doAction} title={action?.type === 'verify' ? 'Verify Doctor?' : 'Toggle Status?'} message="This action will be logged." confirmText="Confirm" variant={action?.type === 'verify' ? 'success' : 'warning'} loading={loading} details={{ Name: action?.doctor?.name }} />
    </div>
  )
}