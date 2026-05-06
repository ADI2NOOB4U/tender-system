'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ResultsUI from '@/components/ResultsUI'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Breakdown {
  technical?: number
  financial?: number
  compliance?: number
}

interface ParsedResult {
  jobId: string
  company: string
  amount: number | null
  score: number
  status: string
  explanation: string
  breakdown: Breakdown
  confidence: number
}

interface JobResponse {
  job_id: string
  status: string
  result?: {
    structured?: {
      company?: string
      vendor?: string
      name?: string
      amount?: number
      total?: number
    }
    evaluation?: {
      score?: number
      status?: string
      evaluation?: string
      confidence?: number
      explanation?: string
      breakdown?: Breakdown
    }
    explanation?: string
  }
  data?: JobResponse['result']
}

interface UploadBoxProps {
  apiUrl?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set(['done', 'completed', 'failed', 'error'])
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 30

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJob(job: JobResponse): ParsedResult {
  const payload = job.result ?? job.data ?? {}
  const structured = payload.structured ?? {}
  const evaluation = payload.evaluation ?? {}
  return {
    jobId: job.job_id,
    company: structured.company ?? structured.vendor ?? structured.name ?? 'Unknown Company',
    amount: structured.amount ?? structured.total ?? null,
    score: Number(evaluation.score) || 0,
    status: evaluation.status ?? evaluation.evaluation ?? 'REVIEW',
    explanation: evaluation.explanation ?? payload.explanation ?? 'No explanation available',
    breakdown: evaluation.breakdown ?? { technical: 0, financial: 0, compliance: 0 },
    confidence: Number(evaluation.confidence) || 0,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UploadBox({ apiUrl }: UploadBoxProps) {
  const API_URL = apiUrl ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api'

  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [resultMap, setResultMap] = useState<Map<string, ParsedResult>>(new Map())
  const [minScore, setMinScore] = useState(0)

  // Tracks active intervals keyed by jobId
  const pollIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())
  // Tracks how many jobs are still actively polling
  const activeJobCount = useRef(0)

  // ── Unmount cleanup ────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      pollIntervals.current.forEach(clearInterval)
      pollIntervals.current.clear()
    }
  }, [])

  // ── Polling ────────────────────────────────────────────────────────────────

  const startPolling = useCallback(
    (jobId: string) => {
      // Guard: never start a duplicate interval for the same job
      if (pollIntervals.current.has(jobId)) return

      let attempts = 0
      activeJobCount.current += 1

      const stopJob = () => {
        const id = pollIntervals.current.get(jobId)
        if (id !== undefined) {
          clearInterval(id)
          pollIntervals.current.delete(jobId)
        }
        activeJobCount.current = Math.max(0, activeJobCount.current - 1)
        if (activeJobCount.current === 0) {
          setLoading(false)
        }
      }

      const intervalId = setInterval(async () => {
        let statusLower = ''
        attempts += 1

        try {
          const res = await fetch(`${API_URL}/job/${jobId}`, { cache: 'no-store' })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)

          const job: JobResponse = await res.json()
          statusLower = String(job.status ?? '').toLowerCase()

          if (job.result || job.data) {
            const parsed = parseJob(job)

            setResultMap((prev) => {
              const updated = new Map(prev)
              updated.set(jobId, parsed)
              return updated
            })

            // STOP immediately after result arrives
            stopJob()
            return
          }

          if (TERMINAL_STATUSES.has(statusLower)) {
            stopJob()
          }
        } catch (err) {
          console.error(
            `Error polling job ${jobId}:`,
            err
          )
          stopJob()
        }
      }, POLL_INTERVAL_MS)

      pollIntervals.current.set(jobId, intervalId)
    },
    [API_URL],
  )

  // ── Upload ─────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async () => {
    if (files.length === 0 || loading) return

    // Cancel all running polls before a new upload
    pollIntervals.current.forEach(clearInterval)
    pollIntervals.current.clear()
    activeJobCount.current = 0

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))

      const res = await fetch(`${API_URL}/upload-batch`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Upload failed (${res.status})`)
      }

      const data = await res.json()
      const jobIds: string[] = data.jobs ?? []

      if (jobIds.length === 0) throw new Error('No job IDs returned from server')

      jobIds.forEach((id) => startPolling(id))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Check console.'
      setError(msg)
      setLoading(false)
      console.error(err)
    }
  }, [files, loading, API_URL, startPolling])

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFileChange = useCallback((list: FileList | null) => {
    if (!list) return
    setFiles(Array.from(list))
    setError(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      handleFileChange(e.dataTransfer.files)
    },
    [handleFileChange],
  )

  // ── Derived ────────────────────────────────────────────────────────────────

  const parsedResults = useMemo(
    () => Array.from(resultMap.values()).sort((a, b) => b.score - a.score),
    [resultMap],
  )

  const filteredResults = useMemo(
    () => parsedResults.filter((r) => r.score >= minScore),
    [parsedResults, minScore],
  )

  const winner: ParsedResult | null = filteredResults[0] ?? null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="upload-card">
        <div className="upload-card-header">
          <div className="card-icon">📂</div>
          <div>
            <div className="card-label">Document Upload</div>
            <div className="card-sublabel">PDF, PNG, JPG — multiple files supported</div>
          </div>
        </div>

        <div
          className={`dropzone${dragOver ? ' over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => handleFileChange(e.target.files)}
          />
          <span className="dropzone-icon">📄</span>
          <div className="dropzone-text">Drag & drop files here, or click to browse</div>
          <div className="dropzone-hint">
            Upload multiple bidder documents for comparative evaluation
          </div>
        </div>

        {files.length > 0 && (
          <div className="file-selected">
            <span>✅</span>
            <span>
              {files.length} file{files.length > 1 ? 's' : ''} selected:{' '}
              {files.map((f) => f.name).join(', ')}
            </span>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#fff0f0',
              border: '1px solid #ffcccc',
              borderRadius: '0.5rem',
              color: '#cc0000',
              fontSize: '0.875rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <button
          className="submit-btn"
          onClick={handleUpload}
          disabled={loading || files.length === 0}
        >
          {loading ? (
            <><span className="spinner" /> Evaluating…</>
          ) : (
            <>🔍 Submit for Evaluation</>
          )}
        </button>
      </div>

      {parsedResults.length > 0 && (
        <ResultsUI
          parsedResults={parsedResults}
          filteredResults={filteredResults}
          winner={winner}
          minScore={minScore}
          setMinScore={setMinScore}
        />
      )}
    </div>
  )
}