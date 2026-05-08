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

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',   href: '/super-admin/dashboard', icon: '📊' },
      { label: 'Analytics',   href: '/super-admin/analytics', icon: '📈' },
      { label: 'Revenue',     href: '/super-admin/revenue',   icon: '💰' },
    ],
  },
  {
    label: 'Entities',
    items: [
      { label: 'Hospitals',   href: '/super-admin/hospitals', icon: '🏥' },
      { label: 'Labs',        href: '/super-admin/labs',      icon: '🧪' },
      { label: 'Doctors',     href: '/super-admin/doctors',   icon: '👨‍⚕️' },
      { label: 'Users',       href: '/super-admin/users',     icon: '👥' },
      { label: 'Regions',     href: '/super-admin/regions',   icon: '🗺️' },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { label: 'Bookings',     href: '/super-admin/bookings',     icon: '📅' },
      { label: 'Payments',     href: '/super-admin/payments',     icon: '💳' },
      { label: 'Invoices',     href: '/super-admin/invoices',     icon: '🧾' },
      { label: 'Settlements',  href: '/super-admin/settlements',  icon: '🏦' },
      { label: 'Refunds',      href: '/super-admin/refunds',      icon: '↩️' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Coupons',        href: '/super-admin/coupons',       icon: '🏷️' },
      { label: 'Fees',           href: '/super-admin/fees',          icon: '📊' },
      { label: 'Bank Accounts',  href: '/super-admin/bank-accounts', icon: '🏦' },
      { label: 'Notifications',  href: '/super-admin/notifications', icon: '🔔' },
      { label: 'Roles',          href: '/super-admin/roles',         icon: '🛡️' },
      { label: 'Audit Logs',     href: '/super-admin/audit-logs',    icon: '📋' },
      { label: 'Cache & Queues', href: '/super-admin/cache',         icon: '⚙️' },
      { label: 'Settings',       href: '/super-admin/settings',      icon: '🔧' },
    ],
  },
]

const KF = `
  @keyframes sa-slide { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  @keyframes sa-fade  { from{opacity:0} to{opacity:1} }
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
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 10px', borderRadius: 10, marginBottom: 1,
        textDecoration: 'none',
        background: active
          ? 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))'
          : h ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: active
          ? '1px solid rgba(99,102,241,0.25)'
          : '1px solid transparent',
        color: active ? '#a5b4fc' : h ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.42)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: 'all .14s ease', cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 15, flexShrink: 0, opacity: active ? 1 : h ? 0.88 : 0.55 }}>
        {item.icon}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
      {active && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          boxShadow: '0 0 5px rgba(99,102,241,0.6)',
        }} />
      )}
    </a>
  )
}

function SidebarContent({ pathname, onClose }) {
  const { user, logout } = useAuth()
  const [logoutH, setLogoutH] = useState(false)
  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'SA'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'linear-gradient(180deg,#0a0a14 0%,#12101e 100%)',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, padding: '0 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, boxShadow: '0 3px 10px rgba(99,102,241,0.45)',
          }}>🏥</div>
          <div>
            <div style={{
              fontSize: 14, fontWeight: 800,
              backgroundImage: 'linear-gradient(135deg,#818cf8,#a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', letterSpacing: '-0.3px', lineHeight: 1,
            }}>MEDLI</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', fontWeight: 600, textTransform: 'uppercase' }}>
              Super Admin
            </div>
          </div>
        </div>
        {onClose && <CloseBtn onClick={onClose} />}
      </div>

      {/* User info */}
      {user && (
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 12,
            flexShrink: 0, overflow: 'hidden',
          }}>
            {user.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Super Admin
            </p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', scrollbarWidth: 'none' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <p style={{
              fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)',
              textTransform: 'uppercase', letterSpacing: '1.2px',
              padding: '4px 10px 5px', margin: 0,
            }}>
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/')
              return <NavItem key={item.href} item={item} active={active} onClick={onClose} />
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <button
          onClick={logout}
          onMouseEnter={() => setLogoutH(true)}
          onMouseLeave={() => setLogoutH(false)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', borderRadius: 10, border: 'none',
            background: logoutH ? 'rgba(239,68,68,0.1)' : 'transparent',
            color: logoutH ? '#fca5a5' : 'rgba(255,255,255,0.3)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .14s ease',
          }}
        >
          <span style={{ fontSize: 14 }}>🚪</span>
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
        width: 30, height: 30, borderRadius: 7, border: 'none',
        background: h ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .14s ease',
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
        width: 42, height: 42, borderRadius: 11,
        border: '1px solid rgba(255,255,255,0.08)',
        background: h ? 'rgba(99,102,241,0.2)' : 'rgba(10,10,20,0.95)',
        backdropFilter: 'blur(12px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'background .14s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
      }}>
      <svg width="17" height="13" viewBox="0 0 17 13" fill="none">
        <rect y="0"  width="17" height="2" rx="1" fill="rgba(255,255,255,0.75)" />
        <rect y="5.5" width="12" height="2" rx="1" fill="#818cf8" />
        <rect y="11" width="14" height="2" rx="1" fill="rgba(255,255,255,0.75)" />
      </svg>
    </button>
  )
}

export default function SuperAdminSidebar() {
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
        className="sa-desktop">
        <style>{`@media(min-width:1024px){.sa-desktop{display:block!important}.sa-burger{display:none!important}}@media(max-width:1023px){.sa-burger{display:flex!important}}`}</style>
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile hamburger */}
      <div className="sa-burger" style={{ display: 'none' }}>
        <HamburgerBtn onClick={() => setOpen(true)} />
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 900,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            animation: 'sa-fade .2s ease',
          }} />
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: 240, zIndex: 910,
            animation: 'sa-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <SidebarContent pathname={pathname} onClose={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}