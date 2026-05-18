'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Building2,
  FlaskConical,
  Stethoscope,
  Search,
  Lightbulb,
  Briefcase,
  FileText,
  Mail,
  Lock,
  ScrollText,
  RotateCcw,
  Shield,
  Phone,
  ArrowRight,
  Check,
} from 'lucide-react'

const LINKS = {
  Platform: [
    { label: 'Hospitals', href: '/hospitals', Icon: Building2 },
    { label: 'Labs', href: '/labs', Icon: FlaskConical },
    { label: 'Doctors', href: '/doctors', Icon: Stethoscope },
    { label: 'Search', href: '/search', Icon: Search },
  ],
  Company: [
    { label: 'About', href: '/about', Icon: Lightbulb },
    { label: 'Careers', href: '/careers', Icon: Briefcase },
    { label: 'Blog', href: '/blog', Icon: FileText },
    { label: 'Contact', href: '/contact', Icon: Mail },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy', Icon: Lock },
    { label: 'Terms of Service', href: '/terms', Icon: ScrollText },
    { label: 'Refund Policy', href: '/refunds', Icon: RotateCcw },
    { label: 'Admin Dashboard Policy', href: '/admin-policy', Icon: Shield },
  ],
}

const STATS = [
  { value: '50K+', label: 'Patients Served' },
  { value: '1,200+', label: 'Hospitals' },
  { value: '800+', label: 'Certified Labs' },
  { value: '3,500+', label: 'Doctors' },
]

