// src/app/(lab-admin)/lab-admin/settings/page.js
'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { Save, Plus, X } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const CERTIFICATIONS = ['NABL', 'ISO 15189', 'ISO 9001', 'CAP', 'JCI']

export default function LabSettings() {
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const { data: labData, mutate } = useSWR('/api/labs?adminOnly=true', fetcher)
  const lab   = labData?.labs?.[0]
  const labId = lab?.id

  const [form, setForm] = useState({
    name:            '',
    contactPhone:    '',
    contactEmail:    '',
    certifications:  [],
    address: {
      line1:   '',
      city:    '',
      state:   '',
      pinCode: '',
    },
    homeCollection: {
      enabled:      false,
      areaCoverage: [],
    },
  })

  const [newPinCode, setNewPinCode] = useState('')

  // Populate form when lab data loads
  useEffect(() => {
    if (lab) {
      setForm({
        name:           lab.name           || '',
        contactPhone:   lab.contactPhone   || '',
        contactEmail:   lab.contactEmail   || '',
        certifications: lab.certifications || [],
        address: {
          line1:   lab.address?.line1   || '',
          city:    lab.address?.city    || '',
          state:   lab.address?.state   || '',
          pinCode: lab.address?.pinCode || '',
        },
        homeCollection: {
          enabled:      lab.homeCollection?.enabled      || false,
          areaCoverage: lab.homeCollection?.areaCoverage || [],
        },
      })
    }
  }, [lab])

  const toggleCertification = (cert) => {
    setForm((f) => ({
      ...f,
      certifications: f.certifications.includes(cert)
        ? f.certifications.filter((c) => c !== cert)
        : [...f.certifications, cert],
    }))
  }

  const addPinCode = () => {
    const pin = newPinCode.trim()
    if (!pin || pin.length !== 6) { toast.error('Enter a valid 6-digit PIN code'); return }
    if (form.homeCollection.areaCoverage.includes(pin)) { toast.error('PIN code already added'); return }
    setForm((f) => ({
      ...f,
      homeCollection: {
        ...f.homeCollection,
        areaCoverage: [...f.homeCollection.areaCoverage, pin],
      },
    }))
    setNewPinCode('')
  }

  const removePinCode = (pin) => {
    setForm((f) => ({
      ...f,
      homeCollection: {
        ...f.homeCollection,
        areaCoverage: f.homeCollection.areaCoverage.filter((p) => p !== pin),
      },
    }))
  }

  const save = async () => {
    if (!labId) { toast.error('Lab not found'); return }
    setSaving(true)
    try {
      const res  = await fetch(`/api/labs/${labId}`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name:           form.name,
          contactPhone:   form.contactPhone,
          contactEmail:   form.contactEmail,
          certifications: form.certifications,
          address:        form.address,
          homeCollection: {
            enabled:      form.homeCollection.enabled,
            areaCoverage: form.homeCollection.areaCoverage,
            slots:        lab?.homeCollection?.slots || [],
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Settings saved successfully')
        mutate()
      } else {
        toast.error(json.error || 'Failed to save settings')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AdminHeader
        title="Settings"
        subtitle="Lab configuration and profile"
        breadcrumbs={[{ label: 'Lab Admin' }, { label: 'Settings' }]}
        actions={
          <Button size="sm" leftIcon={<Save className="w-3.5 h-3.5" />} onClick={save} loading={saving}>
            Save Changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Basic Info */}
        <Card title="Basic Information">
          <div className="space-y-3">
            <Input
              label="Lab Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Contact Phone"
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              placeholder="+91 XXXXX XXXXX"
            />
            <Input
              label="Contact Email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              placeholder="lab@example.com"
            />
          </div>
        </Card>

        {/* Address */}
        <Card title="Address">
          <div className="space-y-3">
            <Input
              label="Street Address"
              value={form.address.line1}
              onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, line1: e.target.value } }))}
              placeholder="Building, Street"
            />
            <Input
              label="City"
              value={form.address.city}
              onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="State"
                value={form.address.state}
                onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, state: e.target.value } }))}
              />
              <Input
                label="PIN Code"
                value={form.address.pinCode}
                onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, pinCode: e.target.value } }))}
                maxLength={6}
              />
            </div>
          </div>
        </Card>

        {/* Certifications */}
        <Card title="Certifications">
          <div className="flex flex-wrap gap-2">
            {CERTIFICATIONS.map((cert) => (
              <button
                key={cert}
                onClick={() => toggleCertification(cert)}
                className={form.certifications.includes(cert)
                  ? 'px-3 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white transition-colors'
                  : 'px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'}
              >
                {form.certifications.includes(cert) ? '✓ ' : ''}{cert}
              </button>
            ))}
          </div>
          {form.certifications.length > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              Selected: {form.certifications.join(', ')}
            </p>
          )}
        </Card>

        {/* Home Collection */}
        <Card title="Home Collection">
          <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-800">Enable Home Collection</p>
                <p className="text-xs text-gray-400 mt-0.5">Allow patients to book home sample pickup</p>
              </div>
              <button
                onClick={() => setForm((f) => ({ ...f, homeCollection: { ...f.homeCollection, enabled: !f.homeCollection.enabled } }))}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.homeCollection.enabled ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${form.homeCollection.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Area coverage PIN codes */}
            {form.homeCollection.enabled && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Serviceable PIN Codes</p>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="6-digit PIN"
                    value={newPinCode}
                    onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="flex-1"
                  />
                  <Button size="md" variant="secondary" onClick={addPinCode} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add
                  </Button>
                </div>
                {form.homeCollection.areaCoverage.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {form.homeCollection.areaCoverage.map((pin) => (
                      <span
                        key={pin}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-mono rounded-lg"
                      >
                        {pin}
                        <button onClick={() => removePinCode(pin)} className="hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No PIN codes added yet</p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}