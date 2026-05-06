'use client'

import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const iconColors = {
  danger:  { bg: 'bg-red-100',    icon: 'text-red-600' },
  warning: { bg: 'bg-amber-100',  icon: 'text-amber-600' },
  info:    { bg: 'bg-blue-100',   icon: 'text-blue-600' },
  success: { bg: 'bg-emerald-100',icon: 'text-emerald-600' },
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
  const c = iconColors[variant] ?? iconColors.danger
  const btnVariant = variant === 'danger' ? 'danger' : 'primary'

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${c.bg}`}>
          <AlertTriangle className={`w-6 h-6 ${c.icon}`} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>

        {details && Object.keys(details).length > 0 && (
          <div className="w-full bg-gray-50 rounded-xl p-3 text-left">
            {Object.entries(details).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-500">{k}</span>
                <span className="text-xs font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={btnVariant} className="flex-1" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}