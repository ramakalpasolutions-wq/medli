'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

const fetcher = async (url) => {
  const r = await fetch(url, { credentials: 'include' })
  const j = await r.json()
  if (!j.success) throw new Error(j.error || 'Failed to load coupons')
  return j.data
}

const KF = `@keyframes cp-spin { to { transform: rotate(360deg) } }`

function CInput({ label, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>
      )}
      <input
        {...props}
        value={props.value ?? ''}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        style={{
          padding: '10px 12px',
          fontSize: 13,
          fontFamily: 'inherit',
          borderRadius: 12,
          boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff',
          color: '#0f172a',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
          width: '100%',
        }}
      />
    </div>
  )
}

function CreateBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 16px',
        borderRadius: 12,
        border: 'none',
        background: h
          ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: h ? '0 6px 20px rgba(99,102,241,0.45)' : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
      }}
    >
      + Create Coupon
    </button>
  )
}

function ViewBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '4px 9px',
        borderRadius: 7,
        border: 'none',
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background .13s ease',
      }}
    >
      👁 View
    </button>
  )
}

function TypeToggle({ value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
        Discount Type
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ key: 'percent', label: 'Percent %' }, { key: 'fixed', label: 'Fixed ₹' }].map((t) => (
          <TypeBtn key={t.key} label={t.label} active={value === t.key} onClick={() => onChange(t.key)} />
        ))}
      </div>
    </div>
  )
}

function TypeBtn({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1,
        padding: '9px',
        borderRadius: 10,
        border: 'none',
        background: active
          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
          : h ? '#e2e8f0' : '#f1f5f9',
        color: active ? '#fff' : '#64748b',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        transition: 'all .12s ease',
      }}
    >
      {label}
    </button>
  )
}

function ModalBtns({ onCancel, onSave, saving }) {
  const [sh, setSh] = useState(false)
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
      <button
        onClick={onCancel}
        style={{
          flex: 1,
          padding: '11px',
          borderRadius: 12,
          border: '1.5px solid #e2e8f0',
          background: '#fff',
          color: '#475569',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        onMouseEnter={() => setSh(true)}
        onMouseLeave={() => setSh(false)}
        style={{
          flex: 1,
          padding: '11px',
          borderRadius: 12,
          border: 'none',
          background: saving
            ? '#e2e8f0'
            : sh ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: saving ? '#94a3b8' : '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'all .15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {saving && (
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: '#fff',
              animation: 'cp-spin .7s linear infinite',
              display: 'inline-block',
            }}
          />
        )}
        Create Coupon
      </button>
    </div>
  )
}

function ToggleBtn({ isActive, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 9px',
        borderRadius: 7,
        border: 'none',
        cursor: 'pointer',
        background: h
          ? (isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)')
          : 'transparent',
        color: isActive ? '#ef4444' : '#10b981',
        transition: 'all .12s ease',
      }}
    >
      {isActive ? 'Disable' : 'Enable'}
    </button>
  )
}

function CouponDetail({ coupon: c }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))',
          borderRadius: 16,
          border: '1px solid rgba(99,102,241,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            flexShrink: 0,
          }}
        >
          🏷️
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#6366f1', margin: 0, fontFamily: 'monospace' }}>
            {c.code}
          </p>
          {c.name && (
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{c.name}</p>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge variant={c.isActive ? 'success' : 'danger'} size="sm">
              {c.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="info" size="sm">{c.couponType}</Badge>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        <div style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#16a34a', margin: '0 0 4px', fontWeight: 600 }}>Discount</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#15803d', margin: 0 }}>
            {c.discountValue}{c.discountType === 'percent' ? '%' : ' ₹'}
          </p>
        </div>
        {c.maxDiscountAmount && (
          <div style={{ padding: '12px 14px', background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#ea580c', margin: '0 0 4px', fontWeight: 600 }}>Max Discount</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#c2410c', margin: 0 }}>
              ₹{Number(c.maxDiscountAmount).toLocaleString('en-IN')}
            </p>
          </div>
        )}
        <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>Min Order</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            ₹{Number(c.minOrderAmount || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>Usage</p>
        </div>
        <div style={{ padding: '4px 0' }}>
          {[
            { l: 'Used', v: `${c.currentUsageCount || 0} times` },
            { l: 'Total Limit', v: c.totalUsageLimit ? String(c.totalUsageLimit) : 'Unlimited' },
            { l: 'Per User Limit', v: String(c.perUserLimit || 1) },
            { l: 'Valid From', v: c.validFrom ? new Date(c.validFrom).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'No limit' },
            { l: 'Valid Until', v: c.validUntil ? new Date(c.validUntil).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'No expiry' },
          ].map((row) => (
            <div
              key={row.l}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 16px',
                borderBottom: '1px solid #f8fafc',
              }}
            >
              <span style={{ fontSize: 12, color: '#64748b' }}>{row.l}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{row.v}</span>
            </div>
          ))}
        </div>
      </div>

      {c.totalUsageLimit && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Usage</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
              {c.currentUsageCount || 0} / {c.totalUsageLimit}
            </span>
          </div>
          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 4,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                width: `${Math.min(100, ((c.currentUsageCount || 0) / c.totalUsageLimit) * 100)}%`,
                transition: 'width .5s ease',
              }}
            />
          </div>
        </div>
      )}

      {c.description && (
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', border: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 4px' }}>Description</p>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{c.description}</p>
        </div>
      )}

      <div
        style={{
          padding: '8px 14px',
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: '#94a3b8' }}>Coupon ID</span>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{c.id}</span>
      </div>
    </div>
  )
}

