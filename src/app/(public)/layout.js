import { ToastProvider } from '@/context/ToastContext'

export default function PublicLayout({ children }) {
  return (
    <ToastProvider>
      <main className="min-h-screen">{children}</main>
    </ToastProvider>
  )
}