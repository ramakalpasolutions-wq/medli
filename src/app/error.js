'use client'

import { useEffect, useState } from 'react'

export default function Error({ error, reset }) {
  const [visible, setVisible] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    console.error('[App Error]', error)
    const t1 = setTimeout(() => setVisible(true), 50)
    const t2 = setTimeout(() => setShake(true), 400)
    const t3 = setTimeout(() => setShake(false), 900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [error])

  return (
    <>
      <style>{`
        @keyframes medli-shake {
          0%, 100% { transform: rotate(0deg); }
          15%       { transform: rotate(-12deg); }
          30%       { transform: rotate(10deg); }
          45%       { transform: rotate(-8deg); }
          60%       { transform: rotate(6deg); }
          75%       { transform: rotate(-4deg); }
          90%       { transform: rotate(2deg); }
        }
        @keyframes medli-glow-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
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
        {/* Red ambient glow */}
        <div style={{
          position: 'absolute',
          top: '25%', left: '50%',
          transform: 'translateX(-50%)',
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: 'medli-glow-pulse 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '10%', right: '10%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{
          textAlign: 'center',
          maxWidth: 460,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}>
          {/* Warning icon */}
          <div style={{
            fontSize: 72,
            marginBottom: 32,
            display: 'inline-block',
            animation: shake ? 'medli-shake 0.5s ease-in-out' : 'none',
          }}>
            ⚠️
          </div>

          {/* Glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 24,
            padding: 'clamp(24px, 5vw, 44px) clamp(20px, 5vw, 36px)',
            backdropFilter: 'blur(24px)',
            marginBottom: 24,
            boxShadow: '0 24px 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
            {/* Error badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              borderRadius: 100,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '2px',
              marginBottom: 20,
            }}>
              500 ERROR
            </div>

            <h1 style={{
              fontSize: 'clamp(20px, 4vw, 26px)',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: 12,
              letterSpacing: '-0.5px',
            }}>
              Something Went Wrong
            </h1>

            <p style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.75,
              marginBottom: 8,
            }}>
              {error?.message && error.message !== 'An unexpected error occurred.'
                ? error.message
                : 'An unexpected error occurred.'}
            </p>

            <p style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.3)',
              lineHeight: 1.6,
              marginBottom: 28,
            }}>
              Please try again. If the problem persists, contact support.
            </p>

            {/* Dev detail box */}
            {process.env.NODE_ENV === 'development' && error?.stack && (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 24,
                textAlign: 'left',
                maxHeight: 100,
                overflow: 'auto',
              }}>
                <p style={{
                  fontSize: 10,
                  color: '#fca5a5',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  {error.stack}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <HomeButton />
              <RetryButton reset={reset} />
            </div>
          </div>

          {/* Support link */}
          <p style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.25)',
            margin: 0,
          }}>
            Need help?{' '}
            <a
              href="mailto:support@medli.in"
              style={{ color: '#818cf8', textDecoration: 'none' }}
            >
              support@medli.in
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

function HomeButton() {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={() => window.location.href = '/'}
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
      🏠 Go Home
    </button>
  )
}

function RetryButton({ reset }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={reset}
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
      🔄 Try Again
    </button>
  )
}