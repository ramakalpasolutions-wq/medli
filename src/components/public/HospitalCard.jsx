'use client'

import { useState } from 'react'

export default function HospitalCard({ hospital, onClick }) {
  const { name, images, address, rating, departments = [], distance } = hospital || {}
  const [hover, setHover] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid #f1f5f9',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: hover
          ? '0 16px 48px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        minWidth: 280, maxWidth: 320, flexShrink: 0,
      }}
    >
      {/* Cover */}
      <div style={{
        position: 'relative',
        height: 140,
        background: 'linear-gradient(135deg, #dbeafe, #c7d2fe)',
        overflow: 'hidden',
      }}>
        {images?.cover
          ? <img src={images.cover} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🏥</div>
        }
        {/* Overlay gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 60%)',
        }} />
        {/* Logo */}
        <div style={{
          position: 'absolute', bottom: -20, left: 16,
          width: 44, height: 44, borderRadius: 12,
          background: '#fff', border: '2px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
          {images?.logo
            ? <img src={images.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '🏥'}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 16px 16px' }}>
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: '#0f172a',
          margin: '0 0 6px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name || 'Hospital'}
        </h3>

        {/* Rating + Distance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {rating?.average > 0 && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: '#92400e',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              ⭐ {rating.average.toFixed(1)}
              <span style={{ fontWeight: 400, color: '#b45309' }}>({rating.count})</span>
            </span>
          )}
          {distance && (
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              📍 {(distance / 1000).toFixed(1)} km
            </span>
          )}
        </div>

        {/* City */}
        {address?.city && (
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
            📍 {address.city}, {address.state}
          </p>
        )}

        {/* Departments */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {departments.slice(0, 3).map((d) => (
            <span key={d} style={{
              fontSize: 10, fontWeight: 500,
              background: 'rgba(99,102,241,0.08)',
              color: '#6366f1',
              padding: '3px 8px', borderRadius: 100,
            }}>
              {d}
            </span>
          ))}
          {departments.length > 3 && (
            <span style={{
              fontSize: 10, fontWeight: 500,
              background: '#f1f5f9', color: '#64748b',
              padding: '3px 8px', borderRadius: 100,
            }}>
              +{departments.length - 3}
            </span>
          )}
        </div>

        {/* Button */}
        <HospitalBookButton />
      </div>
    </div>
  )
}

function HospitalBookButton() {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '11px',
        borderRadius: 12, border: 'none',
        background: hover
          ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
          : 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: hover ? '0 8px 24px rgba(59,130,246,0.45)' : '0 4px 14px rgba(59,130,246,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      Book Now →
    </button>
  )
}