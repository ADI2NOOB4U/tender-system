'use client'

import { useEffect, useState } from 'react'

export default function ISTClock() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const ist = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)
      setTime(ist + ' IST')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!time) return null

  return (
    <span className="ist-clock" suppressHydrationWarning>
      {time}
    </span>
  )
}
