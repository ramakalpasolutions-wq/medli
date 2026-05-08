import { ToastProvider } from '@/context/ToastContext'

export default function PublicLayout({ children }) {
  return (
    <ToastProvider>
      <main style={{ minHeight: '100vh', overflowX: 'hidden' }}>
        {children}
      </main>
    </ToastProvider>
  )
}