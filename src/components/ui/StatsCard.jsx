'use client'

import { useState, useEffect } from 'react'

function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (typeof target !== 'number' || Number.isNaN(target)) return

    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))

      if (progress >= 1) clearInterval(interval)
    }, 16)

    return () => clearInterval(interval)
  }, [target, duration])

  return count
}

const COLOR_MAP = {
  blue:   { bg: 'rgba(99,102,241,0.1)',  icon: '#6366f1', value: '#6366f1', glow: 'rgba(99,102,241,0.2)' },
  green:  { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', value: '#10b981', glow: 'rgba(16,185,129,0.2)' },
  purple: { bg: 'rgba(139,92,246,0.1)',  icon: '#8b5cf6', value: '#8b5cf6', glow: 'rgba(139,92,246,0.2)' },
  orange: { bg: 'rgba(249,115,22,0.1)',  icon: '#f97316', value: '#f97316', glow: 'rgba(249,115,22,0.2)' },
  red:    { bg: 'rgba(239,68,68,0.1)',   icon: '#ef4444', value: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
  indigo: { bg: 'rgba(99,102,241,0.1)',  icon: '#6366f1', value: '#6366f1', glow: 'rgba(99,102,241,0.2)' },
  cyan:   { bg: 'rgba(6,182,212,0.1)',   icon: '#06b6d4', value: '#06b6d4', glow: 'rgba(6,182,212,0.2)' },
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  trendLabel,
  prefix = '',
  suffix = '',
  style: extraStyle = {},
}) {
  const [hover, setHover] = useState(false)

  const numericValue =
    typeof value === 'number'
      ? value
      : parseInt(String(value ?? '').replace(/[^0-9]/g, ''), 10) || 0

  const animatedCount = useCountUp(numericValue)
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue

  const displayValue =
    typeof value === 'number'
      ? `${prefix}${animatedCount.toLocaleString('en-IN')}${suffix}`
      : (value ?? '—')

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#ffffff',
        border: '1px solid #f1f5f9',
        borderRadius: 20,
        padding: '20px',
        transition: 'all 0.25s ease',
        boxShadow: hover
          ? `0 12px 40px rgba(0,0,0,0.1), 0 0 0 1px ${c.glow}`
          : '0 2px 8px rgba(0,0,0,0.05)',
        transform: hover ? 'translateY(-3px)' : 'translateY(0)',
        cursor: 'default',
        ...extraStyle,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: c.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: c.icon,
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: hover ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {Icon ? <Icon size={20} /> : null}
        </div>

        {trend !== undefined && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '3px 8px',
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 600,
              background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: trend >= 0 ? '#10b981' : '#ef4444',
            }}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 800,
          color: c.value,
          marginBottom: 4,
          lineHeight: 1.1,
          letterSpacing: '-0.5px',
        }}
      >
        {displayValue}
      </div>

      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#64748b',
          margin: 0,
        }}
      >
        {title}
      </p>

      {trendLabel && (
        <p
          style={{
            fontSize: 11,
            color: '#94a3b8',
            margin: '4px 0 0',
          }}
        >
          {trendLabel}
        </p>
      )}
    </div>
  )
}