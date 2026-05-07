import type { Metadata } from 'next'
import './globals.css'
import ISTClock from '@/components/ISTClock'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'e-Procurement Portal — AI Tender Evaluation System',
  description: 'Government of India · AI-Powered Tender Document Evaluation & Comparative Scoring',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">

        {/* Indian Tricolour Strip */}
        <div className="flag-strip" aria-hidden="true">
          <div className="saffron" />
          <div className="white" />
          <div className="green" />
        </div>

        {/* GOI Top Bar with Live IST Clock */}
        <div className="goi-topbar">
          <span>
            <strong>भारत सरकार</strong>
            &nbsp;·&nbsp;
            Government of India &nbsp;|&nbsp; Ministry of Finance &nbsp;·&nbsp; Dept. of Expenditure
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <span style={{ opacity: 0.5, fontSize: '10px', letterSpacing: '0.1em' }}>
              OFFICIAL USE ONLY
            </span>
            <ISTClock />
          </span>
        </div>

        {/* Main Header */}
        <header className="site-header">
          <div className="header-inner">
            <div className="emblem-ring">
              <svg viewBox="0 0 40 40" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="16" stroke="#0f2044" strokeWidth="2"/>
                <circle cx="20" cy="20" r="3" fill="#0f2044"/>
                <line x1="20" y1="7" x2="20" y2="17" stroke="#0f2044" strokeWidth="1"/>
                <line x1="20" y1="23" x2="20" y2="33" stroke="#0f2044" strokeWidth="1"/>
                <line x1="7" y1="20" x2="17" y2="20" stroke="#0f2044" strokeWidth="1"/>
                <line x1="23" y1="20" x2="33" y2="20" stroke="#0f2044" strokeWidth="1"/>
                <line x1="11" y1="11" x2="17.5" y2="17.5" stroke="#0f2044" strokeWidth="1"/>
                <line x1="22.5" y1="22.5" x2="29" y2="29" stroke="#0f2044" strokeWidth="1"/>
                <line x1="29" y1="11" x2="22.5" y2="17.5" stroke="#0f2044" strokeWidth="1"/>
                <line x1="17.5" y1="22.5" x2="11" y2="29" stroke="#0f2044" strokeWidth="1"/>
                <line x1="9" y1="15" x2="16" y2="18" stroke="#0f2044" strokeWidth="0.7"/>
                <line x1="24" y1="22" x2="31" y2="25" stroke="#0f2044" strokeWidth="0.7"/>
                <line x1="15" y1="9" x2="18" y2="16" stroke="#0f2044" strokeWidth="0.7"/>
                <line x1="22" y1="24" x2="25" y2="31" stroke="#0f2044" strokeWidth="0.7"/>
                <line x1="31" y1="15" x2="24" y2="18" stroke="#0f2044" strokeWidth="0.7"/>
                <line x1="16" y1="22" x2="9" y2="25" stroke="#0f2044" strokeWidth="0.7"/>
                <line x1="25" y1="9" x2="22" y2="16" stroke="#0f2044" strokeWidth="0.7"/>
                <line x1="18" y1="24" x2="15" y2="31" stroke="#0f2044" strokeWidth="0.7"/>
              </svg>
            </div>

            <div>
              <div className="portal-title">e-Procurement Portal</div>
              <div className="portal-subtitle">AI Tender Evaluation &amp; Comparative Scoring System</div>
            </div>

            <div style={{
              marginLeft: '16px',
              background: 'linear-gradient(135deg, #1a3560, #2350a0)',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '5px 10px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px' }}>🤖</span>
              AI Powered
            </div>

            <div className="header-ref">
              <div className="ref-label">Reference No.</div>
              <div className="ref-num">TES/2025-26/AI/GOI</div>
            </div>
          </div>
          <Navbar />
        </header>

        <main className="page-wrap" style={{ flex: 1 }}>
          {children}
        </main>

        <footer className="site-footer">
          <div className="footer-inner">
            <span>© 2025 Government of India · All Rights Reserved</span>
            <span>Best viewed: Chrome v100+ · 1280×768 &nbsp;|&nbsp; Version 4.1.0-AI</span>
          </div>
          <div className="flag-strip" style={{ height: '3px' }} aria-hidden="true">
            <div className="saffron" />
            <div className="white" />
            <div className="green" />
          </div>
        </footer>
      </body>
    </html>
  )
}