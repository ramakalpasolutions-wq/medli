'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [iconScale, setIconScale] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50)
    const t2 = setTimeout(() => setIconScale(1), 150)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <>
      <style>{`
        @keyframes medli-spring-in {
          0%   { transform: scale(0) rotate(-10deg); }
          60%  { transform: scale(1.15) rotate(4deg); }
          80%  { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes medli-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes medli-pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: '15%', left: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
          filter: 'blur(70px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{
          textAlign: 'center',
          maxWidth: 420,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          {/* Icon with pulse ring */}
          <div style={{
            position: 'relative',
            width: 96, height: 96,
            margin: '0 auto 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Pulse ring */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.2)',
              animation: 'medli-pulse-ring 2s ease-out infinite',
            }} />
            {/* Icon circle */}
            <div style={{
              width: 96, height: 96,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.3))',
              border: '1px solid rgba(239,68,68,0.3)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              animation: iconScale === 1
                ? 'medli-spring-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards, medli-float 3s ease-in-out 0.8s infinite'
                : 'none',
              transform: iconScale === 0 ? 'scale(0)' : undefined,
              position: 'relative',
              zIndex: 1,
            }}>
              🚫
            </div>
          </div>

          {/* 403 badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            borderRadius: 100,
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#fbbf24',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '2px',
            marginBottom: 20,
          }}>
            403 FORBIDDEN
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(22px, 5vw, 30px)',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 12,
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
          }}>
            Access Denied
          </h1>

          {/* Description */}
          <p style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.75,
            marginBottom: 36,
            maxWidth: 320,
            margin: '0 auto 36px',
          }}>
            You don&apos;t have permission to access this page.
            Please contact your administrator.
          </p>

          {/* Glass card with buttons */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '24px',
            backdropFilter: 'blur(20px)',
            marginBottom: 20,
          }}>
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <GoBackButton router={router} />
              <GoHomeButton router={router} />
            </div>
          </div>

          {/* Footer note */}
          <p style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.25)',
            margin: 0,
          }}>
            Need access?{' '}
            <a
              href="mailto:support@medli.in"
              style={{ color: '#818cf8', textDecoration: 'none' }}
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

function GoBackButton({ router }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={() => router.back()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '13px 24px',
        fontSize: 14,
        fontWeight: 600,
        background: hover
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.85)',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hover ? 'scale(1.03)' : 'scale(1)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      ← Go Back
    </button>
  )
}

function GoHomeButton({ router }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={() => router.push('/')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '13px 24px',
        fontSize: 14,
        fontWeight: 600,
        background: hover
          ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
          : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: 'none',
        color: '#ffffff',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hover ? 'scale(1.03)' : 'scale(1)',
        boxShadow: hover
          ? '0 12px 32px rgba(99,102,241,0.5)'
          : '0 8px 24px rgba(99,102,241,0.35)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      🏠 Go Home
    </button>
  )
}