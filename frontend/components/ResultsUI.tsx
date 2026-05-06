'use client'

import React from 'react'

// ========================================================
// TYPES
// ========================================================

interface Breakdown {
  technical?: number
  financial?: number
  compliance?: number
}

interface ResultItem {
  company: string
  amount?: number | null

  score: number

  status?: string

  explanation?: string

  breakdown?: Breakdown

  confidence?: number
}

interface ResultsUIProps {
  parsedResults: ResultItem[]

  filteredResults: ResultItem[]

  winner: ResultItem | null

  minScore?: number

  setMinScore?: (value: number) => void
}

// ========================================================
// COMPONENT
// ========================================================

export default function ResultsUI({
  parsedResults,
  filteredResults,
  winner,
  minScore = 0,
  setMinScore,
}: ResultsUIProps) {

  // ======================================================
  // SAFE MAX SCORE
  // ======================================================

  const maxScore =
    parsedResults.length > 0
      ? Math.max(
          ...parsedResults.map(
            (r) => r.score || 0
          )
        )
      : 100

  const medals = ['🥇', '🥈', '🥉']

  // ======================================================
  // SCORE COLORS
  // ======================================================

  const scoreGradient = (
    score: number
  ) => {
    if (score >= 75) {
      return 'linear-gradient(90deg,#16a34a,#22c55e)'
    }

    if (score >= 50) {
      return 'linear-gradient(90deg,#d97706,#f59e0b)'
    }

    return 'linear-gradient(90deg,#dc2626,#ef4444)'
  }

  // ======================================================
  // STATUS COLORS
  // ======================================================

  const statusStyles = (
    status?: string
  ) => {
    switch (
      String(status).toUpperCase()
    ) {
      case 'PASS':
        return {
          background: '#dcfce7',
          color: '#166534',
          border: '1px solid #86efac',
        }

      case 'FAIL':
        return {
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fca5a5',
        }

      default:
        return {
          background: '#fef3c7',
          color: '#92400e',
          border: '1px solid #fde68a',
        }
    }
  }

  // ======================================================
  // EMPTY STATE
  // ======================================================

  if (filteredResults.length === 0) {
    return (
      <div
        className="gov-card"
        style={{
          padding: '30px',
          textAlign: 'center',
          color: '#6b7280',
        }}
      >
        No tender evaluations found.
      </div>
    )
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <>

      {/* ================================================== */}
      {/* WINNER */}
      {/* ================================================== */}

      {winner && (
        <div className="winner-card">

          <div className="winner-tag">
            🏆 Best Bid · Top Ranked
          </div>

          <div className="winner-body">

            <div>

              <div className="winner-company-label">
                Winning Company
              </div>

              <div className="winner-company">
                {winner.company}
              </div>

              {winner.status && (
                <div
                  style={{
                    marginTop: '10px',
                    display: 'inline-block',
                    padding:
                      '4px 10px',
                    borderRadius:
                      '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    ...statusStyles(
                      winner.status
                    ),
                  }}
                >
                  {winner.status}
                </div>
              )}

            </div>

            <div className="winner-score-box">

              <div className="winner-score-num">
                {winner.score}
              </div>

              <div className="winner-score-label">
                Score out of 100
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* FILTER */}
      {/* ================================================== */}

      {setMinScore && (
        <div className="filter-bar">

          <span className="filter-label">
            🎛 Min Score:
          </span>

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
          />

          <span
            style={{
              fontSize: '13px',
              color: '#6b7280',
            }}
          >
            {minScore}
          </span>

        </div>
      )}

      {/* ================================================== */}
      {/* RANKINGS */}
      {/* ================================================== */}

      <div className="ranking-list">

        {filteredResults.map(
          (result, idx) => {

            const safeScore =
              Number(
                result.score
              ) || 0

            const barPct =
              maxScore > 0
                ? (
                    safeScore /
                    maxScore
                  ) *
                  100
                : 0

            // ============================================
            // REAL AI BREAKDOWN
            // ============================================

            const breakdown = {
              technical:
                result.breakdown
                  ?.technical ?? 0,

              financial:
                result.breakdown
                  ?.financial ?? 0,

              compliance:
                result.breakdown
                  ?.compliance ?? 0,
            }

            return (
              <div
                key={`${result.company}-${idx}`}
                className="rank-card"
              >

                {/* HEADER */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    gap: '12px',
                  }}
                >

                  <div>

                    <b>
                      {medals[idx] ??
                        idx + 1}
                      .{' '}
                      {
                        result.company
                      }
                    </b>

                    {result.amount && (
                      <div
                        style={{
                          marginTop:
                            '4px',
                          fontSize:
                            '12px',
                          color:
                            '#6b7280',
                        }}
                      >
                        Amount:{' '}
                        ₹
                        {result.amount}
                      </div>
                    )}

                  </div>

                  {result.status && (
                    <div
                      style={{
                        padding:
                          '4px 10px',
                        borderRadius:
                          '999px',
                        fontSize:
                          '12px',
                        fontWeight:
                          700,
                        ...statusStyles(
                          result.status
                        ),
                      }}
                    >
                      {
                        result.status
                      }
                    </div>
                  )}

                </div>

                {/* SCORE */}
                <div
                  style={{
                    marginTop: '12px',
                  }}
                >
                  <div
                    style={{
                      marginBottom:
                        '6px',
                      fontWeight: 600,
                    }}
                  >
                    Score:{' '}
                    {safeScore}
                  </div>

                  <div
                    style={{
                      height: '8px',
                      background:
                        '#e5e7eb',
                      borderRadius:
                        '999px',
                      overflow:
                        'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${barPct}%`,
                        height: '100%',
                        background:
                          scoreGradient(
                            safeScore
                          ),
                        borderRadius:
                          '999px',
                        transition:
                          'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* BREAKDOWN */}
                <div
                  style={{
                    marginTop: '14px',
                    padding: '12px',
                    background:
                      '#f8fafc',
                    borderRadius:
                      '10px',
                    fontSize:
                      '13px',
                    border:
                      '1px solid #e2e8f0',
                  }}
                >

                  <b>
                    🧠 AI Score
                    Breakdown
                  </b>

                  <div
                    style={{
                      marginTop:
                        '8px',
                      display: 'grid',
                      gap: '4px',
                    }}
                  >
                    <div>
                      Technical:{' '}
                      {
                        breakdown.technical
                      }
                      /50
                    </div>

                    <div>
                      Financial:{' '}
                      {
                        breakdown.financial
                      }
                      /30
                    </div>

                    <div>
                      Compliance:{' '}
                      {
                        breakdown.compliance
                      }
                      /20
                    </div>

                    {result.confidence !==
                      undefined && (
                      <div>
                        Confidence:{' '}
                        {
                          result.confidence
                        }
                        %
                      </div>
                    )}

                  </div>
                </div>

                {/* EXPLANATION */}
                {result.explanation && (
                  <div
                    style={{
                      marginTop:
                        '14px',
                      fontSize:
                        '13px',
                      lineHeight:
                        '1.6',
                      color:
                        '#374151',
                    }}
                  >
                    {
                      result.explanation
                    }
                  </div>
                )}

              </div>
            )
          }
        )}

      </div>
    </>
  )
}