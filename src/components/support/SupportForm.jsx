'use client'

import { useState } from 'react'
import { Headphones, Mail, Phone, Clock3, Send } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '11px 13px',
          borderRadius: 12,
          border: '1.5px solid #e2e8f0',
          outline: 'none',
          fontSize: 13,
          color: '#0f172a',
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 6 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '11px 13px',
          borderRadius: 12,
          border: '1.5px solid #e2e8f0',
          outline: 'none',
          fontSize: 13,
          color: '#0f172a',
          background: '#fff',
          resize: 'vertical',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      />
    </div>
  )
}

export default function SupportForm({ title = 'Contact Support', subtitle = 'Submit your issue or question' }) {
  const toast = useToast()
  const [form, setForm] = useState({
    subject: '',
    category: 'other',
    message: '',
  })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!form.subject.trim()) return toast.error('Subject is required')
    if (!form.message.trim()) return toast.error('Message is required')

    setLoading(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject.trim(),
          category: form.category,
          message: form.message.trim(),
        }),
      })

      const json = await res.json()
      if (json.success) {
        toast.success('Support request submitted')
        setForm({ subject: '', category: 'other', message: '' })
      } else {
        toast.error(json.error || 'Failed to submit request')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          border: '1px solid #eef2f7',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(99,102,241,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366f1',
            }}
          >
            <Headphones size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>{title}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{subtitle}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Subject"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Enter issue subject"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              style={{
                width: '100%',
                padding: '11px 13px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
                outline: 'none',
                fontSize: 13,
                color: '#0f172a',
                background: '#fff',
              }}
            >
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="account">Account</option>
              <option value="appointment">Appointment</option>
              <option value="report">Report</option>
              <option value="other">Other</option>
            </select>
          </div>

          <TextArea
            label="Message"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="Describe your issue clearly"
          />

          <button
            onClick={submit}
            disabled={loading}
            style={{
              marginTop: 4,
              padding: '11px 16px',
              borderRadius: 12,
              border: 'none',
              background: loading ? '#cbd5e1' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: loading ? 'none' : '0 8px 18px rgba(99,102,241,0.22)',
            }}
          >
            <Send size={15} />
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          border: '1px solid #eef2f7',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Support Details</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mail size={16} color="#6366f1" />
          <span style={{ fontSize: 13, color: '#334155' }}>contact@medli.in</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Phone size={16} color="#10b981" />
          <span style={{ fontSize: 13, color: '#334155' }}>+91 90000 00000</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock3 size={16} color="#f59e0b" />
          <span style={{ fontSize: 13, color: '#334155' }}>Mon - Sat, 9:00 AM to 6:00 PM</span>
        </div>

        <div
          style={{
            marginTop: 8,
            padding: 14,
            borderRadius: 14,
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.12)',
            color: '#475569',
            fontSize: 12,
            lineHeight: 1.65,
          }}
        >
          Our team reviews every support request. Super Admin can track and manage all submitted tickets from the central support dashboard.
        </div>
      </div>
    </div>
  )
}