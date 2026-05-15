'use client'

import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

/* ─── Hooks ──────────────────────────────────────────────────────────────── */
function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => setM(true), [])
  return m
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [threshold])
  return scrolled
}

function useClickOutside(ref, cb) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) cb() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [ref, cb])
}

function useActiveLink() {
  const [path, setPath] = useState('')
  useEffect(() => {
    setPath(window.location.pathname)
    const fn = () => setPath(window.location.pathname)
    window.addEventListener('popstate', fn)
    return () => window.removeEventListener('popstate', fn)
  }, [])
  return path
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Hospitals', href: '/hospitals', icon: '🏥' },
  { label: 'Labs',      href: '/labs',      icon: '🧪' },
  { label: 'Doctors',   href: '/doctors',   icon: '👨‍⚕️' },
  { label: 'Search',    href: '/search',    icon: '🔍' },
]

const USER_MENU = [
  { icon: '📊', label: 'Dashboard',      href: '/user/dashboard'         },
  { icon: '📅', label: 'My Bookings',    href: '/user/bookings'          },
  { icon: '👤', label: 'My Profile',     href: '/user/profile'           },
  { icon: '👨‍👩‍👧', label: 'Family Members', href: '/user/profile?tab=family' },
  { icon: '🧾', label: 'Invoices',       href: '/user/invoices'          },
]

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const KF = `
  @keyframes nb-slideDown  { from { opacity:0; transform:translateY(-6px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
  @keyframes nb-slideRight { from { transform:translateX(100%) } to { transform:translateX(0) } }
  @keyframes nb-fadeIn     { from { opacity:0 } to { opacity:1 } }
  @keyframes nb-shimmer    { 0%,100%{opacity:.4} 50%{opacity:1} }
  @keyframes nb-ping       { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2);opacity:0} }

  * { box-sizing: border-box; }

  .nb-link {
    color: #475569;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 14px;
    border-radius: 10px;
    transition: all .18s ease;
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .nb-link:hover       { color: #6366f1; background: rgba(99,102,241,.07); }
  .nb-link.nb-active   { color: #6366f1; background: rgba(99,102,241,.09); font-weight: 600; }

  .nb-drop-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 10px;
    font-size: 13px; font-weight: 500; color: #334155;
    text-decoration: none; transition: all .12s ease;
    cursor: pointer; border: none; background: transparent;
    width: 100%; text-align: left;
  }
  .nb-drop-item:hover { background: rgba(99,102,241,.07); color: #6366f1; }
  .nb-drop-item.nb-danger { color: #ef4444; }
  .nb-drop-item.nb-danger:hover { background: rgba(239,68,68,.07); }

  .nb-mob-link {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; border-radius: 13px;
    font-size: 14px; font-weight: 500; color: #334155;
    text-decoration: none; transition: all .15s ease;
    min-height: 48px; position: relative; overflow: hidden;
    border: 1px solid transparent;
  }
  .nb-mob-link:hover  { background: rgba(99,102,241,.07); color: #6366f1; border-color: rgba(99,102,241,.1); }
  .nb-mob-link.nb-active {
    background: linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08));
    color: #6366f1; font-weight: 600;
    border-color: rgba(99,102,241,.15);
  }

  .nb-icon-btn {
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; cursor: pointer;
    border-radius: 10px; transition: all .15s ease;
  }
  .nb-icon-btn:hover { background: #f1f5f9; }

  .nb-footer-link { color: #475569; text-decoration: none; font-size: 13px; transition: color .15s; }
  .nb-footer-link:hover { color: #ffffff; }

  /* Responsive breakpoints */
  @media (max-width: 767px) {
    .nb-desktop { display: none !important; }
    .nb-mobile  { display: flex !important; }
  }
  @media (min-width: 768px) {
    .nb-desktop { display: flex !important; }
    .nb-mobile  { display: none !important; }
  }
`

