'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import { useGeoLocation } from '@/hooks/useGeoLocation'

const fetcher = (url) =>
  fetch(url).then((r) => r.json()).then((j) => {
    if (!j.success) throw new Error(j.error || 'Failed')
    return j.data
  })

/* ─── Word Rotator ───────────────────────────────────────────────────── */
const WORDS = ['Healthcare', 'Appointments', 'Lab Tests', 'Consultations', 'Wellness']

function WordRotator() {
  const [idx,     setIdx]     = useState(0)
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const iv = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIdx((i) => (i + 1) % WORDS.length); setVisible(true) }, 300)
    }, 2500)
    return () => clearInterval(iv)
  }, [])

  if (!mounted) {
    return (
    
      <span style={{
        backgroundImage: 'linear-gradient(135deg,#c7d2fe,#a5f3fc)', // Use backgroundImage
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        Healthcare
      </span>
    )
  }

  return (
   <span style={{
  display: 'inline-block',
  backgroundImage: 'linear-gradient(135deg,#c7d2fe,#67e8f9)', // Fixed here
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-12px)',
      transition: 'opacity .3s ease, transform .3s ease',
      minWidth: 'clamp(160px,28vw,300px)',
    }}>
      {WORDS[idx]}
    </span>
  )
}

/* ─── Animated Counter ───────────────────────────────────────────────── */
function AnimCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref     = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        let cur = 0
        const step = target / 60
        const t = setInterval(() => {
          cur += step
          if (cur >= target) { setCount(target); clearInterval(t) }
          else setCount(Math.floor(cur))
        }, 1000 / 60)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>
}

/* ─── Float Card (hero) ──────────────────────────────────────────────── */
function FloatCard({ style: sx, children, delay = 0 }) {
  const [y, setY] = useState(0)
  useEffect(() => {
    let raf
    const start = Date.now() + delay * 1000
    const tick  = () => {
      setY(Math.sin(Math.max(0, Date.now() - start) / 1200) * 8)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [delay])

  return (
    <div style={{
      position: 'absolute',
      transform: `translateY(${y}px)`,
      transition: 'transform .05s linear',
      background: 'rgba(255,255,255,0.96)',
      borderRadius: 20, padding: 20,
      boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
      backdropFilter: 'blur(10px)',
      ...sx,
    }}>
      {children}
    </div>
  )
}

/* ─── Skeleton Row ───────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <>
      <style>{`@keyframes sk{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            flexShrink: 0, width: 288, height: 220, borderRadius: 20,
            background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
            backgroundSize: '200% 100%', animation: 'sk 1.5s linear infinite',
          }} />
        ))}
      </div>
    </>
  )
}

/* ─── Nearby Hospital Card ───────────────────────────────────────────── */
function NearbyHospCard({ h, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 288, background: '#fff', borderRadius: 20,
        overflow: 'hidden', cursor: 'pointer',
        border: `1.5px solid ${hov ? '#c7d2fe' : '#f1f5f9'}`,
        boxShadow: hov ? '0 16px 48px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all .25s ease',
      }}
    >
      <div style={{ position: 'relative', height: 128, background: 'linear-gradient(135deg,#dbeafe,#c7d2fe)', overflow: 'hidden' }}>
        {h.images?.cover
          ? <img src={h.images.cover} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform .3s ease' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🏥</div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.2),transparent)' }} />
        {h.distance && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 {(h.distance / 1000).toFixed(1)}km
          </div>
        )}
        {h.images?.logo && (
          <div style={{ position: 'absolute', bottom: -18, left: 12, width: 38, height: 38, borderRadius: 10, background: '#fff', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <img src={h.images.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      <div style={{ padding: '24px 14px 14px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</h3>
        {h.address?.city && <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px' }}>📍 {h.address.city}</p>}
        {h.rating?.average > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <span>⭐</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>{h.rating.average.toFixed(1)}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>({h.rating.count})</span>
          </div>
        )}
        {h.departments?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {h.departments.slice(0, 2).map((d) => (
              <span key={d} style={{ fontSize: 10, fontWeight: 500, background: 'rgba(99,102,241,0.09)', color: '#6366f1', padding: '2px 8px', borderRadius: 100 }}>{d}</span>
            ))}
            {h.departments.length > 2 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{h.departments.length - 2}</span>}
          </div>
        )}
        <NearbyBtn color="blue" label="Book Now" />
      </div>
    </div>
  )
}

/* ─── Nearby Lab Card ────────────────────────────────────────────────── */
function NearbyLabCard({ l, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 288, background: '#fff', borderRadius: 20,
        overflow: 'hidden', cursor: 'pointer',
        border: `1.5px solid ${hov ? '#a7f3d0' : '#f1f5f9'}`,
        boxShadow: hov ? '0 16px 48px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all .25s ease',
      }}
    >
      <div style={{ position: 'relative', height: 128, background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', overflow: 'hidden' }}>
        {l.images?.cover
          ? <img src={l.images.cover} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🧪</div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.2),transparent)' }} />
        {l.distance && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 {(l.distance / 1000).toFixed(1)}km
          </div>
        )}
        {l.homeCollection?.enabled && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: '#10b981', color: '#fff', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontWeight: 700 }}>
            🏠 Home Collection
          </div>
        )}
      </div>

      <div style={{ padding: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</h3>
        {l.address?.city && <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px' }}>📍 {l.address.city}</p>}
        {l.rating?.average > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <span>⭐</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>{l.rating.average.toFixed(1)}</span>
          </div>
        )}
        {l.certifications?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {l.certifications.slice(0, 2).map((c) => (
              <span key={c} style={{ fontSize: 10, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 8px', borderRadius: 100 }}>{c}</span>
            ))}
          </div>
        )}
        <NearbyBtn color="green" label="Book Test" />
      </div>
    </div>
  )
}

function NearbyBtn({ color, label }) {
  const [h, setH] = useState(false)
  const C = {
    blue:  { base: 'linear-gradient(135deg,#6366f1,#8b5cf6)', hov: 'linear-gradient(135deg,#7c3aed,#6d28d9)', sh: 'rgba(99,102,241,0.35)' },
    green: { base: 'linear-gradient(135deg,#10b981,#059669)', hov: 'linear-gradient(135deg,#059669,#047857)', sh: 'rgba(16,185,129,0.35)' },
  }[color]
  return (
    <button
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: '100%', padding: 10, borderRadius: 12, border: 'none',
        background: h ? C.hov : C.base, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        boxShadow: `0 4px 14px ${C.sh}`, transform: h ? 'scale(1.02)' : 'scale(1)',
        transition: 'all .18s ease',
      }}
    >
      {label} →
    </button>
  )
}

