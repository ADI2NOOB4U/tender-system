'use client'

import UploadBox from '@/components/UploadBox'

export default function HomePage() {
  return (
    <main className="page-wrap">

      {/* ── Section header ── */}
      <div className="section-header animate-fadeInUp">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '4px', height: '28px',
            background: 'linear-gradient(to bottom, var(--saffron), var(--saffron-lt))',
            borderRadius: '999px',
            flexShrink: 0,
          }} />
          <h1 style={{ margin: 0 }}>Submit Tender Documents</h1>
        </div>
        <p style={{ paddingLeft: '16px' }}>
          Upload procurement documents for AI-powered OCR extraction, scoring, and comparative ranking.
        </p>
      </div>

      {/* ── Info strip ── */}
      <div
        className="animate-fadeInUp delay-100"
        style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap',
          marginBottom: '28px',
        }}
      >
        {[
          { icon: '📄', label: 'OCR Extraction',    desc: 'Automated text recognition' },
          { icon: '🧠', label: 'AI Scoring',         desc: 'Technical · Financial · Compliance' },
          { icon: '📊', label: 'Ranked Results',     desc: 'Comparative bidder analysis' },
          { icon: '📑', label: 'PDF Export',          desc: 'Official evaluation report' },
        ].map(({ icon, label, desc }) => (
          <div
            key={label}
            style={{
              flex: '1 1 160px',
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = 'var(--shadow-md)'
              el.style.borderColor = 'var(--navy-light)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.transform = ''
              el.style.boxShadow = 'var(--shadow-sm)'
              el.style.borderColor = 'var(--border)'
            }}
          >
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)' }}>{label}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <UploadBox />
    </main>
  )
}
