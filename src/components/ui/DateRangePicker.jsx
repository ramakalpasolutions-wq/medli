'use client'

import { useState } from 'react'

const PRESETS = [
  { label: 'Today',      key: 'today'     },
  { label: 'Yesterday',  key: 'yesterday' },
  { label: '7 Days',     key: 'last7'     },
  { label: '30 Days',    key: 'last30'    },
  { label: 'This Month', key: 'thisMonth' },
  { label: 'Last Month', key: 'lastMonth' },
  { label: 'This Year',  key: 'thisYear'  },
  { label: 'Custom',     key: 'custom'    },
]

export default function DateRangePicker({
  value    = { preset: 'last30', dateFrom: '', dateTo: '' },
  onChange,
  style: extraStyle = {},
}) {
  const { preset, dateFrom, dateTo } = value
  const [customVisible, setCustomVisible] = useState(preset === 'custom')

  const handlePreset = (key) => {
    if (key === 'custom') {
      setCustomVisible(true)
      onChange({ preset: 'custom', dateFrom: dateFrom || '', dateTo: dateTo || '' })
    } else {
      setCustomVisible(false)
      onChange({ preset: key, dateFrom: '', dateTo: '' })
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      ...extraStyle,
    }}>
      {PRESETS.map((p) => (
        <PresetBtn
          key={p.key}
          label={p.label}
          active={preset === p.key}
          onClick={() => handlePreset(p.key)}
        />
      ))}

      {/* Custom date inputs */}
      {customVisible && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
          marginLeft: 2,
        }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>📅</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onChange({ preset: 'custom', dateFrom: e.target.value, dateTo })}
            style={{
              fontSize: 12,
              padding: '5px 10px',
              borderRadius: 8,
              border: '1.5px solid #e2e8f0',
              outline: 'none',
              color: '#334155',
              background: '#fff',
              fontFamily: 'inherit',
            }}
          />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onChange({ preset: 'custom', dateFrom, dateTo: e.target.value })}
            style={{
              fontSize: 12,
              padding: '5px 10px',
              borderRadius: 8,
              border: '1.5px solid #e2e8f0',
              outline: 'none',
              color: '#334155',
              background: '#fff',
              fontFamily: 'inherit',
            }}
          />
        </div>
      )}
    </div>
  )
}

function PresetBtn({ label, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '5px 12px',
        borderRadius: 8,
        border: 'none',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        background: active
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          : hover ? '#e2e8f0' : '#f1f5f9',
        color: active ? '#fff' : '#64748b',
        boxShadow: active ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
        transform: active ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {label}
    </button>
  )
}