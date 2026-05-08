'use client'

const SHIMMER = {
  background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'sk-shimmer 1.6s linear infinite',
}

const FIXED_WIDTHS = [
  ['72%','85%','60%','78%','65%','55%','90%','70%'],
  ['55%','90%','70%','62%','80%','72%','65%','88%'],
  ['80%','65%','88%','74%','58%','90%','78%','62%'],
  ['68%','75%','82%','90%','72%','58%','84%','76%'],
  ['76%','58%','94%','66%','84%','70%','60%','80%'],
  ['63%','88%','75%','92%','68%','55%','82%','74%'],
  ['85%','62%','78%','54%','96%','70%','86%','60%'],
  ['70%','80%','65%','88%','75%','92%','58%','84%'],
]

const KF = () => (
  <style>{`@keyframes sk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
)

export function SkeletonBox({ style = {} }) {
  return (
    <>
      <KF />
      <div style={{ borderRadius: 8, ...SHIMMER, ...style }} />
    </>
  )
}

export function SkeletonText({ lines = 3, style: extraStyle = {} }) {
  const WIDTHS = ['100%','92%','85%','78%','60%','95%','88%']
  return (
    <>
      <KF />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...extraStyle }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} style={{
            height: 12, borderRadius: 100,
            width: i === lines - 1 ? '55%' : WIDTHS[i % WIDTHS.length],
            ...SHIMMER,
          }} />
        ))}
      </div>
    </>
  )
}

export function SkeletonCard({ style: extraStyle = {} }) {
  return (
    <>
      <KF />
      <div style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        ...extraStyle,
      }}>
        <div style={{ height: 140, width: '100%', ...SHIMMER }} />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, ...SHIMMER }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 12, borderRadius: 100, width: '60%', ...SHIMMER }} />
              <div style={{ height: 10, borderRadius: 100, width: '40%', ...SHIMMER }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ height: 11, borderRadius: 100, width: '100%', ...SHIMMER }} />
            <div style={{ height: 11, borderRadius: 100, width: '85%',  ...SHIMMER }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ height: 22, width: 60, borderRadius: 100, ...SHIMMER }} />
            <div style={{ height: 22, width: 76, borderRadius: 100, ...SHIMMER }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ height: 11, width: 80, borderRadius: 100, ...SHIMMER }} />
            <div style={{ height: 32, width: 90, borderRadius: 12,  ...SHIMMER }} />
          </div>
        </div>
      </div>
    </>
  )
}

export function SkeletonTableRow({ cols = 5, rowIndex = 0 }) {
  const widths = FIXED_WIDTHS[rowIndex % FIXED_WIDTHS.length]
  return (
    <>
      <KF />
      <tr style={{ borderBottom: '1px solid #f8fafc' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <td key={i} style={{ padding: '12px 16px' }}>
            <div style={{
              height: 12, borderRadius: 100,
              width: widths[i % widths.length],
              ...SHIMMER,
            }} />
          </td>
        ))}
      </tr>
    </>
  )
}

export function SkeletonStats({ count = 4, style: extraStyle = {} }) {
  return (
    <>
      <KF />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        ...extraStyle,
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #f1f5f9',
            padding: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ height: 12, width: 80, borderRadius: 100, ...SHIMMER }} />
              <div style={{ width: 40, height: 40, borderRadius: 12, ...SHIMMER }} />
            </div>
            <div style={{ height: 28, width: 96, borderRadius: 10, marginBottom: 8, ...SHIMMER }} />
            <div style={{ height: 11, width: 64, borderRadius: 100, ...SHIMMER }} />
          </div>
        ))}
      </div>
    </>
  )
}

export function SkeletonList({ rows = 4, style: extraStyle = {} }) {
  return (
    <>
      <KF />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...extraStyle }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #f1f5f9',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, ...SHIMMER }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                height: 12, borderRadius: 100,
                width: FIXED_WIDTHS[i % FIXED_WIDTHS.length][0],
                ...SHIMMER,
              }} />
              <div style={{
                height: 10, borderRadius: 100,
                width: FIXED_WIDTHS[i % FIXED_WIDTHS.length][1],
                ...SHIMMER,
              }} />
            </div>
            <div style={{ height: 24, width: 60, borderRadius: 100, flexShrink: 0, ...SHIMMER }} />
          </div>
        ))}
      </div>
    </>
  )
}

export default SkeletonBox