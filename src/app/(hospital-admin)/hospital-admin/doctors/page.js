// src/app/(hospital-admin)/hospital-admin/doctors/page.js
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useToast } from '@/context/ToastContext'
import { Plus, X, Save } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const SPECIALIZATIONS = ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Neurology', 'Dermatology', 'ENT', 'Ophthalmology', 'Psychiatry']

export default function HospitalDoctors() {
  const toast = useToast()
  const [panelOpen, setPanelOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({
    name: '', specialization: [], experience: '', consultationFee: { online: '', offline: '' },
    consultationTypes: ['offline'],
  })

  const { data: hospitalData } = useSWR('/api/hospitals?adminOnly=true', fetcher)
  const hospitalId = hospitalData?.hospitals?.[0]?.id

  const { data, isLoading, mutate } = useSWR(
    hospitalId ? `/api/hospitals/${hospitalId}/doctors` : null,
    fetcher
  )
  const doctors = Array.isArray(data) ? data : (data?.doctors || [])

  const toggleSpec = (spec) => {
    setForm((f) => ({
      ...f,
      specialization: f.specialization.includes(spec)
        ? f.specialization.filter((s) => s !== spec)
        : [...f.specialization, spec],
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Doctor name is required'); return }
    if (!hospitalId) { toast.error('Hospital not found'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/doctors', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          hospitalId,
          name:              form.name,
          specialization:    form.specialization,
          experience:        Number(form.experience) || 0,
          consultationTypes: form.consultationTypes,
          consultationFee: {
            online:  Number(form.consultationFee.online)  || 0,
            offline: Number(form.consultationFee.offline) || 0,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Doctor added successfully')
        mutate()
        setPanelOpen(false)
        setForm({ name: '', specialization: [], experience: '', consultationFee: { online: '', offline: '' }, consultationTypes: ['offline'] })
      } else {
        toast.error(json.error || 'Failed to add doctor')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'name',           header: 'Name',           render: (v) => <span className="font-medium text-gray-800">Dr. {v}</span> },
    { key: 'specialization', header: 'Specialty',       render: (v) => <span className="text-xs text-gray-600">{(v || []).join(', ') || '—'}</span> },
    { key: 'experience',     header: 'Experience',      render: (v) => v ? `${v} yrs` : '—' },
    { key: 'isVerified',     header: 'Verified',        render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm">{v ? 'Verified' : 'Pending'}</Badge> },
    { key: 'isActive',       header: 'Status',          render: (v) => <Badge variant={v ? 'success' : 'danger'} size="sm">{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'consultationFee', header: 'Fee (Offline)', render: (v) => v?.offline ? `Rs. ${v.offline}` : '—' },
  ]

  return (
    <div>
      <AdminHeader
        title="Doctors"
        subtitle="Manage hospital doctors"
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Doctors' }]}
        actions={
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setPanelOpen(true)}>
            Add Doctor
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={doctors}
        loading={isLoading}
        emptyTitle="No doctors yet"
        emptyMessage="Add your first doctor"
      />

      {/* Slide panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setPanelOpen(false)}
            />
            <motion.div
              initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Add New Doctor</h3>
                <button onClick={() => setPanelOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <Input label="Doctor Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                <Input label="Experience (years)" type="number" value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="0" />

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALIZATIONS.map((spec) => (
                      <button
                        key={spec}
                        onClick={() => toggleSpec(spec)}
                        className={form.specialization.includes(spec)
                          ? 'px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600 text-white'
                          : 'px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200'}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Consultation Types</label>
                  <div className="flex gap-3">
                    {['offline', 'online'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm((f) => ({
                          ...f,
                          consultationTypes: f.consultationTypes.includes(t)
                            ? f.consultationTypes.filter((x) => x !== t)
                            : [...f.consultationTypes, t],
                        }))}
                        className={form.consultationTypes.includes(t)
                          ? 'px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 border-2 border-blue-500 text-blue-700'
                          : 'px-4 py-2 rounded-xl text-sm font-medium bg-gray-50 border-2 border-gray-200 text-gray-500'}
                      >
                        {t === 'offline' ? 'In-Person' : 'Online'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Offline Fee (Rs.)" type="number" value={form.consultationFee.offline}
                    onChange={(e) => setForm((f) => ({ ...f, consultationFee: { ...f.consultationFee, offline: e.target.value } }))} />
                  <Input label="Online Fee (Rs.)" type="number" value={form.consultationFee.online}
                    onChange={(e) => setForm((f) => ({ ...f, consultationFee: { ...f.consultationFee, online: e.target.value } }))} />
                </div>
              </div>

              <div className="p-5 border-t border-gray-100">
                <Button className="w-full" onClick={handleSave} loading={saving} leftIcon={<Save className="w-4 h-4" />}>
                  Save Doctor
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}