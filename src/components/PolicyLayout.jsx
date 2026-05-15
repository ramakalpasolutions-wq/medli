'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Shared layout for all legal/policy pages
 */
export default function PolicyLayout({
  title,
  icon = '📜',
  lastUpdated,
  effectiveDate,
  children,
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <style>{`
        @keyframes pol-in { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .pol-content h2 { font-size:20px; font-weight:800; color:#0f172a; margin:32px 0 12px; letter-spacing:-0.3px; }
        .pol-content h3 { font-size:16px; font-weight:700; color:#1e293b; margin:24px 0 10px; }
        .pol-content p  { font-size:14px; line-height:1.75; color:#475569; margin:0 0 14px; }
        .pol-content ul, .pol-content ol { padding-left:22px; margin:0 0 14px; }
        .pol-content li { font-size:14px; line-height:1.75; color:#475569; margin-bottom:8px; }
        .pol-content strong { color:#0f172a; font-weight:700; }
        .pol-content a { color:#6366f1; text-decoration:underline; font-weight:500; }
        .pol-content a:hover { color:#4f46e5; }

        .pol-content table {
          width:100%; border-collapse:collapse; margin:16px 0; font-size:13px;
          border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;
        }
        .pol-content th, .pol-content td {
          padding:10px 14px; text-align:left; border-bottom:1px solid #e2e8f0;
        }
        .pol-content th { background:#f8fafc; font-weight:700; color:#0f172a; }
        .pol-content tr:last-child td { border-bottom:none; }

        .pol-content blockquote {
          border-left:3px solid #6366f1; padding:12px 16px; margin:16px 0;
          background:#f8fafc; border-radius:0 8px 8px 0;
          font-size:13px; color:#475569; font-style:italic;
        }

        /* ✅ FIX: Prevent nested scrollbars */
        .pol-wrapper {
          width: 100%;
          background: linear-gradient(180deg,#f8fafc 0%,#ffffff 50%);
        }
        .pol-header {
          width: 100%;
          background: linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);
          padding: clamp(40px,6vw,72px) clamp(16px,4vw,32px);
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .pol-body {
          width: 100%;
          max-width: 880px;
          margin: 0 auto;
          padding: clamp(32px,5vw,56px) clamp(16px,4vw,32px) 80px;
        }
      `}</style>

      <div className="pol-wrapper">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="pol-header">
          {/* Decorative orbs */}
          <div style={{
            position:'absolute', top:'-50%', right:'-10%',
            width:400, height:400, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(255,255,255,0.15),transparent 70%)',
            pointerEvents:'none',
          }} />
          <div style={{
            position:'absolute', bottom:'-50%', left:'-10%',
            width:350, height:350, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(255,255,255,0.1),transparent 70%)',
            pointerEvents:'none',
          }} />

          <div style={{
            maxWidth: 880, margin: '0 auto',
            position: 'relative', zIndex: 1,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all .5s ease',
          }}>
            {/* Breadcrumb */}
            <div style={{
              fontSize: 13, opacity: 0.85, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Link href="/" style={{ color:'#fff', textDecoration:'none', opacity:0.85 }}>
                ← Back to Home
              </Link>
            </div>

            {/* Title */}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:12 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
                flexShrink: 0,
              }}>
                {icon}
              </div>
              <h1 style={{
                fontSize: 'clamp(26px,5vw,40px)',
                fontWeight: 800,
                margin: 0,
                letterSpacing: '-0.5px',
                lineHeight: 1.2,
              }}>
                {title}
              </h1>
            </div>

            {/* Meta info */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 12,
              marginTop: 16, fontSize: 13,
            }}>
              {lastUpdated && (
                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '6px 12px', borderRadius: 100,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  📅 Last Updated: <strong>{lastUpdated}</strong>
                </span>
              )}
              {effectiveDate && (
                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '6px 12px', borderRadius: 100,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  ⚡ Effective: <strong>{effectiveDate}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────── */}
        <div
          className="pol-body"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all .6s ease .1s',
          }}
        >
          <div
            className="pol-content"
            style={{
              background: '#fff',
              padding: 'clamp(24px,4vw,48px)',
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 24px rgba(15,23,42,0.04)',
            }}
          >
            {children}
          </div>

          {/* Footer note */}
          <div style={{
            textAlign: 'center', marginTop: 32,
            fontSize: 12, color: '#94a3b8',
          }}>
            Have questions? Contact us at{' '}
            <a
              href="mailto:legal@medli.in"
              style={{ color:'#6366f1', textDecoration:'none', fontWeight:600 }}
            >
              legal@medli.in
            </a>
          </div>

          {/* Cross-links */}
          <PolicyCrossLinks current={title} />
        </div>
      </div>
    </>
  )
}

/* ─── Section component ─────────────────────────────────────────── */
export function Section({ title, children, id }) {
  return (
    <section id={id} style={{ marginBottom: 8 }}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  )
}

/* ─── Cross-links ──────────────────────────────────────────────── */
function PolicyCrossLinks({ current }) {
  const links = [
    { label: 'Privacy Policy',         href: '/privacy',      icon: '🔒' },
    { label: 'Terms of Service',       href: '/terms',        icon: '📜' },
    { label: 'Refund Policy',          href: '/refunds',      icon: '↩️' },
    { label: 'Admin Dashboard Policy', href: '/admin-policy', icon: '🛡️' },
  ].filter((l) => l.label !== current && !current.includes(l.label.split(' ')[0]))

  if (links.length === 0) return null

  return (
    <div style={{ marginTop: 32 }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: '#64748b',
        letterSpacing: '1.5px', marginBottom: 12,
        textAlign: 'center', textTransform: 'uppercase',
      }}>
        Related Policies
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
        gap: 10,
      }}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="pol-cross-link"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              textDecoration: 'none',
              color: '#475569',
              fontSize: 13, fontWeight: 600,
              transition: 'all .15s ease',
            }}
          >
            <span style={{ fontSize: 18 }}>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
      <style>{`
        .pol-cross-link:hover {
          border-color: #818cf8 !important;
          background: #f8fafc !important;
          color: #6366f1 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(99,102,241,0.12);
        }
      `}</style>
    </div>
  )
}