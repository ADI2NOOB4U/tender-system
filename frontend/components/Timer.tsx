'use client'

import { useEffect, useMemo, useState } from 'react'

interface TimerProps {
  startTime: number
  stopped?: boolean
  className?: string
}

export function Timer({ startTime, stopped = false, className = '' }: TimerProps) {
  const getElapsed = () => Math.max(0, Math.floor((Date.now() - startTime) / 1000))
  const [elapsed, setElapsed] = useState<number>(getElapsed)

  useEffect(() => {
    setElapsed(getElapsed())
    if (stopped) return
    const id = setInterval(() => setElapsed(getElapsed()), 1000)
    return () => clearInterval(id)
  }, [startTime, stopped])

  const display = useMemo(() => {
    const m = Math.floor(elapsed / 60)
    const s = elapsed % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [elapsed])

  return (
    <div className={`${className}`} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div>
        <div className="gov-label" style={{ marginBottom: '4px' }}>Processing Time</div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '28px', fontWeight: 700,
          color: 'var(--navy)', letterSpacing: '0.1em',
        }}>
          {display}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
          {stopped ? 'Total elapsed time' : 'Time elapsed (live)'}
        </div>
      </div>

      {!stopped && (
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: 'var(--navy-light)', marginTop: '16px',
          animation: 'pulse 1.4s ease-in-out infinite',
        }}/>
      )}
    </div>
  )
}