/* ─── Quick Action ───────────────────────────────────────────────────── */
function QuickAction({ emoji, label, sub, href, gradient }) {
  const [h, setH] = useState(false)
  return (
    <a href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'block', background: '#fff', borderRadius: 20,
        padding: 'clamp(16px,3vw,24px)',
        border: `1.5px solid ${h ? '#e0e7ff' : '#f1f5f9'}`,
        textDecoration: 'none',
        boxShadow: h ? '0 16px 40px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
        transform: h ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all .25s ease', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: gradient, opacity: h ? 0.04 : 0, transition: 'opacity .25s ease', borderRadius: 20 }} />
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, marginBottom: 14,
        boxShadow: h ? '0 8px 24px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.15)',
        transform: h ? 'scale(1.08)' : 'scale(1)', transition: 'all .2s ease',
      }}>
        {emoji}
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{sub}</p>
    </a>
  )
}

/* ─── Step Card ──────────────────────────────────────────────────────── */
function StepCard({ step, icon, title, desc, gradient, delay }) {
  const [vis, setVis]   = useState(false)
  const [hov, setHov]   = useState(false)
  const ref             = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setTimeout(() => setVis(true), delay) },
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [delay])

  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 24, padding: 'clamp(24px,4vw,36px)',
        border: '1.5px solid #f1f5f9',
        boxShadow: hov ? '0 20px 60px rgba(0,0,0,0.1)' : '0 2px 12px rgba(0,0,0,0.04)',
        transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(24px)',
        opacity: vis ? 1 : 0, transition: 'all .3s ease',
      }}
    >
      <div style={{ position: 'relative', marginBottom: 24, width: 'fit-content' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          transform: hov ? 'scale(1.08)' : 'scale(1)', transition: 'transform .2s ease',
        }}>
          {icon}
        </div>
        <div style={{
          position: 'absolute', top: -8, right: -8,
          width: 26, height: 26, borderRadius: '50%',
          background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {step}
        </div>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{desc}</p>
    </div>
  )
}