/* ═══════════════════════════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const mounted  = useMounted()
  const scrolled = useScrolled()
  const path     = useActiveLink()

  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)

  const dropRef = useRef(null)
  useClickOutside(dropRef, () => setDropdownOpen(false))

  /* Lock body when drawer open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const closeDrawer = useCallback(() => {
    setDrawerClosing(true)
    setTimeout(() => { setDrawerOpen(false); setDrawerClosing(false) }, 280)
  }, [])

  const initials = user?.name
    ?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <>
      <style>{KF}</style>

      {/* ── Bar ── */}
      <nav style={{
        position:       'fixed',
        top: 0, left: 0, right: 0,
        zIndex:         900,
        height:         64,
        background:     scrolled ? 'rgba(255,255,255,.98)' : 'rgba(255,255,255,.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom:   scrolled ? '1px solid rgba(0,0,0,.09)' : '1px solid transparent',
        boxShadow:      scrolled ? '0 4px 32px rgba(0,0,0,.07)' : 'none',
        transition:     'all .3s ease',
      }}>
        <div style={{
          maxWidth:       1280,
          margin:         '0 auto',
          padding:        '0 clamp(16px,3vw,32px)',
          height:         '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            12,
        }}>

          {/* Logo */}
          <Logo />

          {/* Desktop center links */}
          <div className="nb-desktop" style={{
            alignItems:     'center',
            gap:            2,
            flex:           1,
            justifyContent: 'center',
          }}>
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`nb-link${path === l.href ? ' nb-active' : ''}`}
              >
                {l.label}
                {path === l.href && (
                  <span style={{
                    position:     'absolute',
                    bottom:       0,
                    left:         '50%',
                    transform:    'translateX(-50%)',
                    width:        20,
                    height:       2.5,
                    borderRadius: 2,
                    background:   'linear-gradient(90deg,#6366f1,#8b5cf6)',
                  }} />
                )}
              </a>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="nb-desktop" style={{ alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!mounted || loading
              ? <AuthSkeleton />
              : user
                ? (
                  <div ref={dropRef} style={{ position: 'relative' }}>
                    <AvatarButton
                      user={user}
                      initials={initials}
                      open={dropdownOpen}
                      onClick={() => setDropdownOpen((o) => !o)}
                    />
                    {dropdownOpen && (
                      <UserDropdown
                        user={user}
                        initials={initials}
                        onClose={() => setDropdownOpen(false)}
                        onLogout={() => { logout(); setDropdownOpen(false) }}
                      />
                    )}
                  </div>
                )
                : <GuestButtons />
            }
          </div>

          {/* Hamburger */}
          <button
            className="nb-mobile nb-icon-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              width: 42, height: 42,
              border:  '1.5px solid #f1f5f9',
              background: '#fff',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
              <rect y="0"  width="20" height="2.5" rx="1.25" fill="#475569"/>
              <rect y="6.5" width="14" height="2.5" rx="1.25" fill="#6366f1"/>
              <rect y="13" width="17" height="2.5" rx="1.25" fill="#475569"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Spacer ── */}
      <div style={{ height: 64, flexShrink: 0 }} />

      {/* ── Mobile Drawer ── */}
      {drawerOpen && (
        <MobileDrawer
          user={mounted ? user : null}
          loading={loading}
          mounted={mounted}
          path={path}
          closing={drawerClosing}
          onClose={closeDrawer}
          onLogout={() => { logout(); closeDrawer() }}
        />
      )}
    </>
  )
}

