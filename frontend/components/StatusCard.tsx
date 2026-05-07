'use client'

import React from 'react'

type Status = 'pending' | 'processing' | 'done' | 'failed'

interface StatusCardProps {
  status:    Status
  jobId:     string
  pollCount: number
}

const STATUS_CONFIG: Record<Status, {
  label:       string
  description: string
  color:       string
  bg:          string
  border:      string
  accentBar:   string
  icon:        React.ReactNode
}> = {
  pending: {
    label:       'QUEUED',
    description: 'Document is queued for processing. Your submission is confirmed and awaiting the evaluation pipeline.',
    color:       '#78350f',
    bg:          'linear-gradient(135deg, #fffbeb 0%, #fef9e8 100%)',
    border:      '#fde68a',
    accentBar:   '#f59e0b',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  processing: {
    label:       'PROCESSING',
    description: 'OCR extraction and AI evaluation in progress. This typically takes 30–90 seconds per document.',
    color:       '#1e3a8a',
    bg:          'linear-gradient(135deg, #eff6ff 0%, #e8f0ff 100%)',
    border:      '#93c5fd',
    accentBar:   '#2563eb',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: 'spin 0.9s linear infinite' }}>
        <polyline points="23 4 23 10 17 10"/>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
    ),
  },
  done: {
    label:       'COMPLETED',
    description: 'Evaluation complete. AI scoring and ranking results are available below.',
    color:       '#14532d',
    bg:          'linear-gradient(135deg, #f0fdf4 0%, #ecfdf7 100%)',
    border:      '#86efac',
    accentBar:   '#16a34a',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  failed: {
    label:       'FAILED',
    description: 'Processing encountered an error. Please re-submit the document or contact helpdesk.',
    color:       '#7f1d1d',
    bg:          'linear-gradient(135deg, #fff1f2 0%, #fff0f0 100%)',
    border:      '#fca5a5',
    accentBar:   '#dc2626',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
}

export function StatusCard({ status, jobId, pollCount }: StatusCardProps) {
  const cfg = STATUS_CONFIG[status]
  const isActive = status === 'pending' || status === 'processing'

  return (
    <div
      className="status-card animate-fadeInUp"
      style={{
        background:   cfg.bg,
        borderColor:  cfg.border,
        color:        cfg.color,
        position:     'relative',
        overflow:     'hidden',
        boxShadow:    '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Accent bar */}
      <div style={{
        position:     'absolute',
        left:         0, top: 0, bottom: 0,
        width:        '4px',
        background:   cfg.accentBar,
        borderRadius: '4px 0 0 4px',
      }} />

      {/* Processing shimmer */}
      {isActive && (
        <div style={{
          position:   'absolute',
          inset:      0,
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(255,255,255,0.25) 40%,
            rgba(255,255,255,0.5) 50%,
            rgba(255,255,255,0.25) 60%,
            transparent 100%
          )`,
          backgroundSize: '200% 100%',
          animation:      'shimmerSweep 2.2s ease-in-out infinite',
          pointerEvents:  'none',
        }} />
      )}

      <div style={{ flexShrink: 0, marginTop: '1px', paddingLeft: '6px' }}>{cfg.icon}</div>

      <div style={{ flex: 1 }}>
        <div style={{
          display:     'flex', alignItems: 'center',
          gap:         '12px', marginBottom: '4px', flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: cfg.color,
          }}>
            {cfg.label}
          </span>

          {isActive && (
            <span style={{
              fontSize: '10px', color: 'var(--text-muted)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              Auto-refreshing every 2s · Poll #{pollCount}
            </span>
          )}

          {status === 'done' && (
            <span style={{
              fontSize: '10px', fontWeight: 700,
              color: '#16a34a',
              background: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '999px',
              padding: '2px 8px',
              letterSpacing: '0.08em',
            }}>
              ✓ READY
            </span>
          )}
        </div>

        <p style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.5 }}>
          {cfg.description}
        </p>

        <div style={{
          marginTop: '8px', fontSize: '10px',
          fontFamily: "'IBM Plex Mono', monospace",
          color: 'var(--text-muted)',
        }}>
          Job ID: <strong style={{ color: cfg.color }}>{jobId}</strong>
        </div>
      </div>
    </div>
  )
}
