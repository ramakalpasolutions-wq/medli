'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import {
  User,
  CalendarDays,
  Users,
  Shield,
  Phone,
  Mail,
  Pencil,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Trash2,
  LogOut,
  X,
  Heart,
  Baby,
  UserRound,
  Users2,
  CircleHelp,
  BadgeCheck,
  TriangleAlert,
} from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes prof-spin   { to{transform:rotate(360deg)} }
  @keyframes prof-in     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes prof-shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes prof-shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }
  @keyframes prof-modal  { from{opacity:0;transform:scale(.95) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
`
const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'prof-shimmer 1.5s linear infinite',
}

const fmtRs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const iconProps = { size: 16, strokeWidth: 2 }
const smIconProps = { size: 14, strokeWidth: 2 }
const mdIconProps = { size: 18, strokeWidth: 2 }
const lgIconProps = { size: 20, strokeWidth: 2 }

const RELATIONS = [
  { key: 'spouse', label: 'Spouse', icon: Heart },
  { key: 'child',  label: 'Child',  icon: Baby },
  { key: 'parent', label: 'Parent', icon: UserRound },
  { key: 'sibling',label: 'Sibling',icon: Users2 },
  { key: 'other',  label: 'Other',  icon: CircleHelp },
]

function PInput({ label, disabled, hint, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>}
      <input
        {...props}
        disabled={disabled}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        style={{
          padding: '10px 13px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12,
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: disabled ? '#f8fafc' : '#fff',
          color: disabled ? '#94a3b8' : '#0f172a',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'all .15s ease', boxSizing: 'border-box', width: '100%',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {hint && <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{hint}</p>}
    </div>
  )
}

function PSelect({ label, children, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <select
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '10px 34px 10px 13px',
            fontSize: 13, fontFamily: 'inherit', borderRadius: 12,
            border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
            background: '#fff', color: '#0f172a', outline: 'none',
            appearance: 'none', cursor: 'pointer',
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
            transition: 'all .15s ease', boxSizing: 'border-box',
          }}
        >
          {children}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          <ChevronDown {...smIconProps} />
        </span>
      </div>
    </div>
  )
}

function PBtn({ children, loading: isLoading, disabled, onClick, variant = 'primary', style: sx }) {
  const [h, setH] = useState(false)
  const isDisabled = disabled || isLoading
  const styles = {
    primary:   { base: 'linear-gradient(135deg,#6366f1,#8b5cf6)', hov: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    secondary: { base: '#fff', hov: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' },
    danger:    { base: 'rgba(239,68,68,0.05)', hov: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.2)' },
  }
  const s = styles[variant] || styles.primary
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '11px 20px', borderRadius: 12,
        background: h && !isDisabled ? s.hov : s.base,
        color: isDisabled ? '#94a3b8' : s.color,
        border: s.border || 'none',
        fontSize: 13, fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all .15s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        boxShadow: variant === 'primary' && !isDisabled
          ? h ? '0 6px 20px rgba(99,102,241,0.4)' : '0 3px 12px rgba(99,102,241,0.25)'
          : 'none',
        ...sx,
      }}
    >
      {isLoading && (
        <span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'prof-spin .7s linear infinite', display:'inline-block', flexShrink:0 }} />
      )}
      {children}
    </button>
  )
}

function Modal({ open, onClose, title, children, width = 420 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: width, maxHeight: '90vh',
        background: '#fff', borderRadius: 20, overflow: 'hidden', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        animation: 'prof-modal .25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
          <CloseBtn onClick={onClose} />
        </div>
        <div style={{ padding: 20 }}>{children}</div>
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
        width:32, height:32, borderRadius:8, border:'none',
        background: h ? '#f1f5f9' : 'transparent',
        color:'#64748b', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center'
      }}
    >
      <X {...mdIconProps} />
    </button>
  )
}

function TabBtn({ label, icon: Icon, active, onClick, count }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 12, border: 'none',
        fontSize: 13, fontWeight: active ? 600 : 500, flexShrink: 0,
        background: active
          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
          : h ? '#f1f5f9' : '#fff',
        color: active ? '#fff' : h ? '#334155' : '#64748b',
        cursor: 'pointer', boxShadow: active ? '0 3px 12px rgba(99,102,241,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'all .15s ease',
        border: active ? 'none' : '1px solid #f1f5f9',
      }}
    >
      <span style={{ display:'flex', alignItems:'center' }}>
        <Icon size={15} strokeWidth={2} />
      </span>
      {label}
      {count !== undefined && count > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100,
          background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
          color: active ? '#fff' : '#64748b',
        }}>
          {count}
        </span>
      )}
    </button>
  )
}

function SectionCard({ title, action, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
          {title && <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>}
          {action}
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

function EditProfileModal({ open, onClose, user, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && open) setForm({ name: user.name || '', email: user.email || '' })
  }, [user, open])

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const res  = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim() || undefined }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Profile updated')
        onSaved()
        onClose()
      } else {
        toast.error(json.error || 'Failed to update')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" width={400}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PInput label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
        <PInput label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        <PInput label="Phone Number" value={user?.phone || ''} disabled hint="Phone number cannot be changed" />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <PBtn variant="secondary" onClick={onClose} disabled={saving} style={{ flex: 1 }}>Cancel</PBtn>
          <PBtn onClick={handleSave} loading={saving} disabled={saving || !form.name.trim()} style={{ flex: 1 }}>Save Changes</PBtn>
        </div>
      </div>
    </Modal>
  )
}

function FamilyModal({ open, onClose, member, onSave, saving }) {
  const [form, setForm] = useState({ name:'', relation:'spouse', age:'', gender:'male', bloodGroup:'', phone:'', notes:'' })

  useEffect(() => {
    if (open) {
      setForm(member ? {
        name: member.name||'',
        relation: member.relation||'spouse',
        age: member.age||'',
        gender: member.gender||'male',
        bloodGroup: member.bloodGroup||'',
        phone: member.phone||'',
        notes: member.notes||'',
      } : { name:'', relation:'spouse', age:'', gender:'male', bloodGroup:'', phone:'', notes:'' })
    }
  }, [open, member])

  return (
    <Modal open={open} onClose={onClose} title={member ? 'Edit Family Member' : 'Add Family Member'} width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PInput label="Full Name *" value={form.name} onChange={(e) => setForm({...form, name:e.target.value})} placeholder="Full name" />

        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:6 }}>Relation *</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
            {RELATIONS.map((r) => (
              <RelBtn key={r.key} r={r} active={form.relation===r.key} onClick={() => setForm({...form, relation:r.key})} />
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <PInput label="Age" type="number" value={form.age} onChange={(e) => setForm({...form, age:e.target.value})} placeholder="Age" min="0" max="120" />
          <PSelect label="Gender" value={form.gender} onChange={(e) => setForm({...form, gender:e.target.value})}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </PSelect>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <PSelect label="Blood Group" value={form.bloodGroup} onChange={(e) => setForm({...form, bloodGroup:e.target.value})}>
            <option value="">Select</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </PSelect>
          <PInput label="Phone (optional)" type="tel" value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value.replace(/\D/g,'').slice(0,10)})} placeholder="10-digit" />
        </div>

        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:6 }}>Medical Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({...form, notes:e.target.value})}
            placeholder="Allergies, conditions..."
            rows={2}
            style={{ width:'100%', padding:'10px 13px', fontSize:13, fontFamily:'inherit', borderRadius:12, border:'1.5px solid #e2e8f0', outline:'none', resize:'none', boxSizing:'border-box' }}
          />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <PBtn variant="secondary" onClick={onClose} disabled={saving} style={{ flex:1 }}>Cancel</PBtn>
          <PBtn onClick={() => onSave(form)} loading={saving} disabled={!form.name.trim() || saving} style={{ flex:1 }}>
            {member ? 'Save Changes' : 'Add Member'}
          </PBtn>
        </div>
      </div>
    </Modal>
  )
}

function RelBtn({ r, active, onClick }) {
  const [h, setH] = useState(false)
  const Icon = r.icon
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:5,
        padding:'8px 4px', borderRadius:10,
        border:`1.5px solid ${active?'#6366f1':h?'#c7d2fe':'#e2e8f0'}`,
        background: active?'rgba(99,102,241,0.08)':h?'rgba(99,102,241,0.04)':'#fff',
        color: active?'#6366f1':'#64748b', fontSize:11, fontWeight:500,
        cursor:'pointer', transition:'all .15s ease',
      }}
    >
      <Icon {...mdIconProps} />
      {r.label}
    </button>
  )
}

function ProfileBookingCard({ booking, mounted, onClick }) {
  const [h, setH] = useState(false)

  const BookingIcon =
    booking.type === 'lab' ? FileText :
    booking.type === 'online' ? CalendarDays :
    Shield

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width:'100%', background:'#fff', borderRadius:16, padding:14,
        border:`1.5px solid ${h?'#c7d2fe':'#f1f5f9'}`,
        boxShadow: h?'0 6px 20px rgba(0,0,0,0.08)':'0 1px 4px rgba(0,0,0,0.04)',
        transform: h?'translateY(-1px)':'translateY(0)',
        transition:'all .18s ease', cursor:'pointer', textAlign:'left',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:36, height:36, borderRadius:10, background:'#f8fafc',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#6366f1',
        }}>
          <BookingIcon {...mdIconProps} />
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:'#1e293b', margin:0 }}>{booking.bookingId}</p>
          <p style={{ fontSize:11, color:'#94a3b8', margin:'2px 0 0' }}>
            {mounted ? new Date(booking.startTime).toLocaleDateString('en-IN',{dateStyle:'medium'}) : '—'}
          </p>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
        <Badge variant={getStatusVariant(booking.status)} size="sm">{booking.status?.replace(/_/g,' ')}</Badge>
        <p style={{ fontSize:12, fontWeight:600, color:'#334155', margin:0 }}>{fmtRs(booking.totalAmount)}</p>
      </div>
    </button>
  )
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const router  = useRouter()
  const toast   = useToast()
  const mounted = useMounted()

  const [tab,           setTab]           = useState('profile')
  const [editModal,     setEditModal]     = useState(false)
  const [familyModal,   setFamilyModal]   = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [familySaving,  setFamilySaving]  = useState(false)
  const [familyMembers, setFamilyMembers] = useState([])
  const [familyLoading, setFamilyLoading] = useState(false)
  const [bkFilter,      setBkFilter]      = useState('all')
  const [bkPage,        setBkPage]        = useState(1)
  const [headerVis,     setHeaderVis]     = useState(false)

  useEffect(() => {
    if (mounted) setTimeout(() => setHeaderVis(true), 50)
  }, [mounted])

  const bkParams = new URLSearchParams({ page: bkPage, limit: 10, ...(bkFilter !== 'all' && { status: bkFilter }) })
  const { data: bkData, isLoading: bkLoading } = useSWR(user ? `/api/bookings?${bkParams}` : null, fetcher, { revalidateOnFocus: false })
  const bookings   = bkData?.bookings || []
  const pagination = bkData?.pagination || {}

  useEffect(() => {
    if (!user || tab !== 'family') return
    loadFamily()
  }, [user, tab])

  const loadFamily = async () => {
    setFamilyLoading(true)
    try {
      const res  = await fetch(`/api/users/${user.id}/family`, { credentials: 'include' })
      const json = await res.json()
      setFamilyMembers(json.success ? (json.data || []) : [])
    } catch {
      setFamilyMembers([])
    } finally {
      setFamilyLoading(false)
    }
  }

  const handleSaveFamily = async (form) => {
    setFamilySaving(true)
    try {
      const isEdit = !!editingMember
      const url    = isEdit ? `/api/users/${user.id}/family/${editingMember.id}` : `/api/users/${user.id}/family`
      const res    = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify(form)
      })
      const json   = await res.json()
      if (json.success) {
        toast.success(isEdit ? 'Member updated' : 'Member added')
        setFamilyModal(false)
        setEditingMember(null)
        loadFamily()
      } else {
        toast.error(json.error || 'Failed to save')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setFamilySaving(false)
    }
  }

  const handleDeleteMember = async (id) => {
    if (!confirm('Remove this family member?')) return
    try {
      const res  = await fetch(`/api/users/${user.id}/family/${id}`, { method:'DELETE', credentials:'include' })
      const json = await res.json()
      if (json.success) {
        toast.success('Member removed')
        loadFamily()
      } else {
        toast.error(json.error || 'Failed to remove')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (!user) {
    return (
      <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <style>{`@keyframes prof-spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #6366f1', borderTopColor:'transparent', animation:'prof-spin .8s linear infinite' }} />
      </div>
    )
  }

  const initials = user.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <>
      <style>{KF}</style>
      <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
        <Navbar />
        <div style={{ maxWidth:720, margin:'0 auto', padding:'clamp(88px,12vw,104px) clamp(16px,3vw,32px) 80px' }}>

          <div style={{
            backgroundImage: 'linear-gradient(135deg,#4f46e5,#2563eb)',
            borderRadius: 20, padding: 'clamp(18px,4vw,24px)',
            color: '#fff', marginBottom: 20,
            boxShadow: '0 8px 32px rgba(79,70,229,0.3)',
            opacity: headerVis?1:0,
            transform: headerVis?'translateY(0)':'translateY(14px)',
            transition: 'opacity .4s ease, transform .4s ease',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div style={{
                width:60, height:60, borderRadius:'50%',
                background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden',
              }}>
                {user.avatar ? <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : initials}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <h1 style={{ fontSize:'clamp(16px,3vw,20px)', fontWeight:800, color:'#fff', margin:'0 0 6px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user.name}
                </h1>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 14px' }}>
                  {user.phone && (
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)', display:'flex', alignItems:'center', gap:6 }}>
                      <Phone {...smIconProps} /> +91 {user.phone}
                    </span>
                  )}
                  {user.email && (
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)', display:'flex', alignItems:'center', gap:6 }}>
                      <Mail {...smIconProps} /> {user.email}
                    </span>
                  )}
                </div>
                <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, fontWeight:600, background:'rgba(255,255,255,0.2)', padding:'2px 10px', borderRadius:100 }}>
                    {user.role?.replace(/_/g,' ')}
                  </span>
                  {user.isVerified && (
                    <span style={{ fontSize:11, fontWeight:600, background:'rgba(16,185,129,0.3)', padding:'2px 10px', borderRadius:100, display:'flex', alignItems:'center', gap:4 }}>
                      <BadgeCheck size={12} strokeWidth={2.2} />
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <EditProfileBtn onClick={() => setEditModal(true)} />
            </div>
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
            {[
              { key:'profile',  label:'Profile',  icon:User },
              { key:'bookings', label:'Bookings', icon:CalendarDays, count:pagination.total },
              { key:'family',   label:'Family',   icon:Users, count:familyMembers.length },
              { key:'account',  label:'Account',  icon:Shield },
            ].map((t) => (
              <TabBtn key={t.key} label={t.label} icon={t.icon} count={t.count} active={tab===t.key} onClick={() => setTab(t.key)} />
            ))}
          </div>

          {tab === 'profile' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'prof-in .2s ease' }}>
              <SectionCard
                title="Personal Information"
                action={
                  <button onClick={() => setEditModal(true)} style={{ fontSize:12, fontWeight:600, color:'#6366f1', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                    <Pencil size={13} strokeWidth={2} />
                    Edit
                  </button>
                }
              >
                {[
                  { icon:User, label:'Full Name',    value:user.name },
                  { icon:Phone, label:'Phone',       value:user.phone?`+91 ${user.phone}`:'—' },
                  { icon:Mail, label:'Email',        value:user.email||'—' },
                  { icon:CalendarDays, label:'Member Since', value:mounted&&user.createdAt?new Date(user.createdAt).toLocaleDateString('en-IN',{dateStyle:'medium'}):'—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #f8fafc' }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#6366f1' }}>
                      <Icon {...iconProps} />
                    </div>
                    <div>
                      <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{label}</p>
                      <p style={{ fontSize:13, fontWeight:500, color:'#1e293b', margin:'1px 0 0' }}>{value}</p>
                    </div>
                  </div>
                ))}
              </SectionCard>

              <SectionCard title="Quick Actions">
                {[
                  { icon:CalendarDays, label:'Bookings', sub:'View all appointments', action:() => setTab('bookings') },
                  { icon:Users, label:'Family Members', sub:'Manage family profiles', action:() => setTab('family') },
                  { icon:FileText, label:'Invoices', sub:'Download receipts', action:() => router.push('/user/invoices') },
                ].map(({ icon, label, sub, action }) => (
                  <ActionRow key={label} icon={icon} label={label} sub={sub} onClick={action} />
                ))}
              </SectionCard>
            </div>
          )}

          {tab === 'bookings' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'prof-in .2s ease' }}>
              <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
                {[
                  { key:'all', label:'All' },
                  { key:'confirmed', label:'Upcoming' },
                  { key:'completed', label:'Completed' },
                  { key:'cancelled', label:'Cancelled' },
                  { key:'pending_payment', label:'Pending' },
                ].map((f) => (
                  <FilterPill key={f.key} f={f} active={bkFilter===f.key} onClick={() => { setBkFilter(f.key); setBkPage(1) }} />
                ))}
              </div>

              {bkLoading ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[1,2,3].map((i) => <div key={i} style={{ height:76, borderRadius:16, ...SHIMMER }} />)}
                </div>
              ) : !bookings.length ? (
                <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', padding:48, textAlign:'center' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:8, color:'#6366f1' }}>
                    <CalendarDays size={24} strokeWidth={2} />
                  </div>
                  <p style={{ fontSize:14, fontWeight:600, color:'#64748b', margin:'0 0 6px' }}>No bookings found</p>
                  <p style={{ fontSize:12, color:'#94a3b8', margin:'0 0 16px' }}>Your appointments will appear here</p>
                  <PBtn onClick={() => router.push('/hospitals')} style={{ margin:'0 auto', width:'fit-content' }}>Book Appointment</PBtn>
                </div>
              ) : (
                <>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {bookings.map((b) => (
                      <ProfileBookingCard key={b.id} booking={b} mounted={mounted} onClick={() => router.push(`/user/bookings/${b.id}`)} />
                    ))}
                  </div>
                  {pagination.pages > 1 && (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
                      <PBtn variant="secondary" onClick={() => setBkPage((p) => Math.max(1,p-1))} disabled={bkPage===1} style={{ padding:'7px 16px', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                        <ChevronLeft size={14} strokeWidth={2} />
                        Prev
                      </PBtn>
                      <span style={{ fontSize:12, color:'#94a3b8' }}>{bkPage} / {pagination.pages}</span>
                      <PBtn variant="secondary" onClick={() => setBkPage((p) => Math.min(pagination.pages,p+1))} disabled={bkPage===pagination.pages} style={{ padding:'7px 16px', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                        Next
                        <ChevronRight size={14} strokeWidth={2} />
                      </PBtn>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'family' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'prof-in .2s ease' }}>
              <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:14, padding:14, display:'flex', alignItems:'flex-start', gap:10 }}>
                <span style={{ fontSize:18, flexShrink:0, color:'#6366f1', display:'flex', alignItems:'center' }}>
                  <Users {...mdIconProps} />
                </span>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'#4f46e5', margin:'0 0 2px' }}>Family Members</p>
                  <p style={{ fontSize:12, color:'#6366f1', margin:0 }}>Add family members to book appointments on their behalf.</p>
                </div>
              </div>

              <AddMemberBtn onClick={() => { setEditingMember(null); setFamilyModal(true) }} />

              {familyLoading ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[1,2].map((i) => <div key={i} style={{ height:72, borderRadius:16, ...SHIMMER }} />)}
                </div>
              ) : !familyMembers.length ? (
                <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', padding:40, textAlign:'center' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:8, color:'#6366f1' }}>
                    <Users size={22} strokeWidth={2} />
                  </div>
                  <p style={{ fontSize:14, fontWeight:600, color:'#64748b', margin:0 }}>No family members added yet</p>
                  <p style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>Add your spouse, children, or parents</p>
                </div>
              ) : (
                familyMembers.map((m, i) => {
                  const rel = RELATIONS.find((r) => r.key === m.relation) || RELATIONS[4]
                  return <FamilyMemberCard key={m.id||i} m={m} rel={rel} onEdit={() => { setEditingMember(m); setFamilyModal(true) }} onDelete={() => handleDeleteMember(m.id)} />
                })
              )}
            </div>
          )}

          {tab === 'account' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'prof-in .2s ease' }}>
              <SectionCard title="Account Status">
                {[
                  { label:'Account Verification', value: user.isVerified ? 'Verified' : 'Not Verified', color: user.isVerified?'#10b981':'#f59e0b', icon: user.isVerified ? BadgeCheck : TriangleAlert },
                  { label:'Account Status', value: user.isBlocked ? 'Blocked' : 'Active', color: user.isBlocked?'#ef4444':'#10b981', icon: user.isBlocked ? X : BadgeCheck },
                  { label:'Role', value: user.role?.replace(/_/g,' '), color: '#6366f1', icon: Shield },
                  ...(mounted&&user.createdAt ? [{ label:'Joined', value:new Date(user.createdAt).toLocaleDateString('en-IN',{dateStyle:'long'}), color:'#64748b', icon: CalendarDays }] : []),
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f8fafc' }}>
                    <span style={{ fontSize:13, color:'#64748b' }}>{label}</span>
                    <span style={{ fontSize:12, fontWeight:600, color, display:'flex', alignItems:'center', gap:6 }}>
                      <Icon size={13} strokeWidth={2.2} />
                      {value}
                    </span>
                  </div>
                ))}
              </SectionCard>

              <SectionCard title="Account Actions">
                <LogoutBtn onLogout={handleLogout} />
              </SectionCard>

              <p style={{ textAlign:'center', fontSize:12, color:'#94a3b8' }}>
                Need help?{' '}
                <a href="mailto:support@medli.in" style={{ color:'#6366f1', fontWeight:600, textDecoration:'none' }}>support@medli.in</a>
              </p>
            </div>
          )}
        </div>

        <Footer />

        <EditProfileModal open={editModal} onClose={() => setEditModal(false)} user={user} onSaved={refreshUser} />
        <FamilyModal open={familyModal} onClose={() => { setFamilyModal(false); setEditingMember(null) }} member={editingMember} onSave={handleSaveFamily} saving={familySaving} />
      </div>
    </>
  )
}

function EditProfileBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width:36, height:36, borderRadius:10, border:'none',
        background: h?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.2)',
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0, transition:'background .15s ease', color:'#fff'
      }}
    >
      <Pencil size={16} strokeWidth={2} />
    </button>
  )
}

function ActionRow({ icon: Icon, label, sub, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px', borderRadius:12, border:'none', background: h?'#f8fafc':'transparent', cursor:'pointer', textAlign:'left', transition:'background .12s ease' }}
    >
      <div style={{ width:36, height:36, borderRadius:10, background:'rgba(99,102,241,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#6366f1' }}>
        <Icon {...mdIconProps} />
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:600, color:'#1e293b', margin:0 }}>{label}</p>
        <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{sub}</p>
      </div>
      <span style={{ color:'#94a3b8', display:'flex', alignItems:'center' }}>
        <ChevronRight size={14} strokeWidth={2} />
      </span>
    </button>
  )
}

function FilterPill({ f, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flexShrink:0, padding:'5px 12px', borderRadius:100, border:'none', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all .15s ease',
        background: active?'linear-gradient(135deg,#6366f1,#8b5cf6)':h?'#e2e8f0':'#f1f5f9',
        color: active?'#fff':'#64748b',
        boxShadow: active?'0 2px 8px rgba(99,102,241,0.3)':'none',
      }}
    >
      {f.label}
    </button>
  )
}

function AddMemberBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:16, cursor:'pointer', transition:'all .15s ease',
        border:`2px dashed ${h?'#6366f1':'rgba(99,102,241,0.25)'}`,
        background: h?'rgba(99,102,241,0.05)':'transparent',
        color: h?'#6366f1':'#94a3b8', fontSize:13, fontWeight:600,
      }}
    >
      <Plus size={16} strokeWidth={2.4} />
      Add Family Member
    </button>
  )
}

function FamilyMemberCard({ m, rel, onEdit, onDelete }) {
  const [editH, setEditH] = useState(false)
  const [delH, setDelH]   = useState(false)
  const RelIcon = rel.icon

  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:14, display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(139,92,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#8b5cf6' }}>
        <RelIcon {...lgIconProps} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'2px 8px', marginTop:2 }}>
          <span style={{ fontSize:11, color:'#94a3b8' }}>{m.relation}</span>
          {m.age && <span style={{ fontSize:11, color:'#94a3b8' }}>· {m.age} yrs</span>}
          {m.gender && <span style={{ fontSize:11, color:'#94a3b8' }}>· {m.gender}</span>}
          {m.bloodGroup && <span style={{ fontSize:11, fontWeight:600, color:'#ef4444' }}>· {m.bloodGroup}</span>}
        </div>
      </div>
      <div style={{ display:'flex', gap:4 }}>
        <button
          onMouseEnter={() => setEditH(true)}
          onMouseLeave={() => setEditH(false)}
          onClick={onEdit}
          style={{ width:32, height:32, borderRadius:8, border:'none', background: editH?'#f1f5f9':'transparent', cursor:'pointer', transition:'background .12s ease', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}
        >
          <Pencil size={14} strokeWidth={2} />
        </button>
        <button
          onMouseEnter={() => setDelH(true)}
          onMouseLeave={() => setDelH(false)}
          onClick={onDelete}
          style={{ width:32, height:32, borderRadius:8, border:'none', background: delH?'rgba(239,68,68,0.08)':'transparent', cursor:'pointer', transition:'background .12s ease', display:'flex', alignItems:'center', justifyContent:'center', color: delH?'#ef4444':'#64748b' }}
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

function LogoutBtn({ onLogout }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onLogout}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px', borderRadius:12, border:'none', background: h?'rgba(239,68,68,0.06)':'transparent', cursor:'pointer', textAlign:'left', transition:'background .12s ease' }}
    >
      <div style={{ width:36, height:36, borderRadius:10, background:'rgba(239,68,68,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#ef4444' }}>
        <LogOut {...mdIconProps} />
      </div>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:'#ef4444', margin:0 }}>Sign Out</p>
        <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>Sign out of your MEDLI account</p>
      </div>
    </button>
  )
}