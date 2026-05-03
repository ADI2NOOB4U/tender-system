'use client'

type Status = 'pending' | 'processing' | 'done' | 'failed'

interface StatusCardProps {
  status: Status
  jobId: string
  pollCount: number
}

const STATUS_CONFIG: Record<Status, {
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
}> = {
  pending: {
    label: 'PENDING',
    description: 'Document is queued for processing. Please wait.',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    icon: (
      <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
  processing: {
    label: 'PROCESSING',
    description: 'Document is being analysed. OCR and data extraction in progress.',
    color: 'text-blue-800',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: (
      <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
    ),
  },
  done: {
    label: 'COMPLETED',
    description: 'Evaluation complete. Results are available below.',
    color: 'text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    icon: (
      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
  failed: {
    label: 'FAILED',
    description: 'Processing encountered an error. Please re-submit the document.',
    color: 'text-red-800',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: (
      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
}

export function StatusCard({ status, jobId, pollCount }: StatusCardProps) {
  const cfg = STATUS_CONFIG[status]

  return (
    <div className={`border ${cfg.borderColor} ${cfg.bgColor} p-5`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-sm font-bold tracking-widest ${cfg.color}`}>
              {cfg.label}
            </span>
            {(status === 'pending' || status === 'processing') && (
              <span className="text-xs text-gray-400">
                (auto-refreshing every 2s — poll #{pollCount})
              </span>
            )}
          </div>
          <p className={`text-xs ${cfg.color} opacity-80`}>{cfg.description}</p>
        </div>
      </div>
    </div>
  )
}
