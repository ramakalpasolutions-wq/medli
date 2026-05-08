'use client'

import { useState } from 'react'

const VARIANTS = {
  success: {
    background: 'rgba(16,185,129,0.12)',
    color: '#10b981',
    border: '1px solid rgba(16,185,129,0.25)',
    dot: '#10b981',
  },
  warning: {
    background: 'rgba(245,158,11,0.12)',
    color: '#f59e0b',
    border: '1px solid rgba(245,158,11,0.25)',
    dot: '#f59e0b',
  },
  danger: {
    background: 'rgba(239,68,68,0.12)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.25)',
    dot: '#ef4444',
  },
  info: {
    background: 'rgba(99,102,241,0.12)',
    color: '#6366f1',
    border: '1px solid rgba(99,102,241,0.25)',
    dot: '#6366f1',
  },
  neutral: {
    background: 'rgba(100,116,139,0.1)',
    color: '#64748b',
    border: '1px solid rgba(100,116,139,0.2)',
    dot: '#94a3b8',
  },
  purple: {
    background: 'rgba(139,92,246,0.12)',
    color: '#8b5cf6',
    border: '1px solid rgba(139,92,246,0.25)',
    dot: '#8b5cf6',
  },
}

const SIZES = {
  sm: { padding: '2px 8px',   fontSize: 11 },
  md: { padding: '3px 10px',  fontSize: 12 },
  lg: { padding: '5px 12px',  fontSize: 13 },
}

export function getStatusVariant(status) {
  const map = {
    confirmed:        'info',
    completed:        'success',
    cancelled:        'danger',
    refunded:         'neutral',
    no_show:          'warning',
    pending_payment:  'warning',
    pending:          'warning',
    processing:       'info',
    report_ready:     'success',
    failed:           'danger',
    success:          'success',
    approved:         'success',
    on_hold:          'warning',
    active:           'success',
    inactive:         'neutral',
    created:          'neutral',
    paid:             'success',
    partial_refund:   'warning',
    sample_collected: 'info',
  }
  return map[status] || 'neutral'
}

export default function Badge({
  children,
  variant   = 'info',
  size      = 'md',
  dot       = false,
  pulse     = false,
  style: extraStyle = {},
}) {
  const v = VARIANTS[variant] ?? VARIANTS.info
  const s = SIZES[size]    ?? SIZES.md

  return (
    <>
      {pulse && (
        <style>{`
          @keyframes badge-ping {
            0%   { transform: scale(1); opacity: 0.7; }
            100% { transform: scale(2); opacity: 0; }
          }
        `}</style>
      )}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: 600,
        borderRadius: 100,
        background: v.background,
        color: v.color,
        border: v.border,
        padding: s.padding,
        fontSize: s.fontSize,
        letterSpacing: '0.2px',
        whiteSpace: 'nowrap',
        ...extraStyle,
      }}>
        {dot && (
          <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
            {pulse && (
              <span style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: v.dot,
                animation: 'badge-ping 1.2s ease-out infinite',
              }} />
            )}
            <span style={{
              display: 'block',
              width: 6, height: 6,
              borderRadius: '50%',
              backgroundColor: v.dot,
              position: 'relative',
              zIndex: 1,
            }} />
          </span>
        )}
        {children}
      </span>
    </>
  )
}