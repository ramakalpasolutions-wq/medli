'use client'

import { useEffect, useState } from 'react'

const SIZES = {
  sm:   480,
  md:   560,
  lg:   760,
  xl:   960,
  full: 1200,
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size      = 'md',
  hideClose = false,
  footer,
}) {
  const [show,    setShow]    = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setShow(true)
      const t = setTimeout(() => setVisible(true), 10)
      document.body.style.overflow = 'hidden'
      return () => clearTimeout(t)
    } else {
      setVisible(false)
      const t = setTimeout(() => setShow(false), 250)
      document.body.style.overflow = ''
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!show) return null

  return (
    <>
      <style>{`
        @keyframes modal-in {
          from { transform: scale(0.93) translateY(16px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            transition: 'opacity 0.25s ease',
            opacity: visible ? 1 : 0,
          }}
        />

        {/* Panel */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: SIZES[size] ?? SIZES.md,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          animation: visible ? 'modal-in 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}>
          {/* Header */}
          {(title || !hideClose) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid #f1f5f9',
              flexShrink: 0,
              background: '#fff',
            }}>
              {title && (
                <h2 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: 0,
                }}>
                  {title}
                </h2>
              )}
              {!hideClose && (
                <CloseButton onClose={onClose} title={title} />
              )}
            </div>
          )}

          {/* Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
          }}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div style={{
              flexShrink: 0,
              padding: '16px 24px',
              borderTop: '1px solid #f1f5f9',
              background: '#fafafa',
            }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function CloseButton({ onClose, title }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClose}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        marginLeft: title ? 'auto' : undefined,
        width: 32, height: 32,
        borderRadius: 8,
        border: 'none',
        background: hover ? '#f1f5f9' : 'transparent',
        color: hover ? '#334155' : '#94a3b8',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        fontSize: 18,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      ×
    </button>
  )
}