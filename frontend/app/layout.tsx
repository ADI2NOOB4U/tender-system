import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'e-Procurement Portal — Tender Evaluation System',
  description: 'Government Tender Document Evaluation and Processing System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 flex flex-col">
        {/* Top Government Bar */}
        <div className="bg-gov-navy text-white text-xs py-1.5 px-6 flex items-center justify-between">
          <span className="tracking-widest uppercase font-semibold">
            Government of India &nbsp;|&nbsp; Ministry of Finance
          </span>
          <span className="opacity-70 tracking-wide">Official Use Only</span>
        </div>

        {/* Main Header */}
        <header className="bg-white border-b-2 border-gov-blue shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-5">
            {/* Emblem placeholder */}
            <div className="w-14 h-14 border-2 border-gov-navy rounded-full flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 40 40" className="w-9 h-9 text-gov-navy" fill="currentColor">
                <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 8 L22 15 L29 15 L23 19 L25 26 L20 22 L15 26 L17 19 L11 15 L18 15 Z" />
              </svg>
            </div>
            <div>
              <div className="text-gov-navy font-bold text-lg leading-tight tracking-wide">
                e-Procurement Portal
              </div>
              <div className="text-gov-grey text-xs tracking-widest uppercase mt-0.5">
                Tender Document Evaluation &amp; Processing System
              </div>
            </div>
            <div className="ml-auto text-right hidden md:block">
              <div className="text-xs text-gray-400 tracking-wide">Reference No.</div>
              <div className="text-xs font-mono font-semibold text-gov-navy">TES/2024-25/GOI</div>
            </div>
          </div>

          {/* Navigation strip */}
          <nav className="border-t border-gray-200 bg-gray-50">
            <div className="max-w-6xl mx-auto px-6">
              <ul className="flex gap-0 text-xs font-semibold tracking-wide">
                {['Home', 'Upload Tender', 'Job Status', 'Reports', 'Guidelines'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="block px-4 py-2.5 text-gov-navy hover:bg-gov-navy hover:text-white transition-colors border-r border-gray-200 first:border-l"
                    >
                      {item.toUpperCase()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gov-navy text-white mt-auto">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs opacity-80">
            <span>© 2024 Government of India. All Rights Reserved.</span>
            <span className="tracking-wide">
              Best viewed in Chrome v100+ &nbsp;|&nbsp; 1280×768 resolution &nbsp;|&nbsp; Version 3.2.1
            </span>
          </div>
        </footer>
      </body>
    </html>
  )
}
