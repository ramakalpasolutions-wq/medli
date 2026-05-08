'use client'

import { useState } from 'react'

export default function LabCard({ lab, onClick }) {
  const {
    name, images, address, rating,
    certifications = [], homeCollection, distance,
  } = lab || {}

  const hasNABL = certifications.some((c) => c?.toLowerCase().includes('nabl'))
  const hasISO  = certifications.some((c) => c?.toLowerCase().includes('iso'))
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
        background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
        overflow: 'hidden',
      }}>
        {images?.cover
          ? <img src={images.cover} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🧪</div>
        }
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 60%)',
        }} />

        {/* Cert badges */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          display: 'flex', gap: 4,
        }}>
          {hasNABL && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: '#2563eb', color: '#fff',
              padding: '2px 8px', borderRadius: 100,
            }}>NABL</span>
          )}
          {hasISO && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: '#7c3aed', color: '#fff',
              padding: '2px 8px', borderRadius: 100,
            }}>ISO</span>
          )}
        </div>

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
            : '🧪'}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 16px 16px' }}>
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: '#0f172a',
          margin: '0 0 6px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name || 'Lab'}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {rating?.average > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', gap: 3 }}>
              ⭐ {rating.average.toFixed(1)}
            </span>
          )}
          {distance && (
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              📍 {(distance / 1000).toFixed(1)} km
            </span>
          )}
        </div>

        {address?.city && (
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
            📍 {address.city}
          </p>
        )}

        {homeCollection?.enabled && (
          <div style={{ marginBottom: 12 }}>
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: 'rgba(16,185,129,0.1)',
              color: '#059669',
              padding: '3px 10px', borderRadius: 100,
            }}>
              🏠 Home Collection
            </span>
          </div>
        )}

        <LabBookButton />
      </div>
    </div>
  )
}

function LabBookButton() {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '11px',
        borderRadius: 12, border: 'none',
        background: hover
          ? 'linear-gradient(135deg, #059669, #047857)'
          : 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: hover ? '0 8px 24px rgba(16,185,129,0.45)' : '0 4px 14px rgba(16,185,129,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      Book Tests →
    </button>
  )
}