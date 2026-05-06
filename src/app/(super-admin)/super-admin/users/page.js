'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { Search } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function useDebounce(fn, ms = 400) {
  const [timer, setTimer] = useState(null)
  return useCallback((...args) => {
    if (timer) clearTimeout(timer)
    setTimer(setTimeout(() => fn(...args), ms))
  }, [fn, ms, timer])
}

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [viewUser, setViewUser] = useState(null)
  const [blockUser, setBlockUser] = useState(null)
  const [blocking, setBlocking] = useState(false)
  const toast = useToast()

  const debounceSearch = useDebounce((v) => { setSearchQ(v); setPage(1) })

  const qs = new URLSearchParams({ page, limit: 20 })
  if (searchQ) qs.set('search', searchQ)
  if (role) qs.set('role', role)
  if (status) qs.set('isBlocked', status === 'blocked' ? 'true' : 'false')

  const { data, isLoading, mutate } = useSWR(`/api/users?${qs}`, fetcher)

  const handleBlock = async () => {
    setBlocking(true)
    try {
      const res = await fetch(`/api/users/${blockUser.id}/block`, { method: 'PATCH', credentials: 'include' })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message)
        mutate()
      } else {
        toast.error(json.error)
      }
    } catch { toast.error('Failed to update user') }
    setBlocking(false)
    setBlockUser(null)
  }

  const columns = [
    { key: 'name', header: 'User', render: (v, row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
          {v?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{v}</p>
          <p className="text-xs text-gray-400">{row.email || row.phone}</p>
        </div>
      </div>
    )},
    { key: 'role', header: 'Role', render: (v) => <Badge variant="info" size="sm">{v?.replace('_', ' ')}</Badge> },
    { key: 'isBlocked', header: 'Status', render: (v) => (
      <Badge variant={v ? 'danger' : 'success'} size="sm" dot>{v ? 'Blocked' : 'Active'}</Badge>
    )},
    { key: 'createdAt', header: 'Joined', render: (v) => new Date(v).toLocaleDateString('en-IN') },
    { key: 'actions', header: 'Actions', render: (_, row) => (
      <div className="flex gap-1.5">
        <Button size="xs" variant="ghost" onClick={() => setViewUser(row)}>View</Button>
        <Button size="xs" variant={row.isBlocked ? 'outline' : 'danger'} onClick={() => setBlockUser(row)}>
          {row.isBlocked ? 'Unblock' : 'Block'}
        </Button>
      </div>
    )},
  ]

  return (
    <div>
      <AdminHeader title="Users" subtitle="Manage platform users" breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Users' }]} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); debounceSearch(e.target.value) }}
          leftIcon={<Search className="w-4 h-4" />}
          className="w-64"
        />
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} className="w-40">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="doctor">Doctor</option>
          <option value="hospital_admin">Hospital Admin</option>
          <option value="lab_admin">Lab Admin</option>
          <option value="regional_manager">Regional Manager</option>
          <option value="super_admin">Super Admin</option>
        </Select>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="w-36">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.users || []}
        loading={isLoading}
        page={page}
        totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage}
        emptyTitle="No users found"
      />

      {/* View Modal */}
      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="User Details" size="sm">
        {viewUser && (
          <div className="space-y-3">
            {Object.entries({ Name: viewUser.name, Email: viewUser.email || '—', Phone: viewUser.phone || '—', Role: viewUser.role, Verified: viewUser.isVerified ? 'Yes' : 'No', Status: viewUser.isBlocked ? 'Blocked' : 'Active', Joined: new Date(viewUser.createdAt).toLocaleDateString('en-IN') }).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-500">{k}</span>
                <span className="text-xs font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Block Confirm */}
      <ConfirmModal
        open={!!blockUser}
        onClose={() => setBlockUser(null)}
        onConfirm={handleBlock}
        title={blockUser?.isBlocked ? 'Unblock User?' : 'Block User?'}
        message={blockUser?.isBlocked ? 'This user will regain access to the platform.' : 'This user will lose access to all platform features.'}
        confirmText={blockUser?.isBlocked ? 'Unblock' : 'Block'}
        variant={blockUser?.isBlocked ? 'info' : 'danger'}
        loading={blocking}
        details={{ Name: blockUser?.name, Role: blockUser?.role, Email: blockUser?.email || blockUser?.phone }}
      />
    </div>
  )
}