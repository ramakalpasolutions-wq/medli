'use client'

import { useState, forwardRef } from 'react'

const Select = forwardRef(function Select({
  label,
  error,
  hint,
  style: extraStyle = {},
  wrapperStyle = {},
  children,
  placeholder,
  required,
  ...props
}, ref) {
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? '#ef4444'
    : focused
      ? '#6366f1'
      : '#e2e8f0'

  const ringColor = error
    ? 'rgba(239,68,68,0.15)'
    : focused
      ? 'rgba(99,102,241,0.15)'
      : 'transparent'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...wrapperStyle }}>
      {label && (
        <label style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          {label}
          {required && <span style={{ color: '#ef4444', fontSize: 13 }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <select
          ref={ref}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: '11px 38px 11px 14px',
            fontSize: 14,
            fontFamily: 'inherit',
            borderRadius: 12,
            border: `1.5px solid ${borderColor}`,
            background: '#ffffff',
            color: '#0f172a',
            outline: 'none',
            appearance: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow: `0 0 0 3px ${ringColor}, 0 1px 3px rgba(0,0,0,0.06)`,
            boxSizing: 'border-box',
            ...extraStyle,
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {children}
        </select>

        {/* Chevron icon */}
        <span style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: '#94a3b8',
          fontSize: 12,
        }}>
          ▼
        </span>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>⚠ {error}</p>
      )}
      {hint && !error && (
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{hint}</p>
      )}
    </div>
  )
})

export default Select