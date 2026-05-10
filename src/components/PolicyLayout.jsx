// components/PolicyLayout.jsx
export default function PolicyLayout({ title, company, children }) {
  return (
    <main style={{
      maxWidth: 860, margin: '0 auto',
      padding: 'clamp(40px,6vw,80px) clamp(16px,3vw,32px)',
      color: '#1e293b', lineHeight: 1.8,
    }}>
      <p style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginBottom: 8 }}>
        {company}
      </p>
      <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, marginBottom: 32 }}>
        {title}
      </h1>
      <div style={{ fontSize: 15 }}>{children}</div>
    </main>
  )
}