/* ─── Testimonial Card ───────────────────────────────────────────────── */
function TestiCard({ name, role, avatar, text, rating, delay }) {
  const [vis, setVis] = useState(false)
  const [hov, setHov] = useState(false)
  const ref           = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setTimeout(() => setVis(true), delay) },
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [delay])

  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 20, padding: 24,
        border: '1.5px solid #f1f5f9',
        boxShadow: hov ? '0 16px 48px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(24px)',
        opacity: vis ? 1 : 0, transition: 'all .3s ease',
      }}
    >
      <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
        {Array.from({ length: rating }).map((_, i) => (
          <span key={i} style={{ fontSize: 15 }}>⭐</span>
        ))}
      </div>
      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.75, marginBottom: 20 }}>
        &ldquo;{text}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, borderTop: '1px solid #f8fafc' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
        }}>
          {avatar}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>{name}</p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{role}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Nearby Section Wrapper ─────────────────────────────────────────── */
function NearbySection({ title, subtitle, viewHref, viewColor, children }) {
  const [hov, setHov] = useState(false)
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', marginBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            {title}
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{subtitle}</p>
        </div>
        <a href={viewHref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{
            fontSize: 12, fontWeight: 600, color: hov ? viewColor : '#64748b',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
            transition: 'color .15s ease', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          View all →
        </a>
      </div>
      {children}
    </section>
  )
}

/* ─── Location Prompt ────────────────────────────────────────────────── */
/* ─── Location Banner (soft hint, not a blocker) ─────────────────────── */
function LocationBanner({ onAllow, city }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(99,102,241,0.06)',
      border: '1px solid rgba(99,102,241,0.15)',
      borderRadius: 14, padding: '12px 16px', marginBottom: 16,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>📍</span>
      <span style={{ fontSize: 13, color: '#475569', flex: 1, minWidth: 0 }}>
        Showing results for <strong style={{ color: '#6366f1' }}>{city || 'default city'}</strong>.
        {' '}Enable location for accurate nearby results.
      </span>
      <button
        onClick={onAllow}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          padding: '7px 14px', borderRadius: 10, border: 'none',
          background: hov
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
          transition: 'all .18s ease', flexShrink: 0,
        }}
      >
        📍 Enable Location
      </button>
    </div>
  )
}

/* ─── Error State ────────────────────────────────────────────────────── */
function ErrorState({ type, onRetry }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 16, padding: 16 }}>
      <span style={{ fontSize: 20 }}>⚠️</span>
      <span style={{ fontSize: 13, color: '#ef4444', flex: 1 }}>Could not load nearby {type}.</span>
      <button onClick={onRetry} style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}>Retry</button>
    </div>
  )
}

/* ─── Empty Nearby ───────────────────────────────────────────────────── */
function EmptyNearby({ type, href }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 16, padding: 20 }}>
      <span style={{ fontSize: 28, opacity: 0.3 }}>{type === 'hospitals' ? '🏥' : '🧪'}</span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', margin: '0 0 4px' }}>No {type} found within 15km</p>
        <a href={href} style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>Browse all {type} →</a>
      </div>
    </div>
  )
}

/* ─── Section Header ─────────────────────────────────────────────────── */
function SectionHeader({ badge, title, sub }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 'clamp(32px,5vw,56px)' }}>
      {badge && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 100, padding: '5px 16px', marginBottom: 16, fontSize: 12, fontWeight: 600, color: '#6366f1' }}>
          {badge}
        </div>
      )}
      <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.5px' }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, margin: '0 auto' }}>{sub}</p>}
    </div>
  )
}

/* ─── Search Submit Button ───────────────────────────────────────────── */
function SearchSubmitBtn() {
  const [h, setH] = useState(false)
  return (
    <button type="submit" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '0 20px', borderRadius: 12, border: 'none',
        background: h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        minHeight: 44, flexShrink: 0,
        boxShadow: h ? '0 6px 20px rgba(99,102,241,0.5)' : '0 4px 14px rgba(99,102,241,0.35)',
        transition: 'all .18s ease', transform: h ? 'scale(1.02)' : 'scale(1)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      Search →
    </button>
  )
}

