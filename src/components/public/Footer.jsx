export default function Footer() {
  const year = new Date().getFullYear()

  const links = {
    Platform: [
      { label: 'Hospitals', href: '/hospitals' },
      { label: 'Labs', href: '/labs' },
      { label: 'Doctors', href: '/doctors' },
      { label: 'Search', href: '/search' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refunds' },
    ],
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏥</span>
              <span className="text-white font-bold text-xl">MEDLI</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Making healthcare accessible and convenient for everyone. Book appointments, lab tests, and consultations instantly.
            </p>
            <p className="text-xs text-gray-500 mt-4">GSTIN: {process.env.NEXT_PUBLIC_GSTIN || '27MEDLI1234Z1'}</p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold text-sm mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© {year} MEDLI Healthcare Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">📞 +91 98765 43210</span>
            <span className="text-xs text-gray-500">✉️ support@medli.in</span>
          </div>
        </div>
      </div>
    </footer>
  )
}