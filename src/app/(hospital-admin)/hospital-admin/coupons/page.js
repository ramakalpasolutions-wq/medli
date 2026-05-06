// src/app/(hospital-admin)/hospital-admin/coupons/page.js
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Card from '@/components/ui/Card'
import { useToast } from '@/context/ToastContext'
import { Plus, Info } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function HospitalCoupons() {
  const toast = useToast()
  const [page,     setPage]     = useState(1)
  const [open,     setOpen]     = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({
    code: '', name: '', discountType: 'percent', discountValue: '',
    maxDiscountAmount: '', minOrderAmount: '', validFrom: '', validUntil: '',
    totalUsageLimit: '', perUserLimit: '1',
  })

  const { data, isLoading, mutate } = useSWR(
    `/api/coupons?page=${page}&limit=20&type=hospital`,
    fetcher
  )
  const coupons    = data?.coupons   || []
  const totalPages = data?.pagination?.totalPages || 1

  const handleSave = async () => {
    if (!form.code || !form.discountValue) { toast.error('Code and discount value are required'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/coupons', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          couponType:        'hospital',
          discountValue:     Number(form.discountValue),
          maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
          minOrderAmount:    form.minOrderAmount    ? Number(form.minOrderAmount)    : 0,
          totalUsageLimit:   form.totalUsageLimit   ? Number(form.totalUsageLimit)   : null,
          perUserLimit:      Number(form.perUserLimit) || 1,
          validFrom:         form.validFrom  || null,
          validUntil:        form.validUntil || null,
        }),
      })
      const json = await res.json()
      json.success ? toast.success('Coupon created') : toast.error(json.error)
      if (json.success) { setOpen(false); mutate() }
    } catch {
      toast.error('Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  const toggleCoupon = async (id) => {
    try {
      const res  = await fetch(`/api/coupons/${id}/toggle`, { method: 'PATCH', credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success('Coupon updated') : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed') }
  }

  const columns = [
    { key: 'code',          header: 'Code',     render: (v) => <span className="font-mono text-sm font-bold text-blue-600">{v}</span> },
    { key: 'name',          header: 'Name',     render: (v) => v || '—' },
    { key: 'discountType',  header: 'Type',     render: (v, row) => `${row.discountValue}${v === 'percent' ? '%' : ' Rs.'} off` },
    { key: 'currentUsageCount', header: 'Used', render: (v, row) => `${v || 0}${row.totalUsageLimit ? '/' + row.totalUsageLimit : ''}` },
    { key: 'isActive', header: 'Status', render: (v) => <Badge variant={v ? 'success' : 'danger'} size="sm">{v ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <button
          onClick={() => toggleCoupon(row.id)}
          className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${row.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
        >
          {row.isActive ? 'Disable' : 'Enable'}
        </button>
      ),
    },
  ]

  return (
    <div>
      <AdminHeader
        title="Coupons"
        subtitle="Hospital discount coupons"
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Coupons' }]}
        actions={<Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setOpen(true)}>Create Coupon</Button>}
      />

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>Hospital coupons discount the consultation fee. Platform fee is applied on the discounted amount.</p>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No coupons yet"
        emptyMessage="Create your first coupon"
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Create Hospital Coupon" size="md">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Coupon Code *" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" />
            <Input label="Coupon Name"   value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Summer offer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Discount Type</label>
              <div className="flex gap-2">
                {['percent', 'fixed'].map((t) => (
                  <button key={t} onClick={() => setForm((f) => ({ ...f, discountType: t }))}
                    className={form.discountType === t ? 'flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white' : 'flex-1 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-600'}>
                    {t === 'percent' ? 'Percent %' : 'Fixed Rs.'}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Discount Value *" type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === 'percent' ? '20' : '100'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min Order (Rs.)"     type="number" value={form.minOrderAmount}    onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} placeholder="0" />
            <Input label="Max Discount (Rs.)"  type="number" value={form.maxDiscountAmount}  onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valid From"  type="date" value={form.validFrom}  onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} />
            <Input label="Valid Until" type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Usage Limit" type="number" value={form.totalUsageLimit} onChange={(e) => setForm((f) => ({ ...f, totalUsageLimit: e.target.value }))} placeholder="Unlimited" />
            <Input label="Per User Limit"    type="number" value={form.perUserLimit}    onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))} placeholder="1" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} loading={saving}>Create Coupon</Button>
        </div>
      </Modal>
    </div>
  )
}