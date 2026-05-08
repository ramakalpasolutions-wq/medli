'use client'

import Modal from './Modal'
import Button from './Button'

const ICON_CONFIG = {
  danger:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444',  icon: '⚠️' },
  warning: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b',  icon: '⚡' },
  info:    { bg: 'rgba(99,102,241,0.12)', color: '#6366f1',  icon: 'ℹ️' },
  success: { bg: 'rgba(16,185,129,0.12)', color: '#10b981',  icon: '✓'  },
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title       = 'Are you sure?',
  message     = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  variant     = 'danger',
  loading     = false,
  details,
}) {
  const ic         = ICON_CONFIG[variant] ?? ICON_CONFIG.danger
  const btnVariant = variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'primary'

  return (
    <Modal open={open} onClose={onClose} size="sm" hideClose>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 16,
        padding: '8px 0',
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64,
          borderRadius: '50%',
          background: ic.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          flexShrink: 0,
        }}>
          {ic.icon}
        </div>

        {/* Text */}
        <div>
          <h3 style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: 8,
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: 14,
            color: '#64748b',
            lineHeight: 1.65,
            maxWidth: 280,
            margin: '0 auto',
          }}>
            {message}
          </p>
        </div>

        {/* Details */}
        {details && Object.keys(details).length > 0 && (
          <div style={{
            width: '100%',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '4px 0',
            textAlign: 'left',
          }}>
            {Object.entries(details).map(([k, v], i, arr) => (
              <div key={k} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: 10,
          width: '100%',
          marginTop: 4,
        }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            fullWidth
            style={{ flex: 1 }}
          >
            {cancelText}
          </Button>
          <Button
            variant={btnVariant}
            onClick={onConfirm}
            loading={loading}
            fullWidth
            style={{ flex: 1 }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}