const SOCIALS = [
  {
    href: '#',
    label: 'Twitter / X',
    svg: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'LinkedIn',
    svg: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Facebook',
    svg: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'YouTube',
    svg: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

export default function Footer() {
  const year = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subbed, setSubbed] = useState(false)
  const [subHover, setSubHover] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email.includes('@')) {
      setSubbed(true)
      setEmail('')
    }
  }

  return (
    <>
      <style>{`
        @keyframes ft-float {
          0%,100% { transform:translateY(0); }
          50% { transform:translateY(-4px); }
        }

        .ft-link {
          display:flex;
          align-items:center;
          gap:8px;
          color:#475569;
          text-decoration:none;
          font-size:13px;
          font-weight:500;
          padding:5px 0;
          transition:all .15s ease;
        }

        .ft-link:hover {
          color:#818cf8;
          transform:translateX(3px);
        }

        .ft-social {
          display:flex;
          align-items:center;
          justify-content:center;
          width:34px;
          height:34px;
          border-radius:9px;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.08);
          color:#94a3b8;
          text-decoration:none;
          transition:all .18s ease;
          cursor:pointer;
        }

        .ft-social:hover {
          background:linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.2));
          border-color:rgba(99,102,241,.35);
          color:#a5b4fc;
          transform:translateY(-2px);
          box-shadow:0 6px 18px rgba(99,102,241,.25);
        }

        .ft-input {
          flex:1;
          min-width:0;
          padding:11px 14px;
          background:rgba(255,255,255,.07);
          border:1.5px solid rgba(255,255,255,.12);
          border-radius:10px;
          color:#fff;
          font-size:13px;
          outline:none;
          transition:all .15s ease;
          font-family:inherit;
        }

        .ft-input::placeholder {
          color:#475569;
        }

        .ft-input:focus {
          border-color:rgba(99,102,241,.5);
          background:rgba(255,255,255,.09);
        }

        @media (max-width:900px) {
          .ft-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width:560px) {
          .ft-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <footer
        style={{
          background: 'linear-gradient(180deg,#0d0d1a 0%,#080810 100%)',
          color: '#94a3b8',
          borderTop: '1px solid rgba(255,255,255,.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: '20%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: '15%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(139,92,246,.05) 0%,transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: 'clamp(48px,7vw,80px) clamp(16px,3vw,32px) 0',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
              gap: 1,
              marginBottom: 56,
              background: 'rgba(255,255,255,.05)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,.07)',
              overflow: 'hidden',
            }}
          >
            {STATS.map((s, i) => (
              <StatItem key={i} value={s.value} label={s.label} />
            ))}
          </div>

          <div
            className="ft-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'clamp(220px,30%,320px) repeat(3,1fr)',
              gap: 'clamp(24px,4vw,56px)',
              marginBottom: 56,
              alignItems: 'start',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    flexShrink: 0,
                    overflow: 'hidden',
                    // background: 'linear-gradient(135deg,rgba(99,102,241,.16),rgba(139,92,246,.12))',
                    // border: '1px solid rgba(255,255,255,.08)',
                    // boxShadow: '0 6px 20px rgba(99,102,241,.18)',
                    // animation: 'ft-float 3s ease-in-out infinite',
                  }}
                >
                  <Image
                    src="/MEDLI-LOGOICON.png"
                    alt="MEDLI Logo"
                    width={32}
                    height={32}
                    style={{
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 22,
                      background: 'linear-gradient(135deg,#818cf8,#a78bfa)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    MEDLI
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: '#94a3b8',
                      letterSpacing: '1.8px',
                      fontWeight: 600,
                    }}
                  >
                    HEALTHCARE PLATFORM
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.85, marginBottom: 22 }}>
                Making quality healthcare accessible to every Indian. Book hospitals, labs &amp;
                doctors — anytime, anywhere.
              </p>

              {!subbed ? (
                <form onSubmit={handleSubscribe} style={{ marginBottom: 20 }}>
                  <p
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      marginBottom: 8,
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                    }}
                  >
                    STAY UPDATED
                  </p>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="ft-input"
                      required
                    />

                    <button
                      type="submit"
                      onMouseEnter={() => setSubHover(true)}
                      onMouseLeave={() => setSubHover(false)}
                      style={{
                        padding: '11px 14px',
                        borderRadius: 10,
                        border: 'none',
                        background: subHover
                          ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: subHover ? '0 6px 18px rgba(99,102,241,.4)' : 'none',
                        transition: 'all .18s ease',
                        transform: subHover ? 'scale(1.03)' : 'scale(1)',
                      }}
                    >
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    marginBottom: 20,
                    background: 'rgba(16,185,129,.1)',
                    border: '1px solid rgba(16,185,129,.2)',
                    fontSize: 12,
                    color: '#34d399',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Check size={14} strokeWidth={2.5} color="#34d399" />
                  Subscribed! You'll hear from us soon.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {SOCIALS.map((s) => (
                  <a key={s.label} href={s.href} aria-label={s.label} className="ft-social">
                    {s.svg}
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(LINKS).map(([heading, items]) => (
              <div key={heading}>
                <h4
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: 16,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  {heading}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {items.map((item) => (
                    <Link key={item.href} href={item.href} className="ft-link">
                      <item.Icon size={14} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,.06)',
              paddingTop: 24,
              paddingBottom: 32,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>
                © {year} Sectirmeld — MEDLI Healthcare Platform
              </span>

              <span
                style={{
                  fontSize: 10,
                  background: 'rgba(99,102,241,.08)',
                  border: '1px solid rgba(99,102,241,.12)',
                  borderRadius: 100,
                  padding: '2px 8px',
                  fontWeight: 600,
                  color: '#6366f1',
                }}
              >
                v2.0
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', alignItems: 'center' }}>
              <ContactItem Icon={Phone} text="+91 98765 43210" />
              <ContactItem Icon={Mail} text="support@medli.in" />
              <span style={{ fontSize: 11, color: '#334155' }}>
                GSTIN: {process.env.NEXT_PUBLIC_GSTIN || '27MEDLI1234Z1'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

function StatItem({ value, label }) {
  const [h, setH] = useState(false)

  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: 'clamp(16px,3vw,24px)',
        textAlign: 'center',
        borderRight: '1px solid rgba(255,255,255,.05)',
        background: h ? 'rgba(99,102,241,.06)' : 'transparent',
        transition: 'background .2s ease',
        cursor: 'default',
      }}
    >
      <div
        style={{
          fontSize: 'clamp(20px,3vw,28px)',
          fontWeight: 800,
          background: 'linear-gradient(135deg,#818cf8,#a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.5px',
          marginBottom: 4,
          transform: h ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform .2s ease',
          display: 'block',
        }}
      >
        {value}
      </div>

      <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.3px' }}>
        {label}
      </div>
    </div>
  )
}

function ContactItem({ Icon, text }) {
  const [h, setH] = useState(false)

  return (
    <span
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize: 12,
        color: h ? '#818cf8' : '#475569',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        transition: 'color .15s ease',
        cursor: 'default',
      }}
    >
      <Icon size={13} strokeWidth={2.2} />
      {text}
    </span>
  )
}