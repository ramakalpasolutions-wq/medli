'use client'

import { useState } from 'react'

export default function AdminHeader({
  breadcrumbs = [],
  title,
  subtitle,
  actions,
  style: extraStyle = {},
}) {
  return (
    <div style={{ marginBottom: 24, ...extraStyle }}>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && (
                <span style={{ fontSize: 12, color: '#d1d5db' }}>›</span>
              )}
              {crumb.href ? (
                <BreadcrumbLink href={crumb.href} label={crumb.label} />
              ) : (
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          {title && (
            <h1 style={{
              fontSize: 'clamp(18px,3vw,22px)',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
            }}>
              {title}
            </h1>
          )}
          {subtitle && (
            <p style={{
              fontSize: 13,
              color: '#94a3b8',
              margin: '4px 0 0',
              lineHeight: 1.5,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Breadcrumb link with hover ─────────────────────────────────────── */
function BreadcrumbLink({ href, label }) {
  const [h, setH] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize: 12,
        color: h ? '#6366f1' : '#94a3b8',
        textDecoration: 'none',
        transition: 'color .15s ease',
        fontWeight: 400,
      }}
    >
      {label}
    </a>
  )
}