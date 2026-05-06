'use client'

import { useState } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { Save, Plus, X } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AvailabilityPage() {
  const toast = useToast()
  const [slots, setSlots] = useState(DAYS.map((_, i) => ({
    dayOfWeek: i,
    enabled: i >= 1 && i <= 5,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 10,
  })))
  const [exceptions, setExceptions] = useState([])
  const [newException, setNewException] = useState({ date: '', reason: '' })
  const [consultTypes, setConsultTypes] = useState({ offline: true, online: false })

  const toggleDay = (i) => {
    const n = [...slots]
    n[i] = { ...n[i], enabled: !n[i].enabled }
    setSlots(n)
  }

  const updateSlot = (i, field, value) => {
    const n = [...slots]
    n[i] = { ...n[i], [field]: value }
    setSlots(n)
  }

  const addException = () => {
    if (!newException.date) return
    setExceptions([...exceptions, { ...newException }])
    setNewException({ date: '', reason: '' })
  }

  const save = () => toast.info('Availability save coming soon')

  return (
    <div>
      <AdminHeader title="Availability" subtitle="Manage your schedule" actions={<Button size="sm" leftIcon={<Save className="w-3.5 h-3.5" />} onClick={save}>Save All</Button>} />

      {/* Consultation Types */}
      <Card title="Consultation Types" className="mb-6">
        <div className="flex gap-4">
          {[
            { key: 'offline', label: 'In-Person', color: 'bg-blue-100 border-blue-300 text-blue-700' },
            { key: 'online', label: 'Online (Video)', color: 'bg-green-100 border-green-300 text-green-700' },
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => setConsultTypes({ ...consultTypes, [type.key]: !consultTypes[type.key] })}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                consultTypes[type.key] ? type.color : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              {consultTypes[type.key] ? '✓ ' : ''}{type.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Weekly Schedule */}
      <Card title="Weekly Schedule" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slots.map((slot, i) => (
            <div key={i} className={`p-4 rounded-xl border transition-all ${slot.enabled ? 'bg-white border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-800">{DAYS[i]}</span>
                <button onClick={() => toggleDay(i)} className={`w-10 h-5 rounded-full transition-colors relative ${slot.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${slot.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {slot.enabled && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input label="Start" type="time" value={slot.startTime} onChange={(e) => updateSlot(i, 'startTime', e.target.value)} className="flex-1" />
                    <Input label="End" type="time" value={slot.endTime} onChange={(e) => updateSlot(i, 'endTime', e.target.value)} className="flex-1" />
                  </div>
                  <p className="text-xs text-gray-400">
                    ~{Math.floor(((parseInt(slot.endTime) - parseInt(slot.startTime)) * 60) / slot.slotDuration)} slots ({slot.slotDuration}min each)
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Exception Dates */}
      <Card title="Exception Dates">
        <div className="flex gap-2 mb-3">
          <Input type="date" value={newException.date} onChange={(e) => setNewException({ ...newException, date: e.target.value })} className="flex-1" />
          <Input placeholder="Reason" value={newException.reason} onChange={(e) => setNewException({ ...newException, reason: e.target.value })} className="flex-1" />
          <Button size="md" variant="secondary" onClick={addException} leftIcon={<Plus className="w-3 h-3" />}>Add</Button>
        </div>
        {exceptions.length === 0 ? (
          <p className="text-xs text-gray-400">No exceptions added</p>
        ) : (
          <div className="space-y-2">
            {exceptions.map((ex, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{ex.date}</p>
                  <p className="text-xs text-gray-400">{ex.reason || 'No reason'}</p>
                </div>
                <button onClick={() => setExceptions(exceptions.filter((_, j) => j !== i))} className="p-1 hover:bg-red-100 rounded-lg"><X className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}