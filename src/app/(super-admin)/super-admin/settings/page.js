'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { Save } from 'lucide-react'

const fetcher = async (url) => {
  const r = await fetch(url, { credentials: 'include' })
  const j = await r.json()
  if (!j.success) throw new Error(j.error || 'Failed to load')
  return j.data
}

/* ─── Defaults for each setting key ──────────────────────────────────── */
const DEFAULTS = {
  branding: {
    platformName: 'MEDLI',
    supportEmail: 'support@medli.in',
    supportPhone: '+91 ',
  },
  slot_rules: {
    defaultSlotDuration: 10,
    maxReschedules:      2,
  },
  cancellation_policy: {
    above24h: 100,
    '12to24h': 75,
    '4to12h':  50,
    below4h:   0,
  },
  gst_config: {
    gstin:           '',
    gstRate:         18,
    hsnConsultation: '9993',
    hsnLab:          '9993',
  },
}

function SettingCard({ title, settingKey, category, fields }) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/settings?key=${settingKey}`,
    fetcher
  )
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [dirty,  setDirty]  = useState(false)
  const toast = useToast()

  /* ✅ Hydrate values — merge DB value with defaults */
  useEffect(() => {
    if (data) {
      const defaults = DEFAULTS[settingKey] || {}
      const dbValue  = data?.value || {}
      setValues({ ...defaults, ...dbValue })
      setDirty(false)
    }
  }, [data, settingKey])

  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      // ✅ Coerce numeric fields properly before saving
      const cleanValues = { ...values }
      fields.forEach((f) => {
        if (f.type === 'number' && cleanValues[f.key] !== '' && cleanValues[f.key] !== undefined) {
          cleanValues[f.key] = Number(cleanValues[f.key])
        }
      })

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: settingKey, value: cleanValues, category }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`${title} saved`)
        mutate()
        setDirty(false)
      } else {
        toast.error(json.error || 'Save failed')
      }
    } catch (err) {
      console.error('[SAVE]', err)
      toast.error('Network error')
    }
    setSaving(false)
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {dirty && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px',
              borderRadius: 100, background: '#fef3c7', color: '#92400e',
            }}>Unsaved</span>
          )}
        </div>
      }
      action={
        <Button
          size="xs"
          variant="primary"
          leftIcon={<Save className="w-3 h-3" />}
          onClick={save}
          loading={saving}
          disabled={!dirty}
        >
          Save
        </Button>
      }
    >
      {error && (
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: '#fef2f2', border: '1px solid #fecaca',
          color: '#dc2626', fontSize: 12, marginBottom: 12,
        }}>
          ⚠️ {error.message}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map((f) => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{
                width: 100, height: 12, borderRadius: 6,
                background: 'linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9)',
                backgroundSize: '200% 100%',
                animation: 'sa-shim 1.4s linear infinite',
              }} />
              <div style={{
                height: 38, borderRadius: 10,
                background: 'linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9)',
                backgroundSize: '200% 100%',
                animation: 'sa-shim 1.4s linear infinite',
              }} />
            </div>
          ))}
          <style>{`@keyframes sa-shim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              type={f.type || 'text'}
              value={values[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => handleChange(f.key, e.target.value)}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <div>
      <AdminHeader
        title="Platform Settings"
        subtitle="Configure platform-wide rules, branding, and finances"
        breadcrumbs={[
          { label: 'Super Admin', href: '/super-admin/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingCard
          title="🎨 Branding"
          settingKey="branding"
          category="general"
          fields={[
            { key: 'platformName', label: 'Platform Name',  placeholder: 'MEDLI' },
            { key: 'supportEmail', label: 'Support Email',  placeholder: 'support@medli.in' },
            { key: 'supportPhone', label: 'Support Phone',  placeholder: '+91 9000000000' },
          ]}
        />

        <SettingCard
          title="🕐 Slot Rules"
          settingKey="slot_rules"
          category="booking"
          fields={[
            { key: 'defaultSlotDuration', label: 'Default Slot Duration (min)', type: 'number' },
            { key: 'maxReschedules',      label: 'Max Reschedules per Booking', type: 'number' },
          ]}
        />

        <SettingCard
          title="❌ Cancellation Policy"
          settingKey="cancellation_policy"
          category="booking"
          fields={[
            { key: 'above24h', label: 'Refund % — Above 24h before',  type: 'number' },
            { key: '12to24h',  label: 'Refund % — 12 to 24 hours',    type: 'number' },
            { key: '4to12h',   label: 'Refund % — 4 to 12 hours',     type: 'number' },
            { key: 'below4h',  label: 'Refund % — Below 4 hours',     type: 'number' },
          ]}
        />

        <SettingCard
          title="🧾 GST Configuration"
          settingKey="gst_config"
          category="finance"
          fields={[
            { key: 'gstin',           label: 'MEDLI GSTIN',       placeholder: '29ABCDE1234F1Z5' },
            { key: 'gstRate',         label: 'GST Rate (%)',      type: 'number' },
            { key: 'hsnConsultation', label: 'HSN (Consultation)', placeholder: '9993' },
            { key: 'hsnLab',          label: 'HSN (Lab Services)', placeholder: '9993' },
          ]}
        />
      </div>
    </div>
  )
}