/* ─── Stat Card ──────────────────────────────────────────────────────── */
function StatCard({ value, suffix, label, icon, delay }) {
  const [vis, setVis] = useState(false)
  const [hov, setHov] = useState(false)
  const ref           = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setTimeout(() => setVis(true), delay) }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [delay])

  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ textAlign: 'center', opacity: vis ? 1 : 0, transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(20px)', transition: 'all .3s ease' }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px', backdropFilter: 'blur(10px)', transform: hov ? 'scale(1.1)' : 'scale(1)', transition: 'transform .2s ease' }}>
        {icon}
      </div>
      <div style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, background: 'linear-gradient(135deg,#a5b4fc,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-1px', marginBottom: 6 }}>
        <AnimCounter target={value} suffix={suffix} />
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

/* ─── CTA Block ──────────────────────────────────────────────────────── */
function CtaBlock() {
  const [h1, setH1] = useState(false)
  const [h2, setH2] = useState(false)
  return (
    <div style={{ background: 'linear-gradient(135deg,#4f46e5,#2563eb)', borderRadius: 28, padding: 'clamp(32px,5vw,56px) clamp(24px,4vw,48px)', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 80px rgba(79,70,229,0.3)' }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px' }}>
          Ready to Book Your First Appointment?
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Join 50,000+ patients who trust MEDLI. Takes less than 2 minutes.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <a href="/hospitals" onMouseEnter={() => setH1(true)} onMouseLeave={() => setH1(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, background: h1 ? '#f0f4ff' : '#fff', color: '#4f46e5', fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'all .18s ease', transform: h1 ? 'scale(1.02)' : 'scale(1)', boxShadow: h1 ? '0 8px 24px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.1)' }}>
            🏥 Find Hospitals
          </a>
          <a href="/auth/register" onMouseEnter={() => setH2(true)} onMouseLeave={() => setH2(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, background: h2 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'all .18s ease', backdropFilter: 'blur(10px)' }}>
            Create Account →
          </a>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const KF = `
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes hero-pulse{0%,100%{opacity:.06}50%{opacity:.12}}
  @keyframes spin-ring{to{transform:rotate(360deg)}}
  @keyframes dot-ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}
`

const QUICK = [
  { emoji:'🏥', label:'Find Hospitals', sub:'Book appointments nearby',   href:'/hospitals',      gradient:'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { emoji:'🧪', label:'Book Lab Tests', sub:'Home collection available',  href:'/labs',           gradient:'linear-gradient(135deg,#10b981,#059669)' },
  { emoji:'👨‍⚕️', label:'Online Consult', sub:'Video call with doctors',    href:'/doctors',        gradient:'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  // { emoji:'📋', label:'My Reports',     sub:'Download lab reports',       href:'/user/bookings',  gradient:'linear-gradient(135deg,#f59e0b,#f97316)' },
]

const STEPS = [
  { step:'01', icon:'🔍', title:'Search & Discover', desc:'Find top-rated hospitals, labs and doctors near you with real-time availability.', gradient:'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { step:'02', icon:'📅', title:'Book Instantly',    desc:'Select your preferred date, time slot and book in seconds. No waiting.',          gradient:'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  { step:'03', icon:'🛡️', title:'Pay Securely',      desc:'Pay via Razorpay gateway. Get instant confirmation and smart reminders.',             gradient:'linear-gradient(135deg,#10b981,#059669)' },
]

const STATS = [
  { value:500,   suffix:'+', label:'Hospitals',       icon:'🏥' },
  { value:200,   suffix:'+', label:'Labs',            icon:'🧪' },
  { value:2000,  suffix:'+', label:'Doctors',         icon:'👨‍⚕️' },
  { value:50000, suffix:'+', label:'Patients Served', icon:'❤️' },
]

const TESTI = [
  { name:'Priya Sharma',    role:'Patient',              avatar:'P', rating:5, text:'Booked a cardiologist in 2 minutes. The doctor was amazing and the platform is so smooth!' },
  { name:'Rajesh Kumar',    role:'Father of 2',          avatar:'R', rating:5, text:'Lab test with home collection was super convenient. Got reports same day. Highly recommend.' },
  { name:'Ananya Patel',    role:'Working Professional', avatar:'A', rating:5, text:'Online consultation saved me a hospital trip. Great video quality and very helpful doctor.' },
]

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter()
  const geo    = useGeoLocation()

  const [query,         setQuery]         = useState('')
  const [mounted,       setMounted]       = useState(false)
  const [retryKey,      setRetryKey]      = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)

  const heroRef       = useRef(null)
  const [heroY,  setHeroY]  = useState(0)
  const [heroOp, setHeroOp] = useState(1)

  useEffect(() => {
    setMounted(true)
    const handler = () => {
      if (!heroRef.current) return
      const sy = window.scrollY
      setHeroY(sy * 0.35)
      setHeroOp(Math.max(0, 1 - sy / 600))
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const nearbyHospUrl = geo.lat && geo.lng ? `/api/hospitals/nearby?lat=${geo.lat}&lng=${geo.lng}&radius=15000&_r=${retryKey}` : null
  const nearbyLabUrl  = geo.lat && geo.lng ? `/api/labs/nearby?lat=${geo.lat}&lng=${geo.lng}&radius=15000&_r=${retryKey}`  : null

  const { data: nearbyHosp, error: hospErr, isLoading: hospLoad } = useSWR(nearbyHospUrl, fetcher, { revalidateOnFocus:false, shouldRetryOnError:false })
  const { data: nearbyLab,  error: labErr,  isLoading: labLoad  } = useSWR(nearbyLabUrl,  fetcher, { revalidateOnFocus:false, shouldRetryOnError:false })

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const handleAllowLocation = () => {
  /* ✅ Clear cached fallback so it tries fresh geolocation */
  try {
    sessionStorage.removeItem('medli_geo')
  } catch {}

  navigator.geolocation?.getCurrentPosition(
    () => window.location.reload(),
    () => alert('Please allow location access in your browser settings, then refresh the page.')
  )
}

  return (
    <>
      <style>{KF}</style>
      <div style={{ minHeight: '100vh', background: '#f8fafc', overflowX: 'hidden' }}>
        <Navbar />

        {/* ══════════ HERO ══════════ */}
        <section ref={heroRef} style={{
          position: 'relative',
          minHeight: 'clamp(580px,85vh,780px)',
          display: 'flex', alignItems: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 35%,#1e40af 70%,#164e63 100%)',
          transform: `translateY(${heroY}px)`,
          opacity: heroOp,
        }}>
          {/* Orbs */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[
              { top:'15%',left:'8%',  w:'clamp(200px,30vw,400px)', dur:'6s', delay:'0s'  },
              { top:'auto',bottom:'15%',right:'8%', w:'clamp(150px,25vw,320px)', dur:'8s', delay:'2s'  },
              { top:'45%',left:'45%', w:'clamp(100px,20vw,250px)', dur:'5s', delay:'1s'  },
            ].map((orb, i) => (
              <div key={i} style={{
                position: 'absolute', ...orb,
                width: orb.w, height: orb.w, borderRadius: '50%',
                background: ['radial-gradient(circle,rgba(99,102,241,0.3),transparent 70%)','radial-gradient(circle,rgba(6,182,212,0.25),transparent 70%)','radial-gradient(circle,rgba(139,92,246,0.2),transparent 70%)'][i],
                filter: 'blur(60px)',
                animation: `hero-pulse ${orb.dur} ease infinite ${orb.delay}`,
              }} />
            ))}
          </div>

          {/* Grid */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

          {/* Content grid */}
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,32px)', width: '100%', position: 'relative', zIndex: 1 }}>
            <style>{`@media(min-width:1024px){.hg{grid-template-columns:1fr 1fr!important}}`}</style>
            <div className="hg" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40, alignItems: 'center' }}>

              {/* Left col */}
              <div>
                {/* Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
                  <span style={{ fontSize: 13 }}>✨</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>Trusted by 50,000+ patients across India</span>
                </div>

                {/* Headline */}
                <h1 style={{ fontSize: 'clamp(32px,5vw,60px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
                  Book Your<br />
                  <WordRotator /><br />
                  <span style={{ background: 'linear-gradient(135deg,#67e8f9,#a5f3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Without the Wait
                  </span>
                </h1>

                <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 32, maxWidth: 520 }}>
                  India&apos;s trusted platform for hospital appointments, lab tests and online doctor consultations — all in one place.
                </p>

                {/* Search */}
                <form onSubmit={handleSearch} style={{
                  background: 'rgba(255,255,255,0.97)', borderRadius: 16, padding: 6,
                  display: 'flex', gap: 6, maxWidth: 540,
                  boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
                  border: `1.5px solid ${searchFocused ? 'rgba(99,102,241,0.5)' : 'transparent'}`,
                  transition: 'border-color .2s ease', marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: '6px 10px' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
                    <input
                      type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                      placeholder="Search hospitals, labs, doctors..."
                      style={{ flex: 1, fontSize: 14, color: '#0f172a', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', minHeight: 36 }}
                    />
                  </div>

                  {/* Location pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', borderLeft: '1.5px solid #f1f5f9', minWidth: 0 }}
                    className="hide-xs"
                  >
                    <style>{`@media(max-width:480px){.hide-xs{display:none!important}}`}</style>
                    <span style={{ fontSize: 14 }}>{geo.loading ? '⏳' : '📍'}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {geo.address ? geo.address.split(',')[0] : geo.loading ? 'Detecting...' : 'Near me'}
                    </span>
                  </div>

                  <SearchSubmitBtn />
                </form>

                {/* Trust pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {[
                    { icon:'🛡️', label:'Verified Providers' },
                    { icon:'⚡', label:'Instant Booking'    },
                    { icon:'⭐', label:'4.8★ Avg Rating'    },
                    { icon:'🔒', label:'Secure Payments'    },
                  ].map((b) => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500 }}>
                      <span style={{ fontSize: 13 }}>{b.icon}</span>{b.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right col — floating cards (desktop only) */}
              <div style={{ position: 'relative', height: 440, display: 'none' }} className="hero-cards">
                <style>{`@media(min-width:1024px){.hero-cards{display:block!important}}`}</style>

                <FloatCard delay={0} style={{ top: 0, right: 0, width: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏥</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>500+ Hospitals</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Verified and rated</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map((s) => <span key={s} style={{ fontSize: 12 }}>⭐</span>)}
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>4.8 avg</span>
                  </div>
                </FloatCard>

                <FloatCard delay={0.8} style={{ top: 130, left: 0, width: 228 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧪</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>Home Collection</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Lab tests at your door</p>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '6px 12px', fontSize: 11, color: '#059669', fontWeight: 600 }}>
                    ✓ Free pickup · Same-day reports
                  </div>
                </FloatCard>

                <FloatCard delay={1.5} style={{ bottom: 0, right: 20, width: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎥</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>Video Consult</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Talk to doctors live</p>
                    </div>
                  </div>
                  {/* ✅ FIXED: removed stray quote after 10 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ position: 'relative', width: 10, height: 10 }}>
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981', animation: 'dot-ping 1.5s ease infinite' }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', position: 'relative' }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>2,000+ doctors online</span>
                  </div>
                </FloatCard>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ QUICK ACTIONS ══════════ */}
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', marginTop: -40, position: 'relative', zIndex: 10, marginBottom: 64 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
            {QUICK.map((q) => <QuickAction key={q.label} {...q} />)}
          </div>
        </section>

        {/* ══════════ NEARBY HOSPITALS ══════════ */}
      {/* ══════════ NEARBY HOSPITALS ══════════ */}
<NearbySection
  title="🏥 Hospitals Near You"
  subtitle={
    geo.isDefault
      ? `Showing top-rated hospitals near ${geo.address || 'default city'}`
      : 'Top-rated hospitals within 15km'
  }
  viewHref="/hospitals"
  viewColor="#6366f1"
>
  {/* ✅ Show soft location banner if using default fallback */}
  {mounted && geo.isDefault && (
    <LocationBanner
      onAllow={handleAllowLocation}
      city={geo.address?.split(',')[0] || 'your city'}
    />
  )}

  {!mounted || geo.loading ? (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)',
      borderRadius: 16, padding: 16,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: '2px solid #6366f1', borderTopColor: 'transparent',
        animation: 'spin-ring .8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: '#6366f1' }}>Detecting your location...</span>
    </div>
  ) : hospLoad ? (
    <SkeletonRow />
  ) : hospErr ? (
    <ErrorState type="hospitals" onRetry={() => setRetryKey((k) => k + 1)} />
  ) : !nearbyHosp?.length ? (
    <EmptyNearby type="hospitals" href="/hospitals" />
  ) : (
    <div style={{ overflowX: 'auto', marginInline: '-4px', paddingInline: '4px' }}>
      <div style={{ display: 'flex', gap: 16, paddingBottom: 12 }}>
        {nearbyHosp.map((h, i) => (
          <NearbyHospCard key={h.id || i} h={h} onClick={() => router.push(`/hospitals/${h.id}`)} />
        ))}
      </div>
    </div>
  )}
</NearbySection>

        {/* ══════════ NEARBY LABS ══════════ */}
{/* ══════════ NEARBY LABS ══════════ */}
<NearbySection
  title="🧪 Labs Near You"
  subtitle={
    geo.isDefault
      ? `Showing trusted labs near ${geo.address || 'default city'}`
      : 'Trusted labs with home collection within 15km'
  }
  viewHref="/labs"
  viewColor="#10b981"
>
  {/* ✅ Show soft location banner if using default fallback */}
  {mounted && geo.isDefault && (
    <LocationBanner
      onAllow={handleAllowLocation}
      city={geo.address?.split(',')[0] || 'your city'}
    />
  )}

  {!mounted || geo.loading ? (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)',
      borderRadius: 16, padding: 16,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: '2px solid #10b981', borderTopColor: 'transparent',
        animation: 'spin-ring .8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: '#10b981' }}>Detecting your location...</span>
    </div>
  ) : labLoad ? (
    <SkeletonRow />
  ) : labErr ? (
    <ErrorState type="labs" onRetry={() => setRetryKey((k) => k + 1)} />
  ) : !nearbyLab?.length ? (
    <EmptyNearby type="labs" href="/labs" />
  ) : (
    <div style={{ overflowX: 'auto', marginInline: '-4px', paddingInline: '4px' }}>
      <div style={{ display: 'flex', gap: 16, paddingBottom: 12 }}>
        {nearbyLab.map((l, i) => (
          <NearbyLabCard key={l.id || i} l={l} onClick={() => router.push(`/labs/${l.id}`)} />
        ))}
      </div>
    </div>
  )}
</NearbySection>

        {/* ══════════ HOW IT WORKS ══════════ */}
        <section style={{ background: 'linear-gradient(180deg,#f8fafc,#fff)', padding: 'clamp(48px,8vw,96px) 0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'clamp(300px,50vw,600px)', height: 'clamp(300px,50vw,600px)', borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.05),transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', position: 'relative', zIndex: 1 }}>
            <SectionHeader badge="⚡ Simple Process" title="How MEDLI Works" sub="Book your healthcare in 3 simple steps" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24 }}>
              {STEPS.map((s, i) => <StepCard key={s.step} {...s} delay={i * 150} />)}
            </div>
          </div>
        </section>

        {/* ══════════ STATS ══════════ */}
        <section style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b,#1e3a8a)', padding: 'clamp(48px,8vw,96px) 0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '30%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle,rgba(6,182,212,0.1),transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.5px' }}>Numbers That Speak</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Growing every day with your trust</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'clamp(16px,3vw,32px)' }}>
              {STATS.map((s, i) => <StatCard key={s.label} {...s} delay={i * 100} />)}
            </div>
          </div>
        </section>

        {/* ══════════ TESTIMONIALS ══════════ */}
        <section style={{ padding: 'clamp(48px,8vw,96px) 0', background: '#fff' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)' }}>
            <SectionHeader badge="❤️ Patient Stories" title="What Our Patients Say" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
              {TESTI.map((t, i) => <TestiCard key={t.name} {...t} delay={i * 100} />)}
            </div>
          </div>
        </section>

        {/* ══════════ CTA ══════════ */}
        <section style={{ padding: 'clamp(32px,6vw,72px) 0' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)' }}>
            <CtaBlock />
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}