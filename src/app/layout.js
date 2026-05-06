import './globals.css'
import './tailwind.theme.css'
import { SWRConfig } from 'swr'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title:       'MEDLI – Healthcare Platform',
  description: 'Book hospital appointments, lab tests and online consultations',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 10000, errorRetryCount: 3 }}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SWRConfig>
      </body>
    </html>
  )
}