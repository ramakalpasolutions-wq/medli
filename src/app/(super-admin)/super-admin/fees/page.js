'use client'

import { useState } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import { useToast } from '@/context/ToastContext'

const KF = `@keyframes fee-spin{to{transform:rotate(360deg)}}`

function FInput({ label, hint, ...props }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>}
      <input {...props}
        onFocus={(e) => { setF(true); props.onFocus?.(e) }}
        onBlur={(e)  => { setF(false); props.onBlur?.(e) }}
        style={{
          padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', width: '100%', boxSizing: 'border-box',
        }}
      />
      {hint && <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{hint}</p>}
    </div>
  )
}

function SaveBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading} onMouseEnter={() => !isLoading && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 10, border: 'none',
        background: isLoading ? '#e2e8f0' : h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: isLoading ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all .15s ease',
      }}>
      {isLoading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'fee-spin .7s linear infinite', display: 'inline-block' }} />}
      💾 Save
    </button>
  )
}

function SCard({ title, action, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
          {title && <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>}
          {action}
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

const FEE_STEPS = [
  ['Base Fee',        'Doctor consultation or lab test price'],
  ['Entity Coupon',   'Discount applied by hospital/lab (optional)'],
  ['Discounted Fee',  'Base Fee − Entity Coupon'],
  ['Platform Fee',    'Platform Fee % × Discounted Fee'],
  ['GST',             '18% × Platform Fee'],
  ['Subtotal',        'Discounted Fee + Platform Fee + GST'],
  ['Platform Coupon', 'Further discount by MEDLI (optional)'],
  ['Total Amount',    'Amount charged to patient'],
]

export default function FeesPage() {
  const toast = useToast()
  const [hospitalFee, setHospitalFee] = useState('10')
  const [labFee,      setLabFee]      = useState('8')
  const [saving,      setSaving]      = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ key: 'platform_fee_defaults', value: { hospital: parseFloat(hospitalFee), lab: parseFloat(labFee) }, category: 'finance' }),
      })
      toast.success('Fee defaults saved')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Platform Fees" subtitle="Manage default platform fee percentages"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Fees' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
        <SCard title="Default Fee Rates" action={<SaveBtn onClick={save} loading={saving} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FInput label="Hospital / Online Fee (%)" type="number" value={hospitalFee}
              onChange={(e) => setHospitalFee(e.target.value)} hint="Applied on discounted consultation fee" />
            <FInput label="Lab Test Fee (%)" type="number" value={labFee}
              onChange={(e) => setLabFee(e.target.value)} hint="Applied on discounted lab test fee" />
          </div>
        </SCard>

        <SCard title="How Fees Work">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FEE_STEPS.map(([label, desc]) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', width: 140, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
        </SCard>
      </div>
    </>
  )
}