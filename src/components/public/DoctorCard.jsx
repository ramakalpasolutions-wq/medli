'use client'

import { useState } from 'react'

export default function DoctorCard({ doctor, onClick }) {
  const {
    name, avatar,
    specialization = [],
    rating, consultationFee, experience,
  } = doctor || {}

  const [hover, setHover] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 20,
        border: '1px solid #f1f5f9',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: hover
          ? '0 16px 48px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        minWidth: 260,
        maxWidth: 320,
        flexShrink: 0,
      }}
    >
      {/* Avatar + info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0, overflow: 'hidden',
          border: '2px solid rgba(99,102,241,0.1)',
        }}>
          {avatar
            ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '👨‍⚕️'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: 15, fontWeight: 700, color: '#0f172a',
            margin: '0 0 3px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            Dr. {name}
          </h3>
          <p style={{
            fontSize: 12, fontWeight: 500, color: '#6366f1',
            margin: '0 0 2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {specialization.slice(0, 2).join(', ') || 'General Physician'}
          </p>
          {experience && (
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              {experience} yrs experience
            </p>
          )}
        </div>
      </div>

      {/* Rating */}
      {rating?.average > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 14,
          padding: '6px 10px',
          background: 'rgba(245,158,11,0.08)',
          borderRadius: 8,
          width: 'fit-content',
        }}>
          <span style={{ fontSize: 13 }}>⭐</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
            {rating.average.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: '#92400e', opacity: 0.7 }}>
            ({rating.count} reviews)
          </span>
        </div>
      )}

      {/* Fee */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>₹</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
            {consultationFee?.offline || 0}
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>/visit</span>
        </div>
        {consultationFee?.online > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            background: 'rgba(99,102,241,0.1)',
            color: '#6366f1',
            padding: '3px 10px', borderRadius: 100,
          }}>
            Online ₹{consultationFee.online}
          </span>
        )}
      </div>

      {/* Button */}
      <BookButton hover={hover} label="Book Appointment" />
    </div>
  )
}

function BookButton({ hover: cardHover, label }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        padding: '11px',
        borderRadius: 12,
        border: 'none',
        background: hover
          ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
          : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: hover
          ? '0 8px 24px rgba(99,102,241,0.45)'
          : '0 4px 14px rgba(99,102,241,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      {label} →
    </button>
  )
}