export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      gap: '20px',
    }}>
      {/* Animated logo ring */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        {/* Outer spinning ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#6366f1',
          borderRightColor: '#8b5cf6',
          animation: 'medli-spin 1s linear infinite',
        }} />
        {/* Inner pulsing circle */}
        <div style={{
          position: 'absolute',
          inset: 8,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'medli-pulse 2s ease-in-out infinite',
          fontSize: 24,
        }}>
          🏥
        </div>
      </div>

      {/* Brand text */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 28,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.5px',
          marginBottom: 6,
        }}>
          MEDLI
        </div>
        <div style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}>
          Loading...
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#6366f1',
            animation: `medli-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      {/* Inline keyframes via style tag */}
      <style>{`
        @keyframes medli-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes medli-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.92); opacity: 0.8; }
        }
        @keyframes medli-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}