import './globals.css'
import './tailwind.theme.css'
import { SWRConfig } from 'swr'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'

export const metadata = {
  title:       'MEDLI – Healthcare Platform',
  description: 'Book hospital appointments, lab tests and online consultations',
  keywords:    'hospital booking, lab tests, doctor consultation, healthcare India',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#6366f1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        lineHeight: 1.5,
        minHeight: '100vh',
        overflowX: 'hidden',
      }}>
        <SWRConfig value={{
          revalidateOnFocus: false,
          dedupingInterval: 10000,
          errorRetryCount: 3,
        }}>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </SWRConfig>
      </body>
    </html>
  )
}