'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Tabs from '@/components/ui/Tabs'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useToast } from '@/context/ToastContext'
import { Plus, ToggleLeft } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function CouponsPage() {
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ code: '', couponType: 'platform', discountType: 'percent', discountValue: '', maxDiscountAmount: '', minOrderAmount: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  const { data, isLoading, mutate } = useSWR(`/api/coupons?${qs}`, fetcher)

  const filtered = tab === 'all' ? (data?.coupons || []) : (data?.coupons || []).filter((c) => c.couponType === tab)

  const toggleCoupon = async (id) => {
    try {
      const res = await fetch(`/api/coupons/${id}/toggle`, { method: 'PATCH', credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success(json.message) : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed') }
  }

  const createCoupon = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(form),
      })
      const json = await res.json()
      json.success ? (toast.success('Coupon created'), mutate(), setShowCreate(false)) : toast.error(json.error)
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  const columns = [
    { key: 'code', header: 'Code', render: (v) => <span className="font-mono text-xs font-bold">{v}</span> },
    { key: 'couponType', header: 'Type', render: (v) => <Badge variant={v === 'platform' ? 'purple' : v === 'hospital' ? 'info' : 'success'} size="sm">{v}</Badge> },
    { key: 'discountType', header: 'Discount', render: (v, row) => v === 'percent' ? `${row.discountValue}%` : `₹${row.discountValue}` },
    { key: 'currentUsageCount', header: 'Used', render: (v, row) => `${v}/${row.totalUsageLimit || '∞'}` },
    { key: 'isActive', header: 'Active', render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm" dot>{v ? 'Active' : 'Off'}</Badge> },
    { key: 'actions', header: '', render: (_, row) => (
      <Button size="xs" variant="ghost" onClick={() => toggleCoupon(row.id)}><ToggleLeft className="w-3.5 h-3.5" /></Button>
    )},
  ]

  const tabs = [
    { key: 'all', label: 'All' }, { key: 'hospital', label: 'Hospital' }, { key: 'lab', label: 'Lab' }, { key: 'platform', label: 'Platform' },
  ]

  return (
    <div>
      <AdminHeader title="Coupons" subtitle="Manage coupons" actions={<Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreate(true)}>Create</Button>} />
      <Tabs tabs={tabs} activeTab={tab} onChange={(k) => { setTab(k); setPage(1) }} className="mb-4" />
      <DataTable columns={columns} data={filtered} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Coupon" size="md" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={createCoupon} loading={saving}>Create</Button></div>}>
        <div className="space-y-4">
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Discount Type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}><option value="percent">Percent</option><option value="fixed">Fixed</option></Select>
            <Input label="Value" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Max Discount" type="number" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} />
            <Input label="Min Order" type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}