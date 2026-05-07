'use client'

import React, { useRef, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Breakdown {
  technical?: number
  financial?: number
  compliance?: number
}

interface ResultItem {
  company:      string
  amount?:      number | null
  score:        number
  status?:      string
  explanation?: string
  breakdown?:   Breakdown
  confidence?:  number
}

interface ResultsUIProps {
  parsedResults:   ResultItem[]
  filteredResults: ResultItem[]
  winner:          ResultItem | null
  minScore?:       number
  setMinScore?:    (value: number) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MEDALS = ['🥇', '🥈', '🥉']

function scoreGradient(score: number): string {
  if (score >= 75) return 'linear-gradient(90deg, #15803d, #22c55e)'
  if (score >= 50) return 'linear-gradient(90deg, #b45309, #f59e0b)'
  return 'linear-gradient(90deg, #b91c1c, #ef4444)'
}

function badgeClass(status?: string): string {
  switch (String(status).toUpperCase()) {
    case 'PASS': return 'badge badge-pass'
    case 'FAIL': return 'badge badge-fail'
    default:     return 'badge badge-review'
  }
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

// ── PDF Export ───────────────────────────────────────────────────────────────

async function exportPDF(
  exportRef: React.RefObject<HTMLDivElement>,
  winner: ResultItem | null,
  results: ResultItem[],
  setExporting: (v: boolean) => void
) {
  setExporting(true)

  try {
    // Dynamic import — lightweight, no bundle bloat at page load
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ])

    const el = exportRef.current
    if (!el) { setExporting(false); return }

    // Temporarily make element print-ready
    el.classList.add('pdf-capture')

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    el.classList.remove('pdf-capture')

    const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfW   = pdf.internal.pageSize.getWidth()   // 210mm
    const pdfH   = pdf.internal.pageSize.getHeight()  // 297mm
    const margin = 12

    /* ── GOI Header band ── */
    pdf.setFillColor(15, 32, 68)
    pdf.rect(0, 0, pdfW, 22, 'F')

    // Saffron accent line
    pdf.setFillColor(245, 130, 10)
    pdf.rect(0, 22, pdfW, 1.2, 'F')

    // Title text
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('GOVERNMENT OF INDIA', margin, 9)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text('AI-POWERED TENDER EVALUATION REPORT  |  OFFICIAL USE ONLY', margin, 15.5)

    // Timestamp — right-aligned
    const stamp = `Generated: ${new Date().toLocaleString('en-IN', {
      dateStyle: 'long', timeStyle: 'short',
    })}`
    pdf.setFontSize(7)
    pdf.setTextColor(200, 210, 230)
    pdf.text(stamp, pdfW - margin, 15.5, { align: 'right' })

    /* ── Winner summary (text, not image — renders crisply) ── */
    let y = 32
    if (winner) {
      pdf.setFillColor(240, 244, 255)
      pdf.roundedRect(margin, y, pdfW - margin * 2, 28, 3, 3, 'F')

      pdf.setTextColor(15, 32, 68)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.text('🏆  RECOMMENDED WINNER', margin + 5, y + 8)

      pdf.setFontSize(13)
      pdf.setTextColor(15, 32, 68)
      pdf.text(winner.company, margin + 5, y + 17)

      // Score box
      pdf.setFillColor(26, 53, 96)
      pdf.roundedRect(pdfW - margin - 30, y + 4, 30, 20, 2, 2, 'F')
      pdf.setTextColor(255, 167, 51)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text(String(winner.score), pdfW - margin - 15, y + 16, { align: 'center' })
      pdf.setFontSize(7)
      pdf.setTextColor(200, 210, 230)
      pdf.text('/ 100', pdfW - margin - 15, y + 21, { align: 'center' })

      if (winner.amount) {
        pdf.setTextColor(90, 110, 150)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.text(`Bid Amount: ${formatINR(winner.amount)}`, margin + 5, y + 24)
      }
      y += 36
    }

    /* ── Capture rendered results as image ── */
    const imgData  = canvas.toDataURL('image/png')
    const imgW     = pdfW - margin * 2
    const imgH     = (canvas.height / canvas.width) * imgW

    // If the image fits on one page
    if (y + imgH <= pdfH - margin) {
      pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH)
    } else {
      // Multi-page split
      const pageContentH  = pdfH - y - margin
      const srcH          = canvas.height
      const srcW          = canvas.width
      const firstSrcH     = Math.round((pageContentH / imgH) * srcH)

      // Page 1 slice
      const c1 = document.createElement('canvas')
      c1.width = srcW; c1.height = firstSrcH
      c1.getContext('2d')!.drawImage(canvas, 0, 0, srcW, firstSrcH, 0, 0, srcW, firstSrcH)
      pdf.addImage(c1.toDataURL('image/png'), 'PNG', margin, y, imgW, pageContentH)

      let sliceTop = firstSrcH
      while (sliceTop < srcH) {
        pdf.addPage()

        // Re-add header on continuation pages
        pdf.setFillColor(15, 32, 68)
        pdf.rect(0, 0, pdfW, 10, 'F')
        pdf.setTextColor(200, 210, 230)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7)
        pdf.text('AI TENDER EVALUATION REPORT  |  CONTINUED', margin, 7)

        const nextPageContentH = pdfH - 14 - margin
        const nextSrcH = Math.min(
          Math.round((nextPageContentH / imgH) * srcH),
          srcH - sliceTop
        )
        const c2 = document.createElement('canvas')
        c2.width = srcW; c2.height = nextSrcH
        c2.getContext('2d')!.drawImage(canvas, 0, sliceTop, srcW, nextSrcH, 0, 0, srcW, nextSrcH)
        const sliceImgH = (nextSrcH / srcH) * imgH
        pdf.addImage(c2.toDataURL('image/png'), 'PNG', margin, 12, imgW, sliceImgH)
        sliceTop += nextSrcH
      }
    }

    /* ── Footer on last page ── */
    const pageCount = pdf.getNumberOfPages()
    for (let p = 1; p <= pageCount; p++) {
      pdf.setPage(p)
      pdf.setFillColor(15, 32, 68)
      pdf.rect(0, pdfH - 8, pdfW, 8, 'F')
      pdf.setTextColor(120, 137, 168)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(6.5)
      pdf.text('Government of India  |  AI Procurement Evaluation System  |  CONFIDENTIAL — Official Use Only', pdfW / 2, pdfH - 3.5, { align: 'center' })
      pdf.text(`Page ${p} of ${pageCount}`, pdfW - margin, pdfH - 3.5, { align: 'right' })
    }

    pdf.save(`tender-evaluation-${Date.now()}.pdf`)
  } catch (err) {
    console.error('PDF export failed:', err)
    alert('PDF export failed. Please try again.')
  } finally {
    setExporting(false)
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ResultsUI({
  parsedResults,
  filteredResults,
  winner,
  minScore = 0,
  setMinScore,
}: ResultsUIProps) {
  const exportRef  = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const maxScore = parsedResults.length > 0
    ? Math.max(...parsedResults.map((r) => r.score || 0))
    : 100

  // ── Empty state ──────────────────────────────────────────────────────────
  if (filteredResults.length === 0) {
    return (
      <div className="gov-card animate-fadeInUp" style={{
        padding: '48px', textAlign: 'center', color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px', animation: 'floatIcon 3s ease-in-out infinite' }}>📭</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}>No tender evaluations found.</div>
        <div style={{ fontSize: '12px', marginTop: '6px' }}>
          Adjust the minimum score filter or upload new documents.
        </div>
      </div>
    )
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Export toolbar ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }} className="animate-fadeInUp">
        <button
          className="pdf-export-btn"
          disabled={exporting}
          onClick={() => exportPDF(exportRef, winner, filteredResults, setExporting)}
        >
          {exporting
            ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,.4)', borderTopColor: '#fff' }} /> Generating PDF…</>
            : <>📄 Download Evaluation Report</>
          }
        </button>
      </div>

      {/* ── Capturable results area ── */}
      <div ref={exportRef}>

        {/* ── AI Badge ── */}
        <div style={{ marginBottom: '14px' }} className="animate-fadeInUp">
          <span className="ai-badge">
            <span className="ai-badge-dot" />
            AI Evaluation Complete
          </span>
        </div>

        {/* ── Winner Banner ── */}
        {winner && (
          <div className="winner-card animate-fadeInScale">
            <div className="winner-card-inner">
              <div className="noise" />
              <div className="winner-tag">
                🏆 Best Bid · Top Ranked Submission
              </div>
              <div className="winner-body">
                <div>
                  <div className="winner-company-label">Recommended Winner</div>
                  <div className="winner-company">{winner.company}</div>
                  {winner.amount && (
                    <div style={{
                      marginTop: '8px', fontSize: '13px',
                      color: 'rgba(255,255,255,0.55)',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      Bid Amount: {formatINR(winner.amount)}
                    </div>
                  )}
                  {winner.status && (
                    <div style={{ marginTop: '12px' }}>
                      <span className={badgeClass(winner.status)}>{winner.status}</span>
                    </div>
                  )}
                  {winner.explanation && (
                    <div style={{
                      marginTop: '14px', fontSize: '12px',
                      color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
                      maxWidth: '440px',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '3px solid var(--saffron)',
                    }}>
                      {winner.explanation}
                    </div>
                  )}
                </div>
                <div className="winner-score-box">
                  <div className="winner-score-num">{winner.score}</div>
                  <div className="winner-score-label">Score / 100</div>
                  {winner.confidence !== undefined && winner.confidence > 0 && (
                    <div style={{
                      fontSize: '10px', color: 'rgba(255,255,255,0.4)',
                      marginTop: '8px',
                    }}>
                      Confidence: <strong style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {winner.confidence}%
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Score Filter ── */}
        {setMinScore && (
          <div className="filter-bar animate-fadeInUp delay-100">
            <span className="filter-label">🎛 Min Score:</span>
            <input
              type="range" min={0} max={100} value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
            />
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '13px', fontWeight: 700,
              color: 'var(--navy)', minWidth: '28px',
            }}>
              {minScore}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Showing {filteredResults.length} of {parsedResults.length} bids
            </span>
          </div>
        )}

        {/* ── Rankings header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="gov-label animate-fadeInUp delay-100">
            Bidder Rankings — {filteredResults.length} Result{filteredResults.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* ── Rank cards ── */}
        <div className="ranking-list">
          {filteredResults.map((result, idx) => {
            const safeScore = Number(result.score) || 0
            const barPct    = maxScore > 0 ? (safeScore / maxScore) * 100 : 0

            const breakdown = {
              technical:  result.breakdown?.technical  ?? 0,
              financial:  result.breakdown?.financial  ?? 0,
              compliance: result.breakdown?.compliance ?? 0,
            }

            return (
              <div
                key={`${result.company}-${idx}`}
                className="rank-card animate-fadeInUp"
                style={{ animationDelay: `${idx * 0.07}s` }}
              >
                {/* Header row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: '12px',
                }}>
                  <div>
                    <div className="rank-company">
                      {MEDALS[idx] ?? `#${idx + 1}`}&nbsp;&nbsp;{result.company}
                    </div>
                    {result.amount && (
                      <div className="rank-amount">
                        Bid: {formatINR(Number(result.amount))}
                      </div>
                    )}
                  </div>
                  {result.status && (
                    <span className={badgeClass(result.status)}>{result.status}</span>
                  )}
                </div>

                {/* Score bar */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: '7px',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Composite Score
                    </span>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '14px', fontWeight: 700, color: 'var(--navy)',
                    }}>
                      {safeScore}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${barPct}%`, background: scoreGradient(safeScore) }}
                    />
                  </div>
                </div>

                {/* Sub-score breakdown */}
                <div className="breakdown-box">
                  <div className="breakdown-title">🧠 AI Score Breakdown</div>
                  <div className="breakdown-grid">
                    {([
                      { label: 'Technical',   val: breakdown.technical,   max: 50, color: '#2563eb' },
                      { label: 'Financial',   val: breakdown.financial,   max: 30, color: '#16a34a' },
                      { label: 'Compliance',  val: breakdown.compliance,  max: 20, color: '#d97706' },
                    ] as const).map(({ label, val, max, color }) => (
                      <div key={label} className="breakdown-item">
                        <div className="breakdown-val" style={{ color }}>
                          {val}
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>
                            /{max}
                          </span>
                        </div>
                        <div className="breakdown-key">{label}</div>
                        {/* Mini bar */}
                        <div style={{
                          height: '3px', background: '#e8ecf5',
                          borderRadius: '999px', marginTop: '6px', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: '999px',
                            background: color,
                            width: `${(val / max) * 100}%`,
                            transition: 'width 0.9s cubic-bezier(.34,1.56,.64,1)',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.confidence !== undefined && result.confidence > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      Model confidence:&nbsp;
                      <strong style={{ color: 'var(--navy)' }}>{result.confidence}%</strong>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {result.explanation && (
                  <div style={{
                    marginTop: '14px', fontSize: '12px', lineHeight: '1.7',
                    color: 'var(--text-mid)', padding: '10px 14px',
                    background: '#fafbff', borderRadius: '6px',
                    borderLeft: '3px solid var(--navy-light)',
                  }}>
                    {result.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Report footer stamp ── */}
        <div style={{
          marginTop: '28px', paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            🇮🇳 Government of India — AI Procurement Evaluation System
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>
            {new Date().toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </>
  )
}
