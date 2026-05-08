'use client'

import { useState, useEffect, useRef } from 'react'

export default function Card({
  children,
  hoverable = false,
  animate   = true,
  title,
  action,
  padding   = true,
  style: extraStyle = {},
  glass = false,
  ...props
}) {
  const [visible, setVisible] = useState(!animate)
  const [hover,   setHover]   = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!animate) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [animate])

  const baseStyle = glass ? {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    color: '#fff',
  } : {
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: hover && hoverable
      ? '0 12px 40px rgba(0,0,0,0.12)'
      : '0 2px 8px rgba(0,0,0,0.06)',
    color: '#0f172a',
  }

  return (
    <div
      ref={ref}
      onMouseEnter={() => hoverable && setHover(true)}
      onMouseLeave={() => hoverable && setHover(false)}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        opacity: visible ? 1 : 0,
        transform: visible
          ? hover && hoverable ? 'translateY(-3px)' : 'translateY(0)'
          : 'translateY(12px)',
        padding: padding ? 20 : 0,
        ...baseStyle,
        ...extraStyle,
      }}
      {...props}
    >
      {(title || action) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          {title && (
            <h3 style={{
              fontSize: 14,
              fontWeight: 700,
              color: glass ? 'rgba(255,255,255,0.9)' : '#1e293b',
              margin: 0,
            }}>
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}