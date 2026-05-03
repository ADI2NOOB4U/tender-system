'use client'

import { useEffect, useState } from 'react'

interface TimerProps {
  startTime: number
  stopped?: boolean
}

export function Timer({ startTime, stopped }: TimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const tick = () => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }

    tick()

    if (stopped) return

    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime, stopped])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-3">
      <div>
        <div className="gov-label mb-0.5">Processing Time</div>
        <div className="font-mono text-2xl font-bold text-gov-navy tracking-widest">
          {display}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {stopped ? 'Total elapsed time' : 'Time elapsed (live)'}
        </div>
      </div>

      {!stopped && (
        <span className="w-2.5 h-2.5 rounded-full bg-gov-blue blink mt-4" />
      )}
    </div>
  )
} 