export default function HospitalCoupons() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    discountType: 'percent',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderAmount: '',
    validFrom: '',
    validUntil: '',
    totalUsageLimit: '',
    perUserLimit: '1',
  })

  const { data, isLoading, mutate } = useSWR(
    `/api/coupons?page=${page}&limit=20&couponType=hospital`,
    fetcher
  )

  const coupons = data?.coupons || []
  const totalPages = data?.pagination?.totalPages || 1

  const handleSave = async () => {
    if (!form.code || !form.discountValue) {
      toast.error('Code and discount value are required')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          couponType: 'hospital',
          discountValue: Number(form.discountValue),
          maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
          totalUsageLimit: form.totalUsageLimit ? Number(form.totalUsageLimit) : null,
          perUserLimit: Number(form.perUserLimit) || 1,
          validFrom: form.validFrom || null,
          validUntil: form.validUntil || null,
        }),
      })

      const json = await res.json()

      if (json.success) {
        toast.success('Coupon created')
        setOpen(false)
        await mutate()
        setForm({
          code: '',
          name: '',
          discountType: 'percent',
          discountValue: '',
          maxDiscountAmount: '',
          minOrderAmount: '',
          validFrom: '',
          validUntil: '',
          totalUsageLimit: '',
          perUserLimit: '1',
        })
      } else {
        toast.error(json.error || 'Failed to create coupon')
      }
    } catch {
      toast.error('Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  const toggleCoupon = async (id) => {
    try {
      const res = await fetch(`/api/coupons/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      })
      const json = await res.json()
      json.success ? toast.success('Coupon updated') : toast.error(json.error)
      await mutate()
    } catch {
      toast.error('Failed')
    }
  }

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (v) => <span style={{ fontSize: 13, color: '#475569' }}>{v || '—'}</span>,
    },
    {
      key: 'discountType',
      header: 'Discount',
      render: (v, row) => (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
          {row.discountValue}{v === 'percent' ? '%' : ' ₹'} off
        </span>
      ),
    },
    {
      key: 'currentUsageCount',
      header: 'Used',
      render: (v, row) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {v || 0}{row.totalUsageLimit ? `/${row.totalUsageLimit}` : ''}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (v) => (
        <Badge variant={v ? 'success' : 'danger'} size="sm">
          {v ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <ViewBtn onClick={() => setViewItem(row)} />
          <ToggleBtn isActive={row.isActive} onClick={() => toggleCoupon(row.id)} />
        </div>
      ),
    },
  ]

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Coupons"
        subtitle="Hospital discount coupons"
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Coupons' }]}
        actions={<CreateBtn onClick={() => setOpen(true)} />}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 14,
          padding: '12px 16px',
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
        <p style={{ fontSize: 13, color: '#6366f1', margin: 0, lineHeight: 1.6 }}>
          Hospital coupons discount the consultation fee. Platform fee is applied on the discounted amount.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No coupons yet"
        emptyMessage="Create your first coupon using the button above"
      />

      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Coupon Details"
        size="md"
      >
        {viewItem && <CouponDetail coupon={viewItem} />}
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Hospital Coupon" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <CInput
              label="Coupon Code *"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="SAVE20"
            />
            <CInput
              label="Coupon Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Summer offer"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <TypeToggle value={form.discountType} onChange={(t) => setForm((f) => ({ ...f, discountType: t }))} />
            <CInput
              label="Discount Value *"
              type="number"
              value={form.discountValue}
              onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
              placeholder={form.discountType === 'percent' ? '20' : '100'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <CInput
              label="Min Order (₹)"
              type="number"
              value={form.minOrderAmount}
              onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
              placeholder="0"
            />
            <CInput
              label="Max Discount (₹)"
              type="number"
              value={form.maxDiscountAmount}
              onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <CInput
              label="Valid From"
              type="date"
              value={form.validFrom}
              onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
            />
            <CInput
              label="Valid Until"
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <CInput
              label="Total Usage Limit"
              type="number"
              value={form.totalUsageLimit}
              onChange={(e) => setForm((f) => ({ ...f, totalUsageLimit: e.target.value }))}
              placeholder="Unlimited"
            />
            <CInput
              label="Per User Limit"
              type="number"
              value={form.perUserLimit}
              onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))}
              placeholder="1"
            />
          </div>

          <ModalBtns onCancel={() => setOpen(false)} onSave={handleSave} saving={saving} />
        </div>
      </Modal>
    </>
  )
}