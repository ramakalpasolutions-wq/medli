'use client'

import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '20px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%',
        width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ zIndex: 1 }}
      >
        {/* 404 number */}
        <div style={{
          fontSize: 120,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          marginBottom: 8,
          letterSpacing: '-4px',
        }}>
          404
        </div>

        {/* Icon */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 60, marginBottom: 24 }}
        >
          🏥
        </motion.div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: 12,
          letterSpacing: '-0.5px',
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.5)',
          maxWidth: 380,
          lineHeight: 1.7,
          marginBottom: 40,
        }}>
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back to health.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.a
            href="/"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
            }}
          >
            🏠 Go Home
          </motion.a>

          <motion.a
            href="/search"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            🔍 Search
          </motion.a>
        </div>
      </motion.div>
    </div>
  )
}