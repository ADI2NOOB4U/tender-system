'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ResultsUI from '@/components/ResultsUI'

// ── Types ────────────────────────────────────────────────────────────────────

interface Breakdown {
  technical?: number
  financial?: number
  compliance?: number
}

interface ParsedResult {
  jobId:       string
  company:     string
  amount:      number | null
  score:       number
  status:      string
  explanation: string
  breakdown:   Breakdown
  confidence:  number
}

interface JobResponse {
  job_id:  string
  status:  string
  result?: {
    structured?: { company?: string; vendor?: string; name?: string; amount?: number; total?: number }
    evaluation?: {
      score?: number; status?: string; evaluation?: string;
      confidence?: number; explanation?: string; breakdown?: Breakdown
    }
    explanation?: string
  }
  data?: JobResponse['result']
}

interface UploadBoxProps {
  apiUrl?: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set(['done', 'completed', 'failed', 'error'])
const POLL_INTERVAL_MS  = 2000
const MAX_POLL_ATTEMPTS = 30

const PROCESSING_STEPS = [
  { id: 'ocr',    label: 'OCR Extraction',      icon: '🔍', delay: 0    },
  { id: 'parse',  label: 'Document Parsing',     icon: '📋', delay: 1400 },
  { id: 'eval',   label: 'AI Scoring',           icon: '🧠', delay: 3000 },
  { id: 'rank',   label: 'Comparative Ranking',  icon: '📊', delay: 5000 },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseJob(job: JobResponse): ParsedResult {
  const payload    = job.result ?? job.data ?? {}
  const structured = payload.structured ?? {}
  const evaluation = payload.evaluation ?? {}
  return {
    jobId:       job.job_id,
    company:     structured.company ?? structured.vendor ?? structured.name ?? 'Unknown Company',
    amount:      structured.amount ?? structured.total ?? null,
    score:       Number(evaluation.score) || 0,
    status:      evaluation.status ?? evaluation.evaluation ?? 'REVIEW',
    explanation: evaluation.explanation ?? payload.explanation ?? 'No explanation available.',
    breakdown:   evaluation.breakdown ?? { technical: 0, financial: 0, compliance: 0 },
    confidence:  Number(evaluation.confidence) || 0,
  }
}

// ── Loading Overlay Component ─────────────────────────────────────────────────

function ProcessingOverlay({ fileCount, pollCount }: { fileCount: number; pollCount: number }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timers = PROCESSING_STEPS.slice(1).map((step, i) =>
      setTimeout(() => setActiveStep(i + 1), step.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="processing-overlay animate-fadeInScale">
      {/* Pulsing AI ring */}
      <div className="ai-pulse-ring">
        <div className="ai-pulse-inner">🏛️</div>
      </div>

      <div>
        <div className="processing-title">Analyzing Tender Documents…</div>
        <div className="processing-subtitle">
          AI pipeline processing {fileCount} document{fileCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Animated steps */}
      <div className="processing-steps">
        {PROCESSING_STEPS.map((step, i) => (
          <div
            key={step.id}
            className={`processing-step ${
              i < activeStep ? 'done' : i === activeStep ? 'active' : ''
            }`}
          >
            <div className="step-dot" />
            <span style={{ fontSize: '14px' }}>{step.icon}</span>
            <span>{step.label}</span>
            {i < activeStep && (
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--india-green)', fontWeight: 700 }}>
                ✓ Done
              </span>
            )}
            {i === activeStep && (
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                Running…
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Pulsing dots */}
      <div className="loading-dots">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>

      {/* Poll counter */}
      <div style={{
        fontSize: '10px', color: 'var(--text-muted)',
        fontFamily: "'IBM Plex Mono', monospace",
        position: 'relative', zIndex: 1,
      }}>
        Auto-refresh active · Poll #{pollCount}
      </div>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function UploadBox({ apiUrl }: UploadBoxProps) {
  const API_URL = apiUrl ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api'

  const [files,     setFiles]     = useState<File[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [dragOver,  setDragOver]  = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const [resultMap, setResultMap] = useState<Map<string, ParsedResult>>(new Map())
  const [minScore,  setMinScore]  = useState(0)

  const pollIntervals  = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())
  const activeJobCount = useRef(0)

  useEffect(() => () => {
    pollIntervals.current.forEach(clearInterval)
    pollIntervals.current.clear()
  }, [])

  const startPolling = useCallback((jobId: string) => {
    if (pollIntervals.current.has(jobId)) return
    let attempts = 0
    activeJobCount.current += 1

    const stopJob = () => {
      const id = pollIntervals.current.get(jobId)
      if (id !== undefined) { clearInterval(id); pollIntervals.current.delete(jobId) }
      activeJobCount.current = Math.max(0, activeJobCount.current - 1)
      if (activeJobCount.current === 0) setLoading(false)
    }

    const intervalId = setInterval(async () => {
      attempts += 1
      setPollCount((c) => c + 1)

      try {
        const res = await fetch(`${API_URL}/job/${jobId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const job: JobResponse = await res.json()
        const statusLower = String(job.status ?? '').toLowerCase()

        if (job.result || job.data) {
          setResultMap((prev) => {
            const updated = new Map(prev)
            updated.set(jobId, parseJob(job))
            return updated
          })
          stopJob()
          return
        }
        if (TERMINAL_STATUSES.has(statusLower) || attempts >= MAX_POLL_ATTEMPTS) stopJob()
      } catch (err) {
        console.error(`Error polling job ${jobId}:`, err)
        stopJob()
      }
    }, POLL_INTERVAL_MS)

    pollIntervals.current.set(jobId, intervalId)
  }, [API_URL])

  const handleUpload = useCallback(async () => {
    if (files.length === 0 || loading) return
    pollIntervals.current.forEach(clearInterval)
    pollIntervals.current.clear()
    activeJobCount.current = 0

    setLoading(true)
    setError(null)
    setPollCount(0)
    setResultMap(new Map())

    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))

      const res = await fetch(`${API_URL}/upload-batch`, { method: 'POST', body: formData })
      if (!res.ok) { const text = await res.text(); throw new Error(text || `Upload failed (${res.status})`) }

      const data = await res.json()
      const jobIds: string[] = data.jobs ?? []
      if (jobIds.length === 0) throw new Error('No job IDs returned from server')

      jobIds.forEach((id) => startPolling(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Check console.')
      setLoading(false)
      console.error(err)
    }
  }, [files, loading, API_URL, startPolling])

  const handleFileChange = useCallback((list: FileList | null) => {
    if (!list) return
    setFiles(Array.from(list))
    setError(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    handleFileChange(e.dataTransfer.files)
  }, [handleFileChange])

  const parsedResults   = useMemo(() => Array.from(resultMap.values()).sort((a, b) => b.score - a.score), [resultMap])
  const filteredResults = useMemo(() => parsedResults.filter((r) => r.score >= minScore), [parsedResults, minScore])
  const winner          = filteredResults[0] ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Upload card ── */}
      <div className="gov-card animate-fadeInUp">
        <div className="gov-card-header">
          <div className="gov-card-icon">📂</div>
          <div>
            <div className="gov-card-title">Document Upload</div>
            <div className="gov-card-sub">PDF, PNG, JPG — multiple files for comparative evaluation</div>
          </div>
          {loading && (
            <div style={{ marginLeft: 'auto' }}>
              <span className="ai-badge">
                <span className="ai-badge-dot" />
                Processing
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '22px' }}>

          {/* ── Dropzone ── */}
          {!loading && (
            <div
              className={`dropzone${dragOver ? ' over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                type="file" multiple accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => handleFileChange(e.target.files)}
              />
              <span className="dropzone-icon">📄</span>
              <div className="dropzone-text">Drag &amp; drop files here, or click to browse</div>
              <div className="dropzone-hint">
                Upload all bidder documents for simultaneous comparative evaluation
              </div>
            </div>
          )}

          {/* ── File list ── */}
          {files.length > 0 && !loading && (
            <div className="file-selected">
              <span>✅</span>
              <span>
                <strong>{files.length} file{files.length > 1 ? 's' : ''} selected:</strong>{' '}
                {files.map((f) => f.name).join(', ')}
              </span>
            </div>
          )}

          {/* ── Immersive loading overlay ── */}
          {loading && (
            <ProcessingOverlay fileCount={files.length} pollCount={pollCount} />
          )}

          {/* ── Error ── */}
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fff1f2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              color: '#7f1d1d',
              fontSize: '13px',
              marginBottom: '16px',
              animation: 'slideIn 0.3s ease',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Submit button ── */}
          <button
            className="submit-btn"
            onClick={handleUpload}
            disabled={loading || files.length === 0}
          >
            {loading
              ? <><span className="spinner" /> Processing {files.length} document{files.length > 1 ? 's' : ''}…</>
              : <>🔍 Submit for AI Evaluation</>
            }
          </button>

          <div style={{
            marginTop: '12px', fontSize: '11px',
            color: 'var(--text-muted)', textAlign: 'center',
          }}>
            By submitting, you confirm these documents are for official procurement evaluation only.
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {parsedResults.length > 0 && (
        <div className="animate-fadeInUp delay-200">
          <div className="results-divider">
            <div className="results-divider-line" />
            <span className="results-divider-text">Evaluation Results</span>
            <div className="results-divider-line" />
          </div>

          <ResultsUI
            parsedResults={parsedResults}
            filteredResults={filteredResults}
            winner={winner}
            minScore={minScore}
            setMinScore={setMinScore}
          />
        </div>
      )}
    </div>
  )
}