/* ─── Logo ───────────────────────────────────────────────────────────────── */
function Logo() {
  const [h, setH] = useState(false)
  return (
    <a
      href="/"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        textDecoration: 'none',
        flexShrink:     0,
        transform:      h ? 'scale(1.04)' : 'scale(1)',
        transition:     'transform .2s ease',
      }}
    >
      {/* ✅ PNG Logo with gradient backdrop */}
      <div style={{
        width:          42,
        height:         42,
        borderRadius:   12,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        // boxShadow:      '0 4px 14px rgba(99,102,241,.35)',
        flexShrink:     0,
        padding:        4,
        position:       'relative',
        overflow:       'hidden',
      }}>
        <Image
          src="/MEDLI - LOGO ICON.png"
          alt="MEDLI Logo"
          width={44}
          height={44}
          priority
          style={{
            objectFit:    'contain',
            display:      'block',
            // 💡 Uncomment next line if your logo is dark and you want it white:
            // filter: 'brightness(0) invert(1)',
          }}
        />
      </div>

      {/* Wordmark */}
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontWeight:           900,
          fontSize:             21,
          background:           'linear-gradient(135deg,#6366f1,#8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor:  'transparent',
          backgroundClip:       'text',
          letterSpacing:        '-0.6px',
        }}>
          MEDLI
        </div>
        <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '1.5px', fontWeight: 600 }}>
          HEALTHCARE
        </div>
      </div>
    </a>
  )
}

/* ─── Auth skeleton ──────────────────────────────────────────────────────── */
function AuthSkeleton() {
  return (
    <div style={{
      width:          130,
      height:         36,
      borderRadius:   12,
      background:     'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)',
      backgroundSize: '200% 100%',
      animation:      'nb-shimmer 1.4s ease infinite',
    }}/>
  )
}

/* ─── Avatar button ──────────────────────────────────────────────────────── */
function AvatarButton({ user, initials, open, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      aria-expanded={open}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         8,
        padding:     '5px 10px 5px 5px',
        borderRadius: 13,
        border:      `1.5px solid ${open ? '#a5b4fc' : h ? '#ddd6fe' : '#f1f5f9'}`,
        background:  open ? '#faf5ff' : h ? '#fafafa' : '#fff',
        cursor:      'pointer',
        transition:  'all .18s ease',
        outline:     'none',
        boxShadow:   open ? '0 0 0 3px rgba(99,102,241,.12)' : 'none',
      }}
    >
      <div style={{
        width:          36,
        height:         36,
        borderRadius:   10,
        background:     'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       13,
        fontWeight:     700,
        color:          '#fff',
        flexShrink:     0,
        overflow:       'hidden',
        boxShadow:      '0 2px 8px rgba(99,102,241,.3)',
      }}>
        {user.avatar
          ? <img src={user.avatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
          : initials}
      </div>
      <div style={{ textAlign: 'left', minWidth: 0 }}>
        <div style={{
          fontSize:     13,
          fontWeight:   700,
          color:        '#1e293b',
          maxWidth:     96,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
          lineHeight:   1.2,
        }}>
          {user.name?.split(' ')[0]}
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.2 }}>
          {user.role?.replace(/_/g,' ')}
        </div>
      </div>
      <span style={{
        fontSize:   9,
        color:      '#94a3b8',
        transform:  open ? 'rotate(180deg)' : 'rotate(0)',
        transition: 'transform .2s ease',
        flexShrink: 0,
        marginLeft: 2,
      }}>▼</span>
    </button>
  )
}

/* ─── User dropdown ──────────────────────────────────────────────────────── */
function UserDropdown({ user, initials, onClose, onLogout }) {
  return (
    <div style={{
      position:     'absolute',
      top:          'calc(100% + 10px)',
      right:        0,
      width:        248,
      background:   '#fff',
      borderRadius: 20,
      border:       '1.5px solid #f1f5f9',
      boxShadow:    '0 20px 64px rgba(0,0,0,.13)',
      overflow:     'hidden',
      zIndex:       100,
      animation:    'nb-slideDown .2s cubic-bezier(.34,1.56,.64,1)',
    }}>
      {/* Header */}
      <div style={{
        padding:    '14px 16px',
        background: 'linear-gradient(135deg,rgba(99,102,241,.07),rgba(139,92,246,.05))',
        borderBottom: '1px solid #f1f5f9',
        display:    'flex',
        alignItems: 'center',
        gap:        10,
      }}>
        <div style={{
          width:          42,
          height:         42,
          borderRadius:   12,
          background:     'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          '#fff',
          fontWeight:     700,
          fontSize:       15,
          flexShrink:     0,
          overflow:       'hidden',
        }}>
          {user.avatar
            ? <img src={user.avatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
            : initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize:     14,
            fontWeight:   700,
            color:        '#1e293b',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {user.name}
          </div>
          <div style={{
            fontSize:     11,
            color:        '#94a3b8',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            marginTop:    2,
          }}>
            {user.phone ? `+91 ${user.phone}` : user.email}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '6px' }}>
        {USER_MENU.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="nb-drop-item"
          >
            <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>
              {item.icon}
            </span>
            {item.label}
            <span style={{ marginLeft:'auto', fontSize:11, color:'#c4b5fd', opacity:0 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity=1}
              onMouseLeave={(e) => e.currentTarget.style.opacity=0}
            >›</span>
          </a>
        ))}
      </div>

      <div style={{ height: 1, background: '#f8fafc', margin: '0 6px' }} />

      <div style={{ padding: '6px' }}>
        <button onClick={onLogout} className="nb-drop-item nb-danger">
          <span style={{ fontSize:16, width:22, textAlign:'center', flexShrink:0 }}>🚪</span>
          Sign out
        </button>
      </div>
    </div>
  )
}

