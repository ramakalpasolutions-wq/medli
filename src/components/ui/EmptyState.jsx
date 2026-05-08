'use client'

import { useEffect, useState } from 'react'

export default function EmptyState({
  icon,
  title   = 'No data found',
  message = 'Nothing to show here yet.',
  action,
  style: extraStyle = {},
}) {
  const [float, setFloat] = useState(0)

  useEffect(() => {
    let start = null
    let raf
    const animate = (ts) => {
      if (!start) start = ts
      setFloat(Math.sin((ts - start) / 900) * 7)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  const defaultIcon = (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      ...extraStyle,
    }}>
      <div style={{
        color: '#cbd5e1',
        marginBottom: 16,
        transform: `translateY(${float}px)`,
        transition: 'transform 0.05s linear',
        display: 'inline-block',
      }}>
        {icon ?? defaultIcon}
      </div>

      <h3 style={{
        fontSize: 15,
        fontWeight: 700,
        color: '#475569',
        marginBottom: 6,
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: 13,
        color: '#94a3b8',
        maxWidth: 280,
        lineHeight: 1.65,
        margin: '0 auto',
      }}>
        {message}
      </p>

      {action && (
        <div style={{ marginTop: 20 }}>{action}</div>
      )}
    </div>
  )
}