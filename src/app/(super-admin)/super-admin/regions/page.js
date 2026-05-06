'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { useToast } from '@/context/ToastContext'
import { Plus } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function RegionsPage() {
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', states: '', cities: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR(`/api/regions?page=${page}&limit=20`, fetcher)

  const createRegion = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/regions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ name: form.name, states: form.states.split(',').map((s) => s.trim()).filter(Boolean), cities: form.cities.split(',').map((s) => s.trim()).filter(Boolean) }),
      })
      const json = await res.json()
      if (json.success) { toast.success('Region created'); mutate(); setShowCreate(false); setForm({ name: '', states: '', cities: '' }) }
      else toast.error(json.error)
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  const columns = [
    { key: 'name', header: 'Region', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'states', header: 'States', render: (v) => (v || []).join(', ') || '—' },
    { key: 'cities', header: 'Cities', render: (v) => (v || []).slice(0, 3).join(', ') + ((v || []).length > 3 ? '...' : '') || '—' },
    { key: 'isActive', header: 'Status', render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Active' : 'Inactive'}</Badge> },
  ]

  return (
    <div>
      <AdminHeader title="Regions" subtitle="Manage regions" actions={<Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreate(true)}>Add Region</Button>} />
      <DataTable columns={columns} data={data?.regions || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Region" size="sm" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={createRegion} loading={saving}>Create</Button></div>}>
        <div className="space-y-4">
          <Input label="Region Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="States (comma-separated)" value={form.states} onChange={(e) => setForm({ ...form, states: e.target.value })} />
          <Input label="Cities (comma-separated)" value={form.cities} onChange={(e) => setForm({ ...form, cities: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}