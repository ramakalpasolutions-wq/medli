'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Tabs from '@/components/ui/Tabs'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes cp-spin{to{transform:rotate(360deg)}}`

function FInput({ label, ...props }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>}
      <input {...props} onFocus={(e) => { setF(true); props.onFocus?.(e) }} onBlur={(e) => { setF(false); props.onBlur?.(e) }}
        style={{
          padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', width: '100%', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function FSelect({ label, children, ...props }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <select {...props} onFocus={() => setF(true)} onBlur={() => setF(false)}
          style={{
            width: '100%', padding: '10px 30px 10px 12px', fontSize: 13, fontFamily: 'inherit',
            borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
            background: '#fff', color: '#0f172a', outline: 'none',
            appearance: 'none', cursor: 'pointer', boxSizing: 'border-box',
          }}>
          {children}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#94a3b8', pointerEvents: 'none' }}>▼</span>
      </div>
    </div>
  )
}

function CreateBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: 'none',
        background: h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s ease',
      }}>
      + Create
    </button>
  )
}

function SaveBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading} onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '10px 20px', borderRadius: 12, border: 'none',
        background: isLoading ? '#e2e8f0' : h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: isLoading ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s ease',
      }}>
      {isLoading && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'cp-spin .7s linear infinite', display: 'inline-block' }} />}
      Create Coupon
    </button>
  )
}

function ToggleBtn({ isActive, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '4px 9px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
        background: h ? 'rgba(99,102,241,0.12)' : 'transparent', color: '#6366f1', transition: 'background .12s ease',
      }}>
      ⇄
    </button>
  )
}

const TABS = [
  { key: 'all',      label: 'All'      },
  { key: 'hospital', label: 'Hospital' },
  { key: 'lab',      label: 'Lab'      },
  { key: 'platform', label: 'Platform' },
]

export default function CouponsPage() {
  const [tab,        setTab]        = useState('all')
  const [page,       setPage]       = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [form,       setForm]       = useState({ code: '', couponType: 'platform', discountType: 'percent', discountValue: '', maxDiscountAmount: '', minOrderAmount: '' })
  const [saving,     setSaving]     = useState(false)
  const toast = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  const { data, isLoading, mutate } = useSWR(`/api/coupons?${qs}`, fetcher)
  const filtered = tab === 'all' ? (data?.coupons || []) : (data?.coupons || []).filter((c) => c.couponType === tab)

  const toggleCoupon = async (id) => {
    try {
      const res  = await fetch(`/api/coupons/${id}/toggle`, { method: 'PATCH', credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success(json.message) : toast.error(json.error)
      mutate()
    } catch { toast.error('Failed') }
  }

  const createCoupon = async () => {
    setSaving(true)
    try {
      const res  = await fetch('/api/coupons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) { toast.success('Coupon created'); mutate(); setShowCreate(false) }
      else toast.error(json.error)
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  const COUPON_TYPE_BADGE = { platform: 'purple', hospital: 'info', lab: 'success' }

  const columns = [
    { key: 'code',              header: 'Code',    render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#6366f1' }}>{v}</span> },
    { key: 'couponType',        header: 'Type',    render: (v) => <Badge variant={COUPON_TYPE_BADGE[v]||'neutral'} size="sm">{v}</Badge> },
    { key: 'discountType',      header: 'Discount',render: (v,row) => <span style={{ fontSize: 12 }}>{v === 'percent' ? `${row.discountValue}%` : `₹${row.discountValue}`}</span> },
    { key: 'currentUsageCount', header: 'Used',    render: (v,row) => <span style={{ fontSize: 12 }}>{v}/{row.totalUsageLimit || '∞'}</span> },
    { key: 'isActive',          header: 'Active',  render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm" dot>{v ? 'Active' : 'Off'}</Badge> },
    { key: 'actions',           header: '',        render: (_, row) => <ToggleBtn isActive={row.isActive} onClick={() => toggleCoupon(row.id)} /> },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Coupons" subtitle="Manage coupons"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Coupons' }]}
        actions={<CreateBtn onClick={() => setShowCreate(true)} />}
      />
      <Tabs tabs={TABS} activeTab={tab} onChange={(k) => { setTab(k); setPage(1) }} style={{ marginBottom: 16 }} />
      <DataTable columns={columns} data={filtered} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} emptyTitle="No coupons found" />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Coupon" size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => setShowCreate(false)} style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <SaveBtn onClick={createCoupon} loading={saving} />
          </div>
        }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FInput label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FSelect label="Discount Type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="percent">Percent %</option>
              <option value="fixed">Fixed ₹</option>
            </FSelect>
            <FInput label="Value" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder="20" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FInput label="Max Discount" type="number" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} placeholder="Optional" />
            <FInput label="Min Order"    type="number" value={form.minOrderAmount}    onChange={(e) => setForm({ ...form, minOrderAmount:    e.target.value })} placeholder="0" />
          </div>
        </div>
      </Modal>
    </>
  )
}