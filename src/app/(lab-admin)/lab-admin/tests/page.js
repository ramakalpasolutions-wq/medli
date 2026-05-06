// src/app/(lab-admin)/lab-admin/tests/page.js
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import { Plus, X, FlaskConical, Search } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const CATEGORIES = [
  'Blood Test', 'Urine Test', 'Thyroid', 'Diabetes', 'Liver', 'Kidney',
  'Lipid Profile', 'CBC', 'Vitamins', 'Hormones', 'Culture', 'Radiology', 'Other',
]

const emptyForm = {
  name: '', code: '', category: '', price: '', discountedPrice: '',
  sampleType: '', preparationInstructions: '',
  turnaroundTime: { value: '', unit: 'hours' },
  parameters: '',
}

export default function LabTestsPage() {
  const toast = useToast()

  const [search,      setSearch]      = useState('')
  const [catFilter,   setCatFilter]   = useState('all')
  const [panelOpen,   setPanelOpen]   = useState(false)
  const [editTest,    setEditTest]    = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [form,        setForm]        = useState(emptyForm)

  // ── Fetch lab ───────────────────────────────────────────────────────────────
  const { data: labData } = useSWR('/api/labs?adminOnly=true', fetcher)
  const labId = labData?.labs?.[0]?.id

  // ── Fetch tests scoped to this lab ──────────────────────────────────────────
  const { data: testsData, isLoading, mutate } = useSWR(
    labId ? `/api/labs/${labId}/tests` : null,
    fetcher
  )

  const allTests   = testsData?.tests || []
  const categories = ['all', ...new Set(allTests.map((t) => t.category).filter(Boolean))]

  const filtered = allTests.filter((t) => {
    const matchCat    = catFilter === 'all' || t.category === catFilter
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.code?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // ── Open add panel ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTest(null)
    setForm(emptyForm)
    setPanelOpen(true)
  }

  const openEdit = (test) => {
    setEditTest(test)
    setForm({
      name:                    test.name                 || '',
      code:                    test.code                 || '',
      category:                test.category             || '',
      price:                   String(test.price         || ''),
      discountedPrice:         String(test.discountedPrice || ''),
      sampleType:              test.sampleType            || '',
      preparationInstructions: test.preparationInstructions || '',
      turnaroundTime: {
        value: String(test.turnaroundTime?.value || ''),
        unit:  test.turnaroundTime?.unit || 'hours',
      },
      parameters: (test.parameters || []).join(', '),
    })
    setPanelOpen(true)
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Test name is required'); return }
    if (!form.price)        { toast.error('Price is required'); return }
    if (!labId)             { toast.error('Lab not found'); return }

    setSaving(true)
    try {
      const payload = {
        labId,
        name:            form.name.trim(),
        code:            form.code.trim()     || undefined,
        category:        form.category        || undefined,
        price:           Number(form.price),
        discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined,
        sampleType:      form.sampleType      || undefined,
        preparationInstructions: form.preparationInstructions || undefined,
        turnaroundTime:  form.turnaroundTime.value
          ? { value: Number(form.turnaroundTime.value), unit: form.turnaroundTime.unit }
          : undefined,
        parameters: form.parameters
          ? form.parameters.split(',').map((p) => p.trim()).filter(Boolean)
          : [],
      }

      const url    = editTest ? `/api/tests/${editTest.id}` : '/api/tests'
      const method = editTest ? 'PUT' : 'POST'

      const res  = await fetch(url, {
        method,
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(payload),
      })
      const json = await res.json()

      if (json.success) {
        toast.success(editTest ? 'Test updated' : 'Test added successfully')
        setPanelOpen(false)
        mutate()
      } else {
        toast.error(json.error || 'Failed to save test')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Deactivate ──────────────────────────────────────────────────────────────
  const handleDeactivate = async (testId) => {
    try {
      const res  = await fetch(`/api/tests/${testId}`, {
        method:      'DELETE',
        credentials: 'include',
      })
      const json = await res.json()
      json.success ? toast.success('Test deactivated') : toast.error(json.error)
      mutate()
    } catch {
      toast.error('Failed to deactivate test')
    }
  }

  return (
    <div>
      <AdminHeader
        title="Tests"
        subtitle="Manage lab test catalogue"
        breadcrumbs={[{ label: 'Lab Admin' }, { label: 'Tests' }]}
        actions={
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openAdd}>
            Add Test
          </Button>
        }
      />

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <Input
            placeholder="Search tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={catFilter === c
              ? 'px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-600 text-white whitespace-nowrap transition-colors'
              : 'px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 whitespace-nowrap transition-colors'}
          >
            {c === 'all' ? 'All Tests' : c}
          </button>
        ))}
      </div>

      {/* Test grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse" style={{ height: 140 }}>
              <div className="h-4 w-32 bg-gray-100 rounded mb-3" />
              <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="w-10 h-10 text-gray-300" />}
          title="No tests found"
          message={search ? 'Try a different search' : 'Add your first test'}
          action={
            <Button size="sm" onClick={openAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Test
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((test, i) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{test.name}</p>
                  {test.code && (
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{test.code}</p>
                  )}
                </div>
                {test.category && (
                  <Badge variant="info" size="sm" className="ml-2 flex-shrink-0">
                    {test.category}
                  </Badge>
                )}
              </div>

              <div className="space-y-1 mb-4">
                {test.sampleType && (
                  <p className="text-xs text-gray-500">🧪 Sample: {test.sampleType}</p>
                )}
                {test.turnaroundTime?.value && (
                  <p className="text-xs text-gray-500">
                    ⏱ TAT: {test.turnaroundTime.value} {test.turnaroundTime.unit}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {test.discountedPrice ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900">
                        Rs. {Number(test.discountedPrice).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        Rs. {Number(test.price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-gray-900">
                      Rs. {Number(test.price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(test)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeactivate(test.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit slide panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setPanelOpen(false)}
            />
            <motion.div
              initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">
                  {editTest ? 'Edit Test' : 'Add New Test'}
                </h3>
                <button onClick={() => setPanelOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <Input
                  label="Test Name *"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Complete Blood Count"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Test Code"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="CBC"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Price (Rs.) *"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="500"
                  />
                  <Input
                    label="Discounted Price"
                    type="number"
                    value={form.discountedPrice}
                    onChange={(e) => setForm((f) => ({ ...f, discountedPrice: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <Input
                  label="Sample Type"
                  value={form.sampleType}
                  onChange={(e) => setForm((f) => ({ ...f, sampleType: e.target.value }))}
                  placeholder="Blood, Urine, Swab..."
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="TAT Value"
                    type="number"
                    value={form.turnaroundTime.value}
                    onChange={(e) => setForm((f) => ({ ...f, turnaroundTime: { ...f.turnaroundTime, value: e.target.value } }))}
                    placeholder="24"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">TAT Unit</label>
                    <select
                      value={form.turnaroundTime.unit}
                      onChange={(e) => setForm((f) => ({ ...f, turnaroundTime: { ...f.turnaroundTime, unit: e.target.value } }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
                <Input
                  label="Parameters (comma separated)"
                  value={form.parameters}
                  onChange={(e) => setForm((f) => ({ ...f, parameters: e.target.value }))}
                  placeholder="Haemoglobin, WBC, RBC..."
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Preparation Instructions
                  </label>
                  <textarea
                    value={form.preparationInstructions}
                    onChange={(e) => setForm((f) => ({ ...f, preparationInstructions: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    placeholder="Fast for 8 hours before the test..."
                  />
                </div>
              </div>

              <div className="p-5 border-t border-gray-100">
                <Button className="w-full" onClick={handleSave} loading={saving}>
                  {editTest ? 'Update Test' : 'Add Test'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}