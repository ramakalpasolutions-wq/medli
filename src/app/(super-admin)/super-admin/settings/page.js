'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { Save } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function SettingCard({ title, settingKey, category, fields }) {
  const { data } = useSWR(`/api/settings?key=${settingKey}`, fetcher)
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => { if (data?.value) setValues(data.value) }, [data])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ key: settingKey, value: values, category }) })
      const json = await res.json()
      json.success ? toast.success('Saved') : toast.error(json.error)
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  return (
    <Card title={title} action={<Button size="xs" variant="primary" leftIcon={<Save className="w-3 h-3" />} onClick={save} loading={saving}>Save</Button>}>
      <div className="space-y-3">
        {fields.map((f) => (
          <Input key={f.key} label={f.label} type={f.type || 'text'} value={values[f.key] || ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
        ))}
      </div>
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <div>
      <AdminHeader title="Platform Settings" subtitle="Configure platform" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingCard title="Branding" settingKey="branding" category="general" fields={[{ key: 'platformName', label: 'Platform Name' }, { key: 'supportEmail', label: 'Support Email' }, { key: 'supportPhone', label: 'Support Phone' }]} />
        <SettingCard title="Slot Rules" settingKey="slot_rules" category="booking" fields={[{ key: 'defaultSlotDuration', label: 'Default Slot Duration (min)', type: 'number' }, { key: 'maxReschedules', label: 'Max Reschedules', type: 'number' }]} />
        <SettingCard title="Cancellation Policy" settingKey="cancellation_policy" category="booking" fields={[{ key: 'above24h', label: 'Above 24h (%)', type: 'number' }, { key: '12to24h', label: '12-24h (%)', type: 'number' }, { key: '4to12h', label: '4-12h (%)', type: 'number' }, { key: 'below4h', label: 'Below 4h (%)', type: 'number' }]} />
        <SettingCard title="GST Configuration" settingKey="gst_config" category="finance" fields={[{ key: 'gstin', label: 'MEDLI GSTIN' }, { key: 'gstRate', label: 'GST Rate (%)', type: 'number' }, { key: 'hsnConsultation', label: 'HSN (Consultation)' }, { key: 'hsnLab', label: 'HSN (Lab)' }]} />
      </div>
    </div>
  )
}