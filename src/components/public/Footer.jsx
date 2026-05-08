'use client'

import { useState } from 'react'

const LINKS = {
  Platform: [
    { label: 'Hospitals', href: '/hospitals', icon: '🏥' },
    { label: 'Labs',      href: '/labs',      icon: '🧪' },
    { label: 'Doctors',   href: '/doctors',   icon: '👨‍⚕️' },
    { label: 'Search',    href: '/search',    icon: '🔍' },
  ],
  Company: [
    { label: 'About',   href: '/about',   icon: '💡' },
    { label: 'Careers', href: '/careers', icon: '💼' },
    { label: 'Blog',    href: '/blog',    icon: '📝' },
    { label: 'Contact', href: '/contact', icon: '📬' },
  ],
  Legal: [
    { label: 'Privacy Policy',   href: '/privacy', icon: '🔒' },
    { label: 'Terms of Service', href: '/terms',   icon: '📜' },
    { label: 'Refund Policy',    href: '/refunds', icon: '↩️' },
  ],
}

const STATS = [
  { value: '50K+',  label: 'Patients Served'   },
  { value: '1,200+',label: 'Hospitals'          },
  { value: '800+',  label: 'Certified Labs'     },
  { value: '3,500+',label: 'Doctors'            },
]

const SOCIALS = [
  { icon: '𝕏',  href: '#', label: 'Twitter'   },
  { icon: 'in', href: '#', label: 'LinkedIn'   },
  { icon: 'f',  href: '#', label: 'Facebook'   },
  { icon: '▶',  href: '#', label: 'YouTube'    },
]

