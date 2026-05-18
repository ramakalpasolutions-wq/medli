'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Star,
  Sparkles,
  FlaskConical,
  Home,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react'

export default function LabCard({ lab }) {
  const [hover, setHover] = useState(false)

  const distance = lab.distance
    ? lab.distance < 1000
      ? `${Math.round(lab.distance)}m`
      : `${(lab.distance / 1000).toFixed(1)}km`
    : null

  const certs = lab.certifications?.slice(0, 2) || []
  const extraCount = (lab.certifications?.length || 0) - certs.length
  const hasRating = lab.rating?.count > 0

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #f1f5f9',
        boxShadow: hover
          ? '0 12px 32px rgba(16,185,129,0.15)'
          : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all .25s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          height: 140,
          background: lab.images?.cover
            ? `url(${lab.images.cover}) center/cover`
            : 'linear-gradient(135deg,#d1fae5,#a7f3d0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {!lab.images?.cover && (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 24px rgba(30,41,59,0.08)',
            }}
          >
            <FlaskConical size={32} strokeWidth={2.2} color="#059669" />
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {lab.homeCollection?.enabled && (
            <div
              style={{
                padding: '4px 10px',
                borderRadius: 100,
                background: 'linear-gradient(135deg,#10b981,#059669)',
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
              }}
            >
              <Home size={11} strokeWidth={2.4} color="#fff" />
              Home Collection
            </div>
          )}

          {!hasRating && (
            <div
              style={{
                padding: '4px 10px',
                borderRadius: 100,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Sparkles size={11} strokeWidth={2.5} color="#fff" />
              NEW
            </div>
          )}
        </div>

        {distance && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              padding: '4px 10px',
              borderRadius: 100,
              background: 'rgba(255,255,255,0.95)',
              fontSize: 11,
              fontWeight: 700,
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backdropFilter: 'blur(8px)',
            }}
          >
            <MapPin size={12} strokeWidth={2.5} color="#475569" />
            {distance}
          </div>
        )}
      </div>

      <div
        style={{
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: 1,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {lab.name}
          </h3>

          <p
            style={{
              fontSize: 12,
              color: '#94a3b8',
              margin: '3px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MapPin size={12} strokeWidth={2.3} color="#94a3b8" />
            {lab.address?.city || '—'}
          </p>
        </div>

        {hasRating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={13} fill="#f59e0b" color="#f59e0b" strokeWidth={2.2} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
              {lab.rating.average.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              ({lab.rating.count})
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={13} strokeWidth={2.4} color="#059669" />
            <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
              Newly added
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            minHeight: 24,
          }}
        >
          {certs.length > 0 ? (
            <>
              {certs.map((c) => (
                <span
                  key={c}
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    padding: '3px 8px',
                    borderRadius: 100,
                    background: 'rgba(16,185,129,0.08)',
                    color: '#059669',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <BadgeCheck size={11} strokeWidth={2.2} color="#059669" />
                  {c}
                </span>
              ))}

              {extraCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 100,
                    background: 'rgba(16,185,129,0.12)',
                    color: '#059669',
                  }}
                >
                  +{extraCount}
                </span>
              )}
            </>
          ) : (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                padding: '3px 8px',
                borderRadius: 100,
                background: '#fef3c7',
                color: '#92400e',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <FlaskConical size={11} strokeWidth={2.2} color="#92400e" />
              Diagnostic Lab
            </span>
          )}
        </div>

        <Link
          href={`/labs/${lab.id || lab._id}`}
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px',
            borderRadius: 10,
            background: hover
              ? 'linear-gradient(135deg,#059669,#047857)'
              : 'linear-gradient(135deg,#10b981,#059669)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
            textDecoration: 'none',
            transition: 'background .2s ease',
            boxShadow: hover ? '0 6px 16px rgba(16,185,129,0.4)' : 'none',
          }}
        >
          Book Test
          <ArrowRight size={14} strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  )
}