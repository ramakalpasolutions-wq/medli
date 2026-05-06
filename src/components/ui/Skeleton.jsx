// src/components/ui/Skeleton.jsx
'use client'

// ── Shimmer style ─────────────────────────────────────────────────────────────
const shimmerStyle = {
  background:     'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation:      'shimmer 1.5s infinite linear',
}

// ── Keyframe injected once via a singleton style tag ──────────────────────────
// We use a plain <style> at module level so it's injected only once
const ShimmerStyle = () => (
  <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
)

// ── Pre-defined widths — NO Math.random() — deterministic on server + client ──
// 8 rows × 8 columns — covers any table up to 8 cols wide
const FIXED_WIDTHS = [
  ['72%', '85%', '60%', '78%', '65%', '55%', '90%', '70%'],
  ['55%', '90%', '70%', '62%', '80%', '72%', '65%', '88%'],
  ['80%', '65%', '88%', '74%', '58%', '90%', '78%', '62%'],
  ['68%', '75%', '82%', '90%', '72%', '58%', '84%', '76%'],
  ['76%', '58%', '94%', '66%', '84%', '70%', '60%', '80%'],
  ['63%', '88%', '75%', '92%', '68%', '55%', '82%', '74%'],
  ['85%', '62%', '78%', '54%', '96%', '70%', '86%', '60%'],
  ['70%', '80%', '65%', '88%', '75%', '92%', '58%', '84%'],
]

// ── SkeletonBox — generic shimmer block ───────────────────────────────────────
export function SkeletonBox({ className = '', style = {} }) {
  return (
    <>
      <ShimmerStyle />
      <div
        className={`rounded-lg ${className}`}
        style={{ ...shimmerStyle, ...style }}
      />
    </>
  )
}

// ── SkeletonText — paragraph lines ───────────────────────────────────────────
// Fixed widths per line — no randomness
const TEXT_WIDTHS = ['100%', '92%', '85%', '78%', '60%', '95%', '88%']

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <>
      <ShimmerStyle />
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-full"
            style={{
              ...shimmerStyle,
              // Last line always shorter — use fixed pattern otherwise
              width: i === lines - 1 ? '60%' : TEXT_WIDTHS[i % TEXT_WIDTHS.length],
            }}
          />
        ))}
      </div>
    </>
  )
}

// ── SkeletonCard — card with avatar + text ────────────────────────────────────
export function SkeletonCard({ className = '' }) {
  return (
    <>
      <ShimmerStyle />
      <div
        className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Cover */}
        <div className="h-36 w-full" style={shimmerStyle} />

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Avatar + title row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex-shrink-0" style={shimmerStyle} />
            <div className="flex-1 space-y-2">
              <div className="h-3 rounded-full" style={{ ...shimmerStyle, width: '60%' }} />
              <div className="h-2.5 rounded-full" style={{ ...shimmerStyle, width: '40%' }} />
            </div>
          </div>

          {/* Text lines */}
          <div className="space-y-2">
            <div className="h-3 rounded-full" style={{ ...shimmerStyle, width: '100%' }} />
            <div className="h-3 rounded-full" style={{ ...shimmerStyle, width: '85%'  }} />
            <div className="h-3 rounded-full" style={{ ...shimmerStyle, width: '60%'  }} />
          </div>

          {/* Tag pills */}
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-16 rounded-full" style={shimmerStyle} />
            <div className="h-5 w-20 rounded-full" style={shimmerStyle} />
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between pt-1">
            <div className="h-3 w-24 rounded-full" style={shimmerStyle} />
            <div className="h-8 w-24 rounded-xl"   style={shimmerStyle} />
          </div>
        </div>
      </div>
    </>
  )
}

// ── SkeletonTableRow — table skeleton row ─────────────────────────────────────
// ✅ rowIndex makes widths deterministic — eliminates hydration mismatch
export function SkeletonTableRow({ cols = 5, rowIndex = 0 }) {
  const widths = FIXED_WIDTHS[rowIndex % FIXED_WIDTHS.length]

  return (
    <>
      <ShimmerStyle />
      <tr className="border-b border-gray-50">
        {Array.from({ length: cols }).map((_, i) => (
          <td key={i} className="px-4 py-3">
            <div
              className="h-3 rounded-full"
              style={{ ...shimmerStyle, width: widths[i % widths.length] }}
            />
          </td>
        ))}
      </tr>
    </>
  )
}

// ── SkeletonStats — stats card grid ──────────────────────────────────────────
export function SkeletonStats({ count = 4, className = '' }) {
  return (
    <>
      <ShimmerStyle />
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-20 rounded-full" style={shimmerStyle} />
              <div className="w-9 h-9 rounded-xl"   style={shimmerStyle} />
            </div>
            <div className="h-7 w-24 rounded-lg mb-2" style={shimmerStyle} />
            <div className="h-3 w-16 rounded-full"    style={shimmerStyle} />
          </div>
        ))}
      </div>
    </>
  )
}

// ── SkeletonList — vertical list of rows ─────────────────────────────────────
export function SkeletonList({ rows = 4, className = '' }) {
  return (
    <>
      <ShimmerStyle />
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="w-10 h-10 rounded-full flex-shrink-0" style={shimmerStyle} />
            <div className="flex-1 space-y-2">
              <div
                className="h-3 rounded-full"
                style={{ ...shimmerStyle, width: FIXED_WIDTHS[i % FIXED_WIDTHS.length][0] }}
              />
              <div
                className="h-2.5 rounded-full"
                style={{ ...shimmerStyle, width: FIXED_WIDTHS[i % FIXED_WIDTHS.length][1] }}
              />
            </div>
            <div className="h-6 w-16 rounded-full flex-shrink-0" style={shimmerStyle} />
          </div>
        ))}
      </div>
    </>
  )
}

// ── Default export ────────────────────────────────────────────────────────────
export default SkeletonBox