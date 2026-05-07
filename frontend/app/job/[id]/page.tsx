'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  useParams,
  useRouter,
} from 'next/navigation'

import {
  getJob,
  JobResponse,
} from '@/lib/api'

import { StatusCard } from '@/components/StatusCard'
import { Timer } from '@/components/Timer'
import { ResultView } from '@/components/ResultView'

const TERMINAL_STATUSES = [
  'completed',
  'failed',
  'done',
  'error',
]

const POLL_INTERVAL_MS = 2000

export default function JobPage() {
  const params = useParams()
  const router = useRouter()

  const id = String(params?.id || '')

  const [job, setJob] =
    useState<JobResponse | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [fetchError, setFetchError] =
    useState<string | null>(null)

  const [pollCount, setPollCount] =
    useState(0)

  const startTimeRef = useRef<number>(
    Date.now()
  )

  const intervalRef = useRef<
    NodeJS.Timeout | undefined
  >(undefined)

  // =====================================================
  // START TIME PERSISTENCE
  // =====================================================

  useEffect(() => {
    if (!id) return

    const key = `job-${id}-start`

    const saved =
      localStorage.getItem(key)

    if (saved) {
      startTimeRef.current =
        Number(saved)
    } else {
      const now = Date.now()

      startTimeRef.current = now

      localStorage.setItem(
        key,
        String(now)
      )
    }
  }, [id])

  // =====================================================
  // FETCH JOB
  // =====================================================

  const fetchJob = useCallback(
    async () => {
      if (!id) return

      try {
        const data = await getJob(id)

        setJob(data)

        setFetchError(null)

        setPollCount((prev) => prev + 1)

        // stop polling if terminal
        if (
          TERMINAL_STATUSES.includes(
            String(data?.status).toLowerCase()
          )
        ) {
          if (intervalRef.current) {
            clearInterval(
              intervalRef.current
            )
          }
        }
      } catch (err: unknown) {
        setFetchError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch job status.'
        )
      } finally {
        setLoading(false)
      }
    },
    [id]
  )

  // =====================================================
  // POLLING
  // =====================================================

  useEffect(() => {
    if (!id) return

    fetchJob()

    intervalRef.current = setInterval(
      fetchJob,
      POLL_INTERVAL_MS
    )

    return () => {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        )
      }
    }
  }, [id, fetchJob])

  // =====================================================
  // STATE FLAGS
  // =====================================================

  const normalizedStatus = String(
    job?.status || 'pending'
  ).toLowerCase()

  const isDone =
    normalizedStatus === 'completed' ||
    normalizedStatus === 'done'

  const isFailed =
    normalizedStatus === 'failed' ||
    normalizedStatus === 'error'

  const isTerminal =
    isDone || isFailed

  // =====================================================
  // PIPELINE MAP
  // =====================================================

  const statusStepMap: Record<
    string,
    number
  > = {
    queued: 1,
    pending: 1,

    processing: 2,

    ocr: 3,

    extracting: 4,

    evaluating: 5,

    completed: 6,
    done: 6,

    failed: 6,
    error: 6,
  }

  const currentStep =
    statusStepMap[normalizedStatus] ||
    1

  const pipelineSteps = useMemo(
    () => [
      'Document Received',
      'Processing Started',
      'OCR Text Extraction',
      'Data Extraction',
      'Eligibility Evaluation',
      'Result Generated',
    ],
    []
  )

  // =====================================================
  // DOWNLOAD RESULT
  // =====================================================

  const downloadResult = () => {
    if (!job) return

    const blob = new Blob(
      [JSON.stringify(job, null, 2)],
      {
        type: 'application/json',
      }
    )

    const url =
      URL.createObjectURL(blob)

    const a =
      document.createElement('a')

    a.href = url

    a.download = `result-${id}.json`

    a.click()

    URL.revokeObjectURL(url)
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 tracking-wide">
        <button
          onClick={() => router.push('/')}
          className="hover:underline text-gov-blue"
        >
          Home
        </button>

        &nbsp;&rsaquo;&nbsp;

        Job Status

        &nbsp;&rsaquo;&nbsp;

        <span className="font-mono">
          {id}
        </span>
      </div>

      {/* Header */}
      <div className="border-b-2 border-gov-navy pb-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gov-navy tracking-wide">
            AI Tender Evaluation Pipeline
          </h1>

          <p className="text-xs text-gray-500 mt-1">
            Real-time intelligent document analysis
          </p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="text-xs border border-gray-300 px-3 py-1.5 text-gov-navy hover:bg-gray-100"
        >
          ← New Upload
        </button>
      </div>

      {/* Job Meta */}
      <div className="gov-card p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <div>
            <div className="gov-label">
              Job ID
            </div>

            <div className="font-mono text-sm font-bold text-gov-navy break-all">
              {id}
            </div>
          </div>

          <div>
            <div className="gov-label">
              Status
            </div>

            <span
              className={`px-3 py-1 text-xs font-bold border
              ${
                isDone
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : isFailed
                  ? 'bg-red-100 text-red-700 border-red-300'
                  : normalizedStatus ===
                    'evaluating'
                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                  : normalizedStatus ===
                      'ocr' ||
                    normalizedStatus ===
                      'extracting'
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}
            >
              {normalizedStatus}
            </span>
          </div>

          <div>
            <div className="gov-label">
              Checks
            </div>

            <div className="text-sm font-bold text-gov-navy">
              {pollCount}
            </div>
          </div>

          <Timer
            startTime={
              startTimeRef.current
            }
            stopped={isTerminal}
          />
        </div>
      </div>

      {/* Error */}
      {fetchError && (
        <div className="border border-red-300 bg-red-50 px-4 py-3 text-xs text-red-800">
          <strong>Error:</strong>{' '}
          {fetchError}
        </div>
      )}

      {/* Status */}
      {job && (
        <StatusCard
          status={normalizedStatus as any}
          jobId={id}
          pollCount={pollCount}
        />
      )}

      {/* Loading */}
      {loading && !job && (
        <div className="gov-card p-8 text-center text-gray-400 text-sm">
          Connecting to backend...
        </div>
      )}

      {/* Pipeline */}
      {!isTerminal && job && (
        <div className="gov-card p-5">
          <div className="gov-section-title">
            AI Processing Pipeline
          </div>

          <div className="space-y-3 mt-3">

            {pipelineSteps.map(
              (step, index) => {
                const stepNumber =
                  index + 1

                const done =
                  stepNumber <
                  currentStep

                const active =
                  stepNumber ===
                  currentStep

                return (
                  <div
                    key={step}
                    className="flex items-center gap-3 text-xs"
                  >
                    <span
                      className={`w-6 h-6 flex items-center justify-center font-bold
                    ${
                      done
                        ? 'bg-green-600 text-white'
                        : active
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                    >
                      {done
                        ? '✓'
                        : stepNumber}
                    </span>

                    <span
                      className={`${
                        done
                          ? 'text-green-700 font-semibold'
                          : active
                          ? 'text-blue-700 font-semibold'
                          : 'text-gray-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                )
              }
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {isDone && job?.result && (
        <div className="gov-card p-6">

          <div className="border-b-2 border-gov-navy pb-3 mb-6">
            <h2 className="text-base font-bold text-gov-navy uppercase">
              Final Evaluation
            </h2>
          </div>

          <ResultView
            result={job.result}
          />
        </div>
      )}

      {/* Failure */}
      {isFailed && (
        <div className="gov-card p-5 border-l-4 border-red-500">

          <div className="text-red-700 font-bold mb-2">
            Processing Failed
          </div>

          <pre className="text-xs text-red-800 whitespace-pre-wrap">
            {job?.error ||
              'Unknown error'}
          </pre>
        </div>
      )}

      {/* Actions */}
      {isDone && (
        <div className="flex gap-3 text-xs">

          <button
            onClick={() =>
              window.print()
            }
            className="border border-gov-navy px-4 py-2 hover:bg-gov-navy hover:text-white"
          >
            Print Report
          </button>

          <button
            onClick={downloadResult}
            className="border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            Download JSON
          </button>
        </div>
      )}
    </div>
  )
}