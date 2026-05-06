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
import { Search, CheckCircle, XCircle, ToggleLeft } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function HospitalsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState(null) // { type, hospital }
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)
  const { data, isLoading, mutate } = useSWR(`/api/hospitals?${qs}`, fetcher)

  const pendingCount = (data?.hospitals || []).filter((h) => !h.isApproved).length

  const performAction = async () => {
    setLoading(true)
    const { type, hospital } = action
    try {
      let url, method
      if (type === 'approve') { url = `/api/hospitals/${hospital.id}/approve`; method = 'PATCH' }
      else if (type === 'toggle') { url = `/api/hospitals/${hospital.id}/activate`; method = 'PATCH' }

      const res = await fetch(url, { method, credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success(json.message) : toast.error(json.error)
      mutate()
    } catch { toast.error('Action failed') }
    setLoading(false)
    setAction(null)
  }

  const columns = [
    { key: 'name', header: 'Hospital', render: (v, row) => (
      <div className="flex items-center gap-2.5">
        {row.images?.logo ? (
          <img src={row.images.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">{v?.charAt(0)}</div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-800">{v}</p>
          <p className="text-xs text-gray-400">{row.address?.city || '—'}</p>
        </div>
      </div>
    )},
    { key: 'isApproved', header: 'Approved', render: (v) => (
      <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Yes' : 'Pending'}</Badge>
    )},
    { key: 'isActive', header: 'Active', render: (v) => (
      <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: 'platformFeePercent', header: 'Fee %', render: (v) => `${v}%` },
    { key: 'createdAt', header: 'Added', render: (v) => new Date(v).toLocaleDateString('en-IN') },
    { key: 'actions', header: 'Actions', render: (_, row) => (
      <div className="flex gap-1.5">
        {!row.isApproved && (
          <Button size="xs" variant="primary" leftIcon={<CheckCircle className="w-3 h-3" />}
            onClick={() => setAction({ type: 'approve', hospital: row })}>Approve</Button>
        )}
        <Button size="xs" variant={row.isActive ? 'danger' : 'outline'} leftIcon={<ToggleLeft className="w-3 h-3" />}
          onClick={() => setAction({ type: 'toggle', hospital: row })}>
          {row.isActive ? 'Disable' : 'Enable'}
        </Button>
      </div>
    )},
  ]

  return (
    <div>
      <AdminHeader
        title="Hospitals"
        subtitle="Manage hospital partners"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Hospitals' }]}
        actions={pendingCount > 0 && <Badge variant="warning" size="lg" dot pulse>{pendingCount} Pending</Badge>}
      />

      <div className="mb-4">
        <Input placeholder="Search hospitals..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} leftIcon={<Search className="w-4 h-4" />} className="w-72" />
      </div>

      <DataTable columns={columns} data={data?.hospitals || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />

      <ConfirmModal
        open={!!action}
        onClose={() => setAction(null)}
        onConfirm={performAction}
        title={action?.type === 'approve' ? 'Approve Hospital?' : action?.hospital?.isActive ? 'Disable Hospital?' : 'Enable Hospital?'}
        message={action?.type === 'approve' ? 'This hospital will become visible on the platform.' : 'Toggle hospital active status.'}
        confirmText={action?.type === 'approve' ? 'Approve' : 'Confirm'}
        variant={action?.type === 'approve' ? 'success' : 'warning'}
        loading={loading}
        details={{ Name: action?.hospital?.name, City: action?.hospital?.address?.city || '—' }}
      />
    </div>
  )
}