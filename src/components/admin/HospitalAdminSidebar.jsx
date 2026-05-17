'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

function usePathname() {
  const [path, setPath] = useState('')
  useEffect(() => {
    setPath(window.location.pathname)
    const fn = () => setPath(window.location.pathname)
    window.addEventListener('popstate', fn)
    return () => window.removeEventListener('popstate', fn)
  }, [])
  return path
}

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/hospital-admin/dashboard',   icon: '📊' },
  { label: 'Bookings',    href: '/hospital-admin/bookings',    icon: '📅' },
  { label: 'Doctors',     href: '/hospital-admin/doctors',     icon: '👨‍⚕️' },
  { label: 'Coupons',     href: '/hospital-admin/coupons',     icon: '🏷️' },
  { label: 'Settlements', href: '/hospital-admin/settlements', icon: '💰' },
  { label: 'Reports',     href: '/hospital-admin/reports',     icon: '📈' },
  { label: 'Settings',    href: '/hospital-admin/settings',    icon: '⚙️' },
]

const KF = `
  @keyframes ha-slide { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  @keyframes ha-fade  { from{opacity:0} to{opacity:1} }
`

function NavItem({ item, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <a
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 12, marginBottom: 2,
        textDecoration: 'none',
        background: active
          ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))'
          : h ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
        color: active ? '#a5b4fc' : h ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: 'all .15s ease', cursor: 'pointer',
      }}
    >
      <span style={{
        fontSize: 16, flexShrink: 0,
        opacity: active ? 1 : h ? 0.9 : 0.6,
        transition: 'opacity .15s ease',
      }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {active && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          boxShadow: '0 0 6px rgba(99,102,241,0.6)',
        }} />
      )}
    </a>
  )
}

/* ─── ✅ Logo (purple theme — Hospital Admin) ────────────────────────── */
function SidebarLogo({ size = 'normal' }) {
  const isSmall = size === 'small'
  const boxSize = isSmall ? 34 : 38

  return (
    <a
      href="/hospital-admin/dashboard"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none', flexShrink: 0,
      }}
    >
      <div style={{
        width: boxSize, height: boxSize, borderRadius: 10,
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, padding: 6, boxSizing: 'border-box',
        boxShadow: '0 4px 14px rgba(99,102,241,0.45)',
      }}>
        <img
          src="/MEDLI-LOGOICON.png"
          alt="MEDLI"
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            display: 'block',
          }}
        />
      </div>
      <div style={{ lineHeight: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isSmall ? 14 : 15, fontWeight: 900,
          backgroundImage: 'linear-gradient(135deg,#818cf8,#a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', letterSpacing: '-0.3px', lineHeight: 1,
        }}>MEDLI</div>
        <div style={{
          fontSize: 9, color: 'rgba(255,255,255,0.4)',
          letterSpacing: '1.3px', fontWeight: 600,
          textTransform: 'uppercase', marginTop: 3,
        }}>Hospital Admin</div>
      </div>
    </a>
  )
}

function SidebarContent({ pathname, onClose }) {
  const { user, logout } = useAuth()
  const [logoutH, setLogoutH] = useState(false)
  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'H'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)',
    }}>
      {/* Header with Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64, padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <SidebarLogo />
        {onClose && <CloseBtn onClick={onClose} />}
      </div>

      {/* User info */}
      {user && (
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14,
            flexShrink: 0, overflow: 'hidden', position: 'relative',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}>
            {user.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 9, height: 9, borderRadius: '50%',
              background: '#10b981', border: '1.5px solid #0f172a',
            }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{
              fontSize: 13, fontWeight: 700, color: '#fff', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{user.name}</p>
            <p style={{
              fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '1px 0 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user.email || (user.phone ? `+91 ${user.phone}` : 'Hospital Admin')}
            </p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', scrollbarWidth: 'none' }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/')
          return <NavItem key={item.href} item={item} active={active} onClick={onClose} />
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button
          onClick={logout}
          onMouseEnter={() => setLogoutH(true)}
          onMouseLeave={() => setLogoutH(false)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10, border: 'none',
            background: logoutH ? 'rgba(239,68,68,0.1)' : 'transparent',
            color: logoutH ? '#fca5a5' : 'rgba(255,255,255,0.35)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .15s ease',
          }}
        >
          <span style={{ fontSize: 15 }}>🚪</span>
          Sign out
        </button>
      </div>
    </div>
  )
}

function CloseBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: 'none',
        background: h ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .15s ease',
      }}>✕</button>
  )
}

/* ─── Mobile Top Bar — Centered Logo ─────────────────────────────────── */
function MobileTopBar({ onOpenMenu }) {
  const [h, setH] = useState(false)
  return (
    <div className="ha-mobile-topbar" style={{
      position: 'sticky', top: 0, left: 0, right: 0,
      zIndex: 800, height: 56,
      background: 'linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'none',
      alignItems: 'center', padding: '0 14px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      flexShrink: 0,
      gridTemplateColumns: '40px 1fr 40px',
    }}>
      <button
        onClick={onOpenMenu}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        aria-label="Open menu"
        style={{
          width: 40, height: 40, borderRadius: 10, border: 'none',
          background: h ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
          cursor: 'pointer', gridColumn: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .15s ease', flexShrink: 0,
        }}
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <rect y="0"  width="18" height="2" rx="1" fill="rgba(255,255,255,0.9)" />
          <rect y="6"  width="13" height="2" rx="1" fill="#818cf8" />
          <rect y="12" width="15" height="2" rx="1" fill="rgba(255,255,255,0.9)" />
        </svg>
      </button>
      <div style={{ gridColumn: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <SidebarLogo size="small" />
      </div>
      <div style={{ gridColumn: 3, width: 40, height: 40 }} />
    </div>
  )
}

export default function HospitalAdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <style>{KF}</style>
      <style>{`
        @media(min-width:1024px){
          .ha-desktop      { display:block !important; }
          .ha-mobile-topbar{ display:none  !important; }
        }
        @media(max-width:1023px){
          .ha-desktop      { display:none !important; }
          .ha-mobile-topbar{ display:grid !important; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside
        className="ha-desktop"
        style={{ width: 240, height: '100vh', position: 'sticky', top: 0, flexShrink: 0, display: 'none' }}
      >
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <MobileTopBar onOpenMenu={() => setOpen(true)} />

      {/* Mobile drawer */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 900,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            animation: 'ha-fade .2s ease',
          }} />
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: 'min(280px, 85vw)', zIndex: 910,
            animation: 'ha-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '8px 0 32px rgba(0,0,0,0.3)',
          }}>
            <SidebarContent pathname={pathname} onClose={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}