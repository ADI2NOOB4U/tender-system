'use client'

import { useEffect, useMemo, useState } from 'react'

interface TimerProps {
  startTime: number
  stopped?: boolean
  className?: string
}

export function Timer({
  startTime,
  stopped = false,
  className = '',
}: TimerProps) {
  // =====================================================
  // SAFE INITIAL STATE
  // =====================================================

  const getElapsedSeconds = () => {
    const diff = Date.now() - startTime

    if (diff < 0) return 0

    return Math.floor(diff / 1000)
  }

  const [elapsed, setElapsed] = useState<number>(
    getElapsedSeconds()
  )

  // =====================================================
  // TIMER EFFECT
  // =====================================================

  useEffect(() => {
    // update immediately
    setElapsed(getElapsedSeconds())

    // stop updates if timer stopped
    if (stopped) return

    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds())
    }, 1000)

    // cleanup
    return () => {
      clearInterval(interval)
    }
  }, [startTime, stopped])

  // =====================================================
  // FORMATTED DISPLAY
  // =====================================================

  const display = useMemo(() => {
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60

    return `${String(mins).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}`
  }, [elapsed])

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
    >
      <div>
        <div className="gov-label mb-0.5">
          Processing Time
        </div>

        <div className="font-mono text-2xl font-bold text-gov-navy tracking-widest">
          {display}
        </div>

        <div className="text-xs text-gray-400 mt-0.5">
          {stopped
            ? 'Total elapsed time'
            : 'Time elapsed (live)'}
        </div>
      </div>

      {!stopped && (
        <span
          className="
            w-2.5
            h-2.5
            rounded-full
            bg-gov-blue
            animate-pulse
            mt-4
          "
        />
      )}
    </div>
  )
}