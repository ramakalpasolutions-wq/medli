'use client'

import { useState } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { Save } from 'lucide-react'

export default function FeesPage() {
  const toast = useToast()
  const [hospitalFee, setHospitalFee] = useState('10')
  const [labFee,      setLabFee]      = useState('8')
  const [saving,      setSaving]      = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all([
        fetch('/api/settings', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            key:      'platform_fee_defaults',
            value:    { hospital: parseFloat(hospitalFee), lab: parseFloat(labFee) },
            category: 'finance',
          }),
        }),
      ])
      toast.success('Fee defaults saved')
    } catch {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  return (
    <div>
      <AdminHeader
        title="Platform Fees"
        subtitle="Manage default platform fee percentages"
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Fees' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Default Fee Rates"
          action={
            <Button
              size="xs"
              leftIcon={<Save className="w-3 h-3" />}
              onClick={save}
              loading={saving}
            >
              Save
            </Button>
          }
        >
          <div className="space-y-4">
            <Input
              label="Hospital / Online Consultation Fee (%)"
              type="number"
              value={hospitalFee}
              onChange={(e) => setHospitalFee(e.target.value)}
              hint="Applied on discounted consultation fee"
            />
            <Input
              label="Lab Test Fee (%)"
              type="number"
              value={labFee}
              onChange={(e) => setLabFee(e.target.value)}
              hint="Applied on discounted lab test fee"
            />
          </div>
        </Card>

        <Card title="How Fees Work">
          <div className="space-y-3 text-sm text-gray-600">
            {[
              ['Base Fee',        'Doctor consultation or lab test price'],
              ['Entity Coupon',   'Discount applied by hospital/lab (optional)'],
              ['Discounted Fee',  'Base Fee − Entity Coupon'],
              ['Platform Fee',    'Platform Fee % × Discounted Fee'],
              ['GST',             '18% × Platform Fee'],
              ['Subtotal',        'Discounted Fee + Platform Fee + GST'],
              ['Platform Coupon', 'Further discount by MEDLI (optional)'],
              ['Total Amount',    'Amount charged to patient'],
            ].map(([label, desc]) => (
              <div key={label} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="font-semibold text-gray-800 w-36 flex-shrink-0">{label}</span>
                <span className="text-gray-500">{desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}