'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  BarChart3,
  IndianRupee,
  Building2,
  FlaskConical,
  Stethoscope,
  Users,
  Map,
  CalendarDays,
  CreditCard,
  Receipt,
  Landmark,
  RotateCcw,
  TicketPercent,
  Bell,
  Settings,
  WalletCards,
  LifeBuoy,
  LogOut,
  X,
  Menu,
} from 'lucide-react'

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
      { label: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
      // { label: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
      { label: 'Revenue', href: '/super-admin/revenue', icon: IndianRupee },
    ],
  },
  {
    label: 'Entities',
    items: [
      { label: 'Hospitals', href: '/super-admin/hospitals', icon: Building2 },
      { label: 'Labs', href: '/super-admin/labs', icon: FlaskConical },
      { label: 'Doctors', href: '/super-admin/doctors', icon: Stethoscope },
      { label: 'Users', href: '/super-admin/users', icon: Users },
      // { label: 'Regions', href: '/super-admin/regions', icon: Map },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { label: 'Bookings', href: '/super-admin/bookings', icon: CalendarDays },
      { label: 'Payments', href: '/super-admin/payments', icon: CreditCard },
      // { label: 'Invoices', href: '/super-admin/invoices', icon: Receipt },
      { label: 'Settlements', href: '/super-admin/settlements', icon: Landmark },
      { label: 'Refunds', href: '/super-admin/refunds', icon: RotateCcw },
    ],
  },
{
  label: 'Platform',
  items: [
    { label: 'Coupons', href: '/super-admin/coupons', icon: TicketPercent },
    { label: 'Bank Accounts', href: '/super-admin/bank-accounts', icon: WalletCards },
    // { label: 'Notifications', href: '/super-admin/notifications', icon: Bell },
    { label: 'Support', href: '/super-admin/support', icon: LifeBuoy },
    { label: 'Settings', href: '/super-admin/settings', icon: Settings },
  ],
}, 
]

const KF = `
  @keyframes sa-slide { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  @keyframes sa-fade  { from{opacity:0} to{opacity:1} }
`

function NavItem({ item, active, onClick }) {
  const [h, setH] = useState(false)
  const Icon = item.icon

  return (
    <a
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        borderRadius: 10,
        marginBottom: 1,
        textDecoration: 'none',
        background: active
          ? 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))'
          : h ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
        color: active ? '#a5b4fc' : h ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.42)',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        transition: 'all .14s ease',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 17,
          height: 17,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: active ? 1 : h ? 0.88 : 0.55,
        }}
      >
        <Icon size={16} strokeWidth={2.1} />
      </span>

      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>

      {active && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            boxShadow: '0 0 5px rgba(99,102,241,0.6)',
          }}
        />
      )}
    </a>
  )
}

function SidebarLogo({ size = 'normal' }) {
  const isSmall = size === 'small'
  const boxSize = isSmall ? 32 : 36

  return (
    <a
      href="/super-admin/dashboard"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: 9,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          padding: 5,
          boxSizing: 'border-box',
          boxShadow: '0 3px 12px rgba(99,102,241,0.5)',
        }}
      >
        <img
          src="/MEDLI-LOGOICON.png"
          alt="MEDLI"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            display: 'block',
          }}
        />
      </div>

      <div style={{ lineHeight: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: isSmall ? 13 : 14,
            fontWeight: 800,
            backgroundImage: 'linear-gradient(135deg,#818cf8,#a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.3px',
            lineHeight: 1,
          }}
        >
          MEDLI
        </div>
        <div
          style={{
            fontSize: 8,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '1.4px',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginTop: 3,
          }}
        >
          Super Admin
        </div>
      </div>
    </a>
  )
}

function SidebarContent({ pathname, onClose }) {
  const { user, logout } = useAuth()
  const [logoutH, setLogoutH] = useState(false)
  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'SA'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg,#0a0a14 0%,#12101e 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
          padding: '0 14px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}
      >
        <SidebarLogo />
        {onClose && <CloseBtn onClick={onClose} />}
      </div>

      {user && (
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
                border: '1.5px solid #0a0a14',
              }}
            />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
            </p>
            <p
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.35)',
                margin: '1px 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Super Admin
            </p>
          </div>
        </div>
      )}

      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', scrollbarWidth: 'none' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.22)',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                padding: '4px 10px 5px',
                margin: 0,
              }}
            >
              {group.label}
            </p>

            {group.items.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/')
              return <NavItem key={item.href} item={item} active={active} onClick={onClose} />
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <button
          onClick={logout}
          onMouseEnter={() => setLogoutH(true)}
          onMouseLeave={() => setLogoutH(false)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '8px 10px',
            borderRadius: 10,
            border: 'none',
            background: logoutH ? 'rgba(239,68,68,0.1)' : 'transparent',
            color: logoutH ? '#fca5a5' : 'rgba(255,255,255,0.3)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all .14s ease',
          }}
        >
          <LogOut size={15} strokeWidth={2.1} />
          Sign out
        </button>
      </div>
    </div>
  )
}

function CloseBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 30,
        height: 30,
        borderRadius: 7,
        border: 'none',
        background: h ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background .14s ease',
      }}
    >
      <X size={17} strokeWidth={2.2} />
    </button>
  )
}

function MobileTopBar({ onOpenMenu }) {
  const [h, setH] = useState(false)
  return (
    <div
      className="sa-mobile-topbar"
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 800,
        height: 56,
        background: 'linear-gradient(180deg,#0a0a14 0%,#12101e 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'none',
        alignItems: 'center',
        padding: '0 14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        flexShrink: 0,
        gridTemplateColumns: '40px 1fr 40px',
      }}
    >
      <button
        onClick={onOpenMenu}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        aria-label="Open menu"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: 'none',
          background: h ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
          cursor: 'pointer',
          gridColumn: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background .14s ease',
          flexShrink: 0,
          color: '#fff',
        }}
      >
        <Menu size={17} strokeWidth={2.2} />
      </button>

      <div style={{ gridColumn: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <SidebarLogo size="small" />
      </div>

      <div style={{ gridColumn: 3, width: 40, height: 40 }} />
    </div>
  )
}

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <style>{KF}</style>
      <style>{`
        @media(min-width:1024px){
          .sa-desktop      { display:block !important; }
          .sa-mobile-topbar{ display:none  !important; }
        }
        @media(max-width:1023px){
          .sa-desktop      { display:none !important; }
          .sa-mobile-topbar{ display:grid !important; }
        }
      `}</style>

      <aside
        className="sa-desktop"
        style={{ width: 240, height: '100vh', position: 'sticky', top: 0, flexShrink: 0, display: 'none' }}
      >
        <SidebarContent pathname={pathname} />
      </aside>

      <MobileTopBar onOpenMenu={() => setOpen(true)} />

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 900,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              animation: 'sa-fade .2s ease',
            }}
          />
          <aside
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(280px, 85vw)',
              zIndex: 910,
              animation: 'sa-slide .28s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: '8px 0 32px rgba(0,0,0,0.3)',
            }}
          >
            <SidebarContent pathname={pathname} onClose={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}