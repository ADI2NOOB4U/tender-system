'use client'

import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import ResultsUI from '@/components/ResultsUI'

// ========================================================
// TYPES
// ========================================================

interface ParsedResult {
  company: string
  amount: number | null
  score: number
  status: string
  explanation: string
}

interface StoredJob {
  status?: string

  result?: {
    structured?: {
      company?: string
      amount?: number
    }

    evaluation?: {
      score?: number
      status?: string
      explanation?: string
    }
  }
}

interface BatchData {
  batch_id?: string
  created_at?: string
  data?: StoredJob[]
}

// ========================================================
// PAGE
// ========================================================

export default function ReportsPage() {
  const [batches, setBatches] =
    useState<BatchData[]>([])

  const [selectedBatch, setSelectedBatch] =
    useState<number | null>(null)

  const [minScore, setMinScore] =
    useState<number>(0)

  const [loading, setLoading] =
    useState(true)

  const [exporting, setExporting] =
    useState(false)

  // ======================================================
  // LOAD HISTORY
  // ======================================================

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          'tenderHistory'
        )

      if (!stored) {
        setLoading(false)
        return
      }

      const parsed =
        JSON.parse(stored)

      if (Array.isArray(parsed)) {
        setBatches(parsed)
      } else {
        console.warn(
          'Invalid tender history format'
        )
      }

    } catch (error) {
      console.error(
        'Failed to load tender history',
        error
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // ======================================================
  // SELECT DATA
  // ======================================================

  const selectedData = useMemo(() => {
    if (
      selectedBatch !== null &&
      batches[selectedBatch]
    ) {
      return (
        batches[selectedBatch].data ??
        []
      )
    }

    return batches.flatMap(
      (batch) => batch.data ?? []
    )
  }, [batches, selectedBatch])

  // ======================================================
  // PARSE RESULTS
  // ======================================================

  const parsedResults: ParsedResult[] =
    useMemo(() => {
      return selectedData

        .filter(
          (item) =>
            item?.result &&
            item?.status !== 'failed' &&
            item?.status !== 'error'
        )

        .map((item) => ({
          company:
            item.result?.structured
              ?.company ??
            'Unknown Company',

          amount:
            item.result?.structured
              ?.amount ?? null,

          score:
            Number(
              item.result?.evaluation
                ?.score ?? 0
            ),

          status:
            item.result?.evaluation
              ?.status ??
            'REVIEW',

          explanation:
            item.result?.evaluation
              ?.explanation ??
            'No explanation available',
        }))

        .filter(
          (item) =>
            !Number.isNaN(item.score)
        )

        .sort(
          (a, b) =>
            b.score - a.score
        )

    }, [selectedData])

  // ======================================================
  // FILTERED
  // ======================================================

  const filteredResults =
    useMemo(() => {
      return parsedResults.filter(
        (result) =>
          result.score >= minScore
      )
    }, [parsedResults, minScore])

  // ======================================================
  // WINNER
  // ======================================================

  const winner =
    filteredResults.length > 0
      ? filteredResults[0]
      : null

  // ======================================================
  // EXPORT PDF
  // ======================================================

  const exportPDF = async () => {
    try {
      setExporting(true)

      const element =
        document.getElementById(
          'report-section'
        )

      if (!element) {
        alert(
          'No report available.'
        )

        return
      }

      const canvas =
        await html2canvas(element, {
          scale: 1.5,
          useCORS: true,
          logging: false,
        })

      const imgData =
        canvas.toDataURL('image/png')

      const pdf = new jsPDF(
        'p',
        'mm',
        'a4'
      )

      const pageWidth =
        pdf.internal.pageSize.getWidth()

      const pageHeight =
        pdf.internal.pageSize.getHeight()

      const margin = 10

      const imgWidth =
        pageWidth - margin * 2

      const imgHeight =
        (canvas.height * imgWidth) /
        canvas.width

      let heightLeft =
        imgHeight

      let position = margin

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        position,
        imgWidth,
        imgHeight
      )

      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position =
          heightLeft - imgHeight

        pdf.addPage()

        pdf.addImage(
          imgData,
          'PNG',
          margin,
          position,
          imgWidth,
          imgHeight
        )

        heightLeft -= pageHeight
      }

      pdf.save(
        `TenderLens-Report-${Date.now()}.pdf`
      )

    } catch (error) {
      console.error(
        'PDF export failed',
        error
      )

      alert(
        'Failed to export PDF.'
      )

    } finally {
      setExporting(false)
    }
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-4">

        <div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Tender Evaluation Reports
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            AI-generated tender analysis
            and ranking reports
          </p>
        </div>

        <button
          onClick={exportPDF}

          disabled={
            exporting ||
            filteredResults.length === 0
          }

          className="
            px-4 py-2
            bg-gov-blue
            text-white
            rounded-md
            text-sm
            font-medium
            hover:opacity-90
            disabled:opacity-50
          "
        >
          {exporting
            ? 'Exporting...'
            : '📄 Export PDF'}
        </button>
      </div>

      {/* FILTERS */}
      <div className="gov-card p-5 flex flex-col md:flex-row gap-6">

        {/* Batch */}
        <div className="space-y-2">

          <label className="gov-label">
            Select Batch
          </label>

          <select
            value={
              selectedBatch ?? ''
            }

            onChange={(e) => {
              const value =
                e.target.value

              setSelectedBatch(
                value === ''
                  ? null
                  : Number(value)
              )
            }}

            className="
              border border-gray-300
              px-3 py-2
              rounded-md
              text-sm
            "
          >
            <option value="">
              All Batches
            </option>

            {batches.map(
              (batch, index) => (
                <option
                  key={
                    batch.batch_id ??
                    index
                  }

                  value={index}
                >
                  Batch {index + 1}
                </option>
              )
            )}
          </select>
        </div>

        {/* Score */}
        <div className="space-y-2">

          <label className="gov-label">
            Minimum Score
          </label>

          <input
            type="range"

            min={0}

            max={100}

            value={minScore}

            onChange={(e) =>
              setMinScore(
                Number(
                  e.target.value
                )
              )
            }

            className="w-64"
          />

          <div className="text-sm text-gray-500">
            Showing tenders with
            score ≥{' '}
            <strong>
              {minScore}
            </strong>
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="gov-card p-8 text-center text-gray-400 text-sm">
          Loading report history...
        </div>
      )}

      {/* RESULTS */}
      {!loading &&
        filteredResults.length >
          0 && (
          <div id="report-section">
            <ResultsUI
              parsedResults={
                parsedResults
              }

              filteredResults={
                filteredResults
              }

              winner={winner}
            />
          </div>
        )}

      {/* EMPTY */}
      {!loading &&
        filteredResults.length ===
          0 && (
          <div className="gov-card p-8 text-center text-gray-500 italic">
            No tender reports
            available.
          </div>
        )}
    </div>
  )
}