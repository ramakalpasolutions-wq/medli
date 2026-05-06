'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar } from 'lucide-react'

const PRESETS = [
  { label: 'Today',       key: 'today' },
  { label: 'Yesterday',   key: 'yesterday' },
  { label: '7 Days',      key: 'last7' },
  { label: '30 Days',     key: 'last30' },
  { label: 'This Month',  key: 'thisMonth' },
  { label: 'Last Month',  key: 'lastMonth' },
  { label: 'This Year',   key: 'thisYear' },
  { label: 'Custom',      key: 'custom' },
]

export default function DateRangePicker({
  value     = { preset: 'last30', dateFrom: '', dateTo: '' },
  onChange,
  className = '',
}) {
  const { preset, dateFrom, dateTo } = value

  const handlePreset = (key) => {
    if (key === 'custom') {
      onChange({ preset: 'custom', dateFrom: dateFrom || '', dateTo: dateTo || '' })
    } else {
      onChange({ preset: key, dateFrom: '', dateTo: '' })
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => handlePreset(p.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            preset === p.key
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {p.label}
        </button>
      ))}

      <AnimatePresence>
        {preset === 'custom' && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{    opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onChange({ preset: 'custom', dateFrom: e.target.value, dateTo })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
              />
              <span className="text-gray-400 text-xs">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onChange({ preset: 'custom', dateFrom, dateTo: e.target.value })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}