export default function Footer() {
  const year = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subbed, setSubbed] = useState(false)
  const [subHover, setSubHover] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email.includes('@')) { setSubbed(true); setEmail('') }
  }

  return (
    <>
      <style>{`
        @keyframes ft-float {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-4px); }
        }
        @keyframes ft-shimmer {
          0%   { background-position:200% 0; }
          100% { background-position:-200% 0; }
        }
        .ft-link {
          display:flex; align-items:center; gap:8px;
          color:#475569; text-decoration:none; font-size:13px;
          font-weight:500; padding:5px 0;
          transition:all .15s ease;
        }
        .ft-link:hover { color:#818cf8; transform:translateX(3px); }
        .ft-social { 
          display:flex; align-items:center; justify-content:center;
          width:34px; height:34px; border-radius:9px;
          background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08);
          color:#94a3b8; font-size:13px; font-weight:700;
          text-decoration:none; transition:all .18s ease; cursor:pointer;
        }
        .ft-social:hover {
          background:linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.2));
          border-color:rgba(99,102,241,.35); color:#a5b4fc;
          transform:translateY(-2px);
          box-shadow:0 6px 18px rgba(99,102,241,.25);
        }
        .ft-input {
          flex:1; min-width:0; padding:11px 14px;
          background:rgba(255,255,255,.07); border:1.5px solid rgba(255,255,255,.12);
          border-radius:10px; color:#fff; font-size:13px; outline:none;
          transition:all .15s ease; font-family:inherit;
        }
        .ft-input::placeholder { color:#475569; }
        .ft-input:focus { border-color:rgba(99,102,241,.5); background:rgba(255,255,255,.09); }
      `}</style>

      <footer style={{
        background:   'linear-gradient(180deg,#0d0d1a 0%,#080810 100%)',
        color:        '#94a3b8',
        borderTop:    '1px solid rgba(255,255,255,.06)',
        position:     'relative',
        overflow:     'hidden',
      }}>
        {/* Background decorations */}
        <div style={{
          position:'absolute', top:-100, left:'20%',
          width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 70%)',
          filter:'blur(60px)', pointerEvents:'none',
        }}/>
        <div style={{
          position:'absolute', bottom:-80, right:'15%',
          width:300, height:300, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(139,92,246,.05) 0%,transparent 70%)',
          filter:'blur(50px)', pointerEvents:'none',
        }}/>

        <div style={{
          maxWidth:  1280,
          margin:    '0 auto',
          padding:   'clamp(48px,7vw,80px) clamp(16px,3vw,32px) 0',
          position:  'relative',
          zIndex:    1,
        }}>

          {/* ── Stats bar ── */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
            gap:                 1,
            marginBottom:        56,
            background:          'rgba(255,255,255,.05)',
            borderRadius:        20,
            border:              '1px solid rgba(255,255,255,.07)',
            overflow:            'hidden',
          }}>
            {STATS.map((s, i) => (
              <StatItem key={i} value={s.value} label={s.label} />
            ))}
          </div>

          {/* ── Main grid ── */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'clamp(220px,30%,320px) repeat(3,1fr)',
            gap:                 'clamp(24px,4vw,56px)',
            marginBottom:        56,
            alignItems:          'start',
          }}
            /* Responsive via inline media fallback */
            className="ft-grid"
          >
            <style>{`
              @media(max-width:900px) {
                .ft-grid { grid-template-columns: 1fr 1fr !important; }
              }
              @media(max-width:560px) {
                .ft-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>

            {/* Brand column */}
            <div>
              {/* Logo */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
                <div style={{
                  width:44, height:44, borderRadius:13,
                  background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22, boxShadow:'0 6px 20px rgba(99,102,241,.35)',
                  animation:'ft-float 3s ease-in-out infinite',
                }}>🏥</div>
                <div>
                  <div style={{
                    fontWeight:900, fontSize:22, color:'#fff',
                    background:'linear-gradient(135deg,#818cf8,#a78bfa)',
                    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                    backgroundClip:'text', letterSpacing:'-0.5px',
                  }}>MEDLI</div>
                  <div style={{ fontSize:9, color:'#475569', letterSpacing:'2px', fontWeight:600 }}>
                    HEALTHCARE PLATFORM
                  </div>
                </div>
              </div>

              <p style={{
                fontSize:13, color:'#475569',
                lineHeight:1.85, marginBottom:22,
              }}>
                Making quality healthcare accessible to every Indian.
                Book hospitals, labs & doctors — anytime, anywhere.
              </p>

              {/* Newsletter */}
              {!subbed ? (
                <form onSubmit={handleSubscribe} style={{ marginBottom:20 }}>
                  <p style={{ fontSize:11, color:'#64748b', marginBottom:8, fontWeight:600, letterSpacing:'0.5px' }}>
                    STAY UPDATED
                  </p>
                  <div style={{ display:'flex', gap:6 }}>
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
                        padding:'11px 14px', borderRadius:10, border:'none',
                        background: subHover
                          ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        color:'#fff', fontSize:13, fontWeight:600,
                        cursor:'pointer', flexShrink:0,
                        boxShadow: subHover ? '0 6px 18px rgba(99,102,241,.4)' : 'none',
                        transition:'all .18s ease',
                        transform: subHover ? 'scale(1.03)' : 'scale(1)',
                      }}
                    >→</button>
                  </div>
                </form>
              ) : (
                <div style={{
                  padding:'10px 14px', borderRadius:10, marginBottom:20,
                  background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)',
                  fontSize:12, color:'#34d399', fontWeight:600,
                }}>
                  ✓ Subscribed! You'll hear from us soon.
                </div>
              )}

              {/* Socials */}
              <div style={{ display:'flex', gap:8 }}>
                {SOCIALS.map((s, i) => (
                  <a key={i} href={s.href} aria-label={s.label} className="ft-social">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(LINKS).map(([heading, items]) => (
              <div key={heading}>
                <h4 style={{
                  fontSize:11, fontWeight:700, color:'#fff',
                  marginBottom:16, letterSpacing:'1.5px',
                  textTransform:'uppercase',
                }}>
                  {heading}
                </h4>
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {items.map((item) => (
                    <a key={item.href} href={item.href} className="ft-link">
                      <span style={{ fontSize:14, flexShrink:0 }}>{item.icon}</span>
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Bottom bar ── */}
          <div style={{
            borderTop:      '1px solid rgba(255,255,255,.06)',
            paddingTop:     24,
            paddingBottom:  32,
            display:        'flex',
            flexWrap:       'wrap',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            12,
          }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px 20px', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'#334155', fontWeight:500 }}>
                © {year} MEDLI Healthcare Pvt. Ltd.
              </span>
              <span style={{
                fontSize:10, color:'#1e293b',
                background:'rgba(99,102,241,.08)',
                border:'1px solid rgba(99,102,241,.12)',
                borderRadius:100, padding:'2px 8px',
                fontWeight:600, color:'#6366f1',
              }}>
                v2.0
              </span>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 16px', alignItems:'center' }}>
              <ContactItem icon="📞" text="+91 98765 43210" />
              <ContactItem icon="✉️" text="support@medli.in" />
              <span style={{ fontSize:11, color:'#334155' }}>
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
        padding:    'clamp(16px,3vw,24px)',
        textAlign:  'center',
        borderRight: '1px solid rgba(255,255,255,.05)',
        background: h ? 'rgba(99,102,241,.06)' : 'transparent',
        transition: 'background .2s ease',
        cursor:     'default',
      }}
    >
      <div style={{
        fontSize:   'clamp(20px,3vw,28px)',
        fontWeight: 800,
        background: 'linear-gradient(135deg,#818cf8,#a78bfa)',
        WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
        backgroundClip:'text', letterSpacing:'-0.5px',
        marginBottom: 4,
        transform:  h ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform .2s ease',
        display:    'block',
      }}>
        {value}
      </div>
      <div style={{ fontSize:11, color:'#475569', fontWeight:600, letterSpacing:'0.3px' }}>
        {label}
      </div>
    </div>
  )
}

function ContactItem({ icon, text }) {
  const [h, setH] = useState(false)
  return (
    <span
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize:12, color: h ? '#818cf8' : '#475569',
        display:'flex', alignItems:'center', gap:5,
        transition:'color .15s ease', cursor:'default',
      }}
    >
      {icon} {text}
    </span>
  )
}