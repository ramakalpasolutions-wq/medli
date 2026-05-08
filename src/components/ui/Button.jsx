'use client'

import { useState } from 'react'

const VARIANTS = {
  primary: {
    base:  { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none' },
    hover: { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
    shadow: '0 4px 16px rgba(99,102,241,0.35)',
    shadowHover: '0 8px 24px rgba(99,102,241,0.5)',
  },
  secondary: {
    base:  { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)' },
    hover: { background: 'rgba(255,255,255,0.12)' },
    shadow: 'none',
    shadowHover: 'none',
  },
  danger: {
    base:  { background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none' },
    hover: { background: 'linear-gradient(135deg, #dc2626, #b91c1c)' },
    shadow: '0 4px 16px rgba(239,68,68,0.3)',
    shadowHover: '0 8px 24px rgba(239,68,68,0.45)',
  },
  ghost: {
    base:  { background: 'transparent', color: '#818cf8', border: '1px solid transparent' },
    hover: { background: 'rgba(99,102,241,0.1)' },
    shadow: 'none',
    shadowHover: 'none',
  },
  outline: {
    base:  { background: 'transparent', color: '#818cf8', border: '1px solid rgba(99,102,241,0.4)' },
    hover: { background: 'rgba(99,102,241,0.1)' },
    shadow: 'none',
    shadowHover: 'none',
  },
  success: {
    base:  { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none' },
    hover: { background: 'linear-gradient(135deg, #059669, #047857)' },
    shadow: '0 4px 16px rgba(16,185,129,0.3)',
    shadowHover: '0 8px 24px rgba(16,185,129,0.45)',
  },
}

const SIZES = {
  xs: { padding: '6px 12px',  fontSize: 12, borderRadius: 8,  gap: 4 },
  sm: { padding: '8px 14px',  fontSize: 13, borderRadius: 10, gap: 6 },
  md: { padding: '11px 20px', fontSize: 14, borderRadius: 12, gap: 8 },
  lg: { padding: '14px 28px', fontSize: 15, borderRadius: 14, gap: 8 },
  xl: { padding: '16px 36px', fontSize: 16, borderRadius: 16, gap: 10 },
}

function Spinner() {
  return (
    <>
      <style>{`
        @keyframes btn-spin { to { transform: rotate(360deg); } }
      `}</style>
      <span style={{
        width: 15, height: 15,
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: 'currentColor',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'btn-spin 0.7s linear infinite',
        flexShrink: 0,
      }} />
    </>
  )
}

export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style: extraStyle = {},
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  const [hover,  setHover]  = useState(false)
  const [active, setActive] = useState(false)

  const v = VARIANTS[variant] ?? VARIANTS.primary
  const s = SIZES[size]      ?? SIZES.md
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => !isDisabled && setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false) }}
      onMouseDown={()  => !isDisabled && setActive(true)}
      onMouseUp={()    => setActive(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        borderRadius: s.borderRadius,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.18s ease',
        outline: 'none',
        width: fullWidth ? '100%' : undefined,
        opacity: isDisabled ? 0.5 : 1,
        transform: active && !isDisabled
          ? 'scale(0.97)'
          : hover && !isDisabled
            ? 'scale(1.02)'
            : 'scale(1)',
        boxShadow: hover && !isDisabled ? v.shadowHover : v.shadow,
        userSelect: 'none',
        lineHeight: 1,
        ...v.base,
        ...(hover && !isDisabled ? v.hover : {}),
        ...extraStyle,
      }}
      {...props}
    >
      {loading ? <Spinner /> : leftIcon && (
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && (
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>{rightIcon}</span>
      )}
    </button>
  )
}