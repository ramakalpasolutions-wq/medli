// src/app/(hospital-admin)/hospital-admin/settings/page.js
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { Save } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function HospitalSettings() {
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const { data: hospitalData, mutate } = useSWR('/api/hospitals?adminOnly=true', fetcher)
  const hospital = hospitalData?.hospitals?.[0]
  const hospitalId = hospital?.id

  const [form, setForm] = useState({
    name:         hospital?.name         || '',
    contactPhone: hospital?.contactPhone || '',
    contactEmail: hospital?.contactEmail || '',
    departments:  (hospital?.departments || []).join(', '),
    address: {
      line1:   hospital?.address?.line1   || '',
      city:    hospital?.address?.city    || '',
      state:   hospital?.address?.state   || '',
      pinCode: hospital?.address?.pinCode || '',
    },
  })

  const save = async () => {
    if (!hospitalId) { toast.error('Hospital not found'); return }
    setSaving(true)
    try {
      const res  = await fetch(`/api/hospitals/${hospitalId}`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name:         form.name,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          departments:  form.departments.split(',').map((d) => d.trim()).filter(Boolean),
          address:      form.address,
        }),
      })
      const json = await res.json()
      json.success ? toast.success('Settings saved') : toast.error(json.error)
      if (json.success) mutate()
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AdminHeader
        title="Settings"
        subtitle="Hospital configuration"
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Settings' }]}
        actions={<Button size="sm" leftIcon={<Save className="w-3.5 h-3.5" />} onClick={save} loading={saving}>Save Changes</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Basic Information">
          <div className="space-y-3">
            <Input label="Hospital Name"  value={form.name}         onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="Phone"          value={form.contactPhone}  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
            <Input label="Email"          value={form.contactEmail}  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
            <Input label="Departments (comma separated)" value={form.departments} onChange={(e) => setForm((f) => ({ ...f, departments: e.target.value }))} placeholder="Cardiology, Orthopedics, ..." />
          </div>
        </Card>

        <Card title="Address">
          <div className="space-y-3">
            <Input label="Street Address" value={form.address.line1}   onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, line1: e.target.value } }))} />
            <Input label="City"           value={form.address.city}    onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))} />
            <Input label="State"          value={form.address.state}   onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
            <Input label="PIN Code"       value={form.address.pinCode} onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, pinCode: e.target.value } }))} maxLength={6} />
          </div>
        </Card>
      </div>
    </div>
  )
}