/* ─── Guest buttons ──────────────────────────────────────────────────────── */
function GuestButtons() {
  const [lh, setLh] = useState(false)
  const [sh, setSh] = useState(false)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <a
        href="/auth/login"
        onMouseEnter={() => setLh(true)}
        onMouseLeave={() => setLh(false)}
        style={{
          padding:        '8px 18px',
          borderRadius:   10,
          fontSize:       13,
          fontWeight:     500,
          color:          lh ? '#6366f1' : '#475569',
          textDecoration: 'none',
          border:         `1.5px solid ${lh ? '#a5b4fc' : '#e2e8f0'}`,
          background:     lh ? '#faf5ff' : '#fff',
          transition:     'all .15s ease',
        }}
      >
        Log in
      </a>
      <a
        href="/auth/register"
        onMouseEnter={() => setSh(true)}
        onMouseLeave={() => setSh(false)}
        style={{
          padding:        '8px 18px',
          borderRadius:   10,
          fontSize:       13,
          fontWeight:     600,
          color:          '#fff',
          textDecoration: 'none',
          background:     sh
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          boxShadow:      sh
            ? '0 6px 22px rgba(99,102,241,.5)'
            : '0 4px 14px rgba(99,102,241,.3)',
          transform:      sh ? 'scale(1.02)' : 'scale(1)',
          transition:     'all .18s ease',
        }}
      >
        Sign up →
      </a>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE DRAWER
═══════════════════════════════════════════════════════════════════════════ */
function MobileDrawer({ user, loading, mounted, path, closing, onClose, onLogout }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:       'fixed',
          inset:          0,
          zIndex:         950,
          background:     'rgba(10,10,20,.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation:      closing
            ? 'nb-fadeIn .28s ease reverse'
            : 'nb-fadeIn .22s ease forwards',
        }}
      />

      {/* Panel */}
      <div style={{
        position:       'fixed',
        top:            0,
        right:          0,
        bottom:         0,
        zIndex:         960,
        width:          'min(340px,90vw)',
        background:     '#fff',
        display:        'flex',
        flexDirection:  'column',
        boxShadow:      '-12px 0 60px rgba(0,0,0,.18)',
        animation:      closing
          ? 'nb-slideRight .28s ease reverse'
          : 'nb-slideRight .3s cubic-bezier(.34,1.56,.64,1)',
        overflowY:      'hidden',
      }}>

        {/* Header */}
        <DrawerHeader onClose={onClose} />

        {/* User strip */}
        {mounted && user && <DrawerUserInfo user={user} />}
        {mounted && !user && loading && <DrawerSkeleton />}

        {/* Links */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px 10px 0' }}>

          <SectionTitle>Explore</SectionTitle>
          {NAV_LINKS.map((l) => (
            <DrawerLink
              key={l.href}
              href={l.href}
              icon={l.icon}
              label={l.label}
              active={path === l.href}
              onClick={onClose}
            />
          ))}

          {mounted && user && (
            <>
              <div style={{ height:1, background:'#f1f5f9', margin:'10px 4px' }}/>
              <SectionTitle>My Account</SectionTitle>
              {USER_MENU.map((l) => (
                <DrawerLink
                  key={l.href}
                  href={l.href}
                  icon={l.icon}
                  label={l.label}
                  active={path === l.href}
                  onClick={onClose}
                />
              ))}
            </>
          )}
        </div>

        {/* Bottom */}
        <DrawerBottom
          user={mounted ? user : null}
          mounted={mounted}
          onClose={onClose}
          onLogout={onLogout}
        />
      </div>
    </>
  )
}

