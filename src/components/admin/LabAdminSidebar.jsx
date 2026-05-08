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
  { label: 'Dashboard',   href: '/lab-admin/dashboard',   icon: '📊' },
  { label: 'Bookings',    href: '/lab-admin/bookings',    icon: '📅' },
  { label: 'Tests',       href: '/lab-admin/tests',       icon: '🧪' },
  { label: 'Reports',     href: '/lab-admin/reports',     icon: '📈' },
  { label: 'Settlements', href: '/lab-admin/settlements', icon: '💰' },
  { label: 'Settings',    href: '/lab-admin/settings',    icon: '⚙️' },
]

const KF = `
  @keyframes la-slide { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  @keyframes la-fade  { from{opacity:0} to{opacity:1} }
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
          ? 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.1))'
          : h ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: active
          ? '1px solid rgba(16,185,129,0.25)'
          : '1px solid transparent',
        color: active
          ? '#6ee7b7'
          : h ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: 'all .15s ease', cursor: 'pointer',
      }}
    >
      <span style={{
        fontSize: 16, flexShrink: 0,
        opacity: active ? 1 : h ? 0.9 : 0.6,
        transition: 'opacity .15s ease',
      }}>
        {item.icon}
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {active && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#10b981,#059669)',
          boxShadow: '0 0 6px rgba(16,185,129,0.6)',
        }} />
      )}
    </a>
  )
}

function SidebarContent({ pathname, onClose }) {
  const { user, logout } = useAuth()
  const [logoutH, setLogoutH] = useState(false)
  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'L'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'linear-gradient(180deg,#0f172a 0%,#064e3b 100%)',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg,#10b981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 3px 10px rgba(16,185,129,0.4)',
          }}>🧪</div>
          <div>
            <div style={{
              fontSize: 15, fontWeight: 800,
              backgroundImage: 'linear-gradient(135deg,#6ee7b7,#34d399)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', letterSpacing: '-0.3px', lineHeight: 1,
            }}>MEDLI</div>
            <div style={{
              fontSize: 9, color: 'rgba(255,255,255,0.35)',
              letterSpacing: '1.5px', fontWeight: 600, textTransform: 'uppercase',
            }}>Lab Admin</div>
          </div>
        </div>
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
            background: 'linear-gradient(135deg,#10b981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14,
            flexShrink: 0, overflow: 'hidden',
          }}>
            {user.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
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
              {user.email || (user.phone ? `+91 ${user.phone}` : 'Lab Admin')}
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

function HamburgerBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      aria-label="Open menu"
      style={{
        position: 'fixed', top: 12, left: 12, zIndex: 800,
        width: 44, height: 44, borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        background: h ? 'rgba(16,185,129,0.2)' : 'rgba(15,23,42,0.92)',
        backdropFilter: 'blur(12px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'background .15s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
        <rect y="0"  width="18" height="2" rx="1" fill="rgba(255,255,255,0.8)" />
        <rect y="6"  width="13" height="2" rx="1" fill="#34d399" />
        <rect y="12" width="15" height="2" rx="1" fill="rgba(255,255,255,0.8)" />
      </svg>
    </button>
  )
}

export default function LabAdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <style>{KF}</style>

      {/* Desktop */}
      <aside style={{ width: 240, height: '100vh', position: 'sticky', top: 0, flexShrink: 0, display: 'none' }}
        className="la-desktop">
        <style>{`@media(min-width:1024px){.la-desktop{display:block!important}.la-burger{display:none!important}}@media(max-width:1023px){.la-burger{display:flex!important}}`}</style>
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile hamburger */}
      <div className="la-burger" style={{ display: 'none' }}>
        <HamburgerBtn onClick={() => setOpen(true)} />
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 900,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            animation: 'la-fade .2s ease',
          }} />
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: 240, zIndex: 910,
            animation: 'la-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <SidebarContent pathname={pathname} onClose={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}