function DrawerHeader({ onClose }) {
  const [h, setH] = useState(false)
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '0 16px',
      height:         64,
      borderBottom:   '1px solid #f1f5f9',
      flexShrink:     0,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        {/* ✅ PNG Logo with gradient backdrop */}
        <div style={{
          width:34, height:34, borderRadius:9,
          display:'flex', alignItems:'center', justifyContent:'center',
          padding: 3,
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <Image
            src="/MEDLI - LOGO ICON.png"
            alt="MEDLI Logo"
            width={28}
            height={28}
            style={{
              objectFit: 'contain',
              display:   'block',
              // 💡 Uncomment if your logo is dark and you want it white:
              // filter: 'brightness(0) invert(1)',
            }}
          />
        </div>
        <div>
          <div style={{
            fontWeight:900, fontSize:18,
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text', letterSpacing:'-0.5px',
          }}>MEDLI</div>
          <div style={{ fontSize:8, color:'#94a3b8', letterSpacing:'1.5px', fontWeight:600 }}>HEALTHCARE</div>
        </div>
      </div>
      <button
        onClick={onClose}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        aria-label="Close menu"
        style={{
          width:38, height:38, borderRadius:10,
          border:`1px solid ${h?'#ddd6fe':'#f1f5f9'}`,
          background: h?'#faf5ff':'#fafafa',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, color:'#64748b', transition:'all .15s ease',
        }}
      >✕</button>
    </div>
  )
}

function DrawerUserInfo({ user }) {
  return (
    <div style={{
      padding:      '14px 16px',
      background:   'linear-gradient(135deg,rgba(99,102,241,.07),rgba(139,92,246,.05))',
      borderBottom: '1px solid #f1f5f9',
      display:      'flex',
      alignItems:   'center',
      gap:          12,
      flexShrink:   0,
    }}>
      <div style={{
        width:46, height:46, borderRadius:14,
        background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'#fff', fontWeight:700, fontSize:17, flexShrink:0,
        overflow:'hidden', boxShadow:'0 4px 14px rgba(99,102,241,.3)',
        position:'relative',
      }}>
        {user.avatar
          ? <img src={user.avatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
          : user.name?.charAt(0)?.toUpperCase() || 'U'}
        {/* Online dot */}
        <div style={{
          position:'absolute', bottom:2, right:2,
          width:9, height:9, borderRadius:'50%',
          background:'#10b981', border:'1.5px solid #fff',
        }}/>
      </div>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{
          fontSize:13, fontWeight:700, color:'#1e293b',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>{user.name}</div>
        <div style={{
          fontSize:11, color:'#94a3b8', marginTop:2,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {user.phone ? `+91 ${user.phone}` : user.email}
        </div>
      </div>
      <div style={{
        padding:'3px 8px', borderRadius:100,
        background:'rgba(16,185,129,.1)', color:'#059669',
        fontSize:10, fontWeight:700,
      }}>Online</div>
    </div>
  )
}

function DrawerSkeleton() {
  return (
    <div style={{
      padding:'12px 16px', borderBottom:'1px solid #f1f5f9',
      display:'flex', alignItems:'center', gap:12, flexShrink:0,
    }}>
      <div style={{
        width:46, height:46, borderRadius:14, flexShrink:0,
        background:'linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9)',
        backgroundSize:'200% 100%', animation:'nb-shimmer 1.4s ease infinite',
      }}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ height:12, width:'60%', borderRadius:100, background:'#f1f5f9' }}/>
        <div style={{ height:10, width:'40%', borderRadius:100, background:'#f8fafc' }}/>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize:10, fontWeight:700, color:'#94a3b8',
      textTransform:'uppercase', letterSpacing:'1.2px',
      padding:'8px 14px 4px', margin:0,
    }}>{children}</p>
  )
}

function DrawerLink({ href, icon, label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className={`nb-mob-link${active?' nb-active':''}`}
      style={{ marginBottom:2 }}
    >
      {/* Active indicator */}
      {active && (
        <div style={{
          position:'absolute', left:0, top:'18%', bottom:'18%',
          width:3.5, borderRadius:'0 3px 3px 0',
          background:'linear-gradient(180deg,#6366f1,#8b5cf6)',
        }}/>
      )}
      <span style={{
        fontSize:20, width:26, textAlign:'center',
        flexShrink:0,
        filter: active||h ? 'none' : 'grayscale(30%)',
        transition:'filter .15s ease',
      }}>{icon}</span>
      <span style={{ flex:1 }}>{label}</span>
      {(active||h) && (
        <span style={{
          fontSize:14, color: active?'#6366f1':'#94a3b8',
          transition:'opacity .15s ease',
        }}>›</span>
      )}
    </a>
  )
}

function DrawerBottom({ user, mounted, onClose, onLogout }) {
  const [lh, setLh] = useState(false)
  const [sh, setSh] = useState(false)
  const [oh, setOh] = useState(false)

  return (
    <div style={{
      padding:'12px 14px',
      borderTop:'1px solid #f1f5f9',
      flexShrink:0,
      background:'linear-gradient(180deg,#fafafa,#f8fafc)',
    }}>
      {!mounted ? (
        <div style={{
          height:46, borderRadius:13,
          background:'linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9)',
          backgroundSize:'200% 100%',
          animation:'nb-shimmer 1.4s ease infinite',
        }}/>
      ) : user ? (
        <button
          onClick={onLogout}
          onMouseEnter={() => setOh(true)}
          onMouseLeave={() => setOh(false)}
          style={{
            width:'100%', padding:'12px 16px',
            borderRadius:13, cursor:'pointer',
            border:`1.5px solid ${oh?'#fca5a5':'#fee2e2'}`,
            background: oh?'rgba(239,68,68,.07)':'rgba(239,68,68,.03)',
            color:'#ef4444', fontSize:14, fontWeight:600,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            transition:'all .15s ease', minHeight:48,
          }}
        >
          🚪 Sign out
        </button>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <a
            href="/auth/login"
            onClick={onClose}
            onMouseEnter={() => setLh(true)}
            onMouseLeave={() => setLh(false)}
            style={{
              display:'block', textAlign:'center',
              padding:'12px', borderRadius:13, minHeight:48, lineHeight:'24px',
              border:`1.5px solid ${lh?'#a5b4fc':'#e2e8f0'}`,
              fontSize:14, fontWeight:500,
              color: lh?'#6366f1':'#334155',
              textDecoration:'none',
              background: lh?'#faf5ff':'#fff',
              transition:'all .15s ease',
            }}
          >Log in</a>
          <a
            href="/auth/register"
            onClick={onClose}
            onMouseEnter={() => setSh(true)}
            onMouseLeave={() => setSh(false)}
            style={{
              display:'block', textAlign:'center',
              padding:'12px', borderRadius:13, minHeight:48, lineHeight:'24px',
              background: sh
                ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              fontSize:14, fontWeight:700, color:'#fff',
              textDecoration:'none',
              boxShadow: sh
                ? '0 8px 28px rgba(99,102,241,.5)'
                : '0 4px 16px rgba(99,102,241,.3)',
              transform: sh?'scale(1.01)':'scale(1)',
              transition:'all .18s ease',
            }}
          >Create Free Account →</a>
        </div>
      )}
    </div>
  )
}