'use client'

import { JobResult } from '@/lib/api'

interface ResultViewProps {
  result: JobResult
}

const EVALUATION_CONFIG = {
  PASS: {
    label: 'ELIGIBLE',
    color: 'text-green-800',
    bg: 'bg-green-100',
    border: 'border-green-400',
    icon: '✓',
    desc: 'All eligibility criteria satisfied. Candidate qualifies for next stage.',
  },
  FAIL: {
    label: 'NOT ELIGIBLE',
    color: 'text-red-800',
    bg: 'bg-red-100',
    border: 'border-red-400',
    icon: '✕',
    desc: 'Critical criteria not met. Submission rejected.',
  },
  REVIEW: {
    label: 'REQUIRES REVIEW',
    color: 'text-yellow-800',
    bg: 'bg-yellow-100',
    border: 'border-yellow-400',
    icon: '⚠',
    desc: 'Partial compliance. Manual verification required.',
  },
}

export function ResultView({ result }: ResultViewProps) {
  const evaluationKey = (result.evaluation || 'REVIEW').toUpperCase()
  const evalCfg = EVALUATION_CONFIG[evaluationKey] ?? EVALUATION_CONFIG.REVIEW

  const structured = result.structured_data || {}

  return (
    <div className="space-y-8">

      {/* 🔥 HERO VERDICT (UPGRADED) */}
      <div className={`border-2 ${evalCfg.border} ${evalCfg.bg} p-6 flex items-center justify-between`}>
        <div className="flex items-center gap-5">
          <div className={`text-5xl font-bold ${evalCfg.color}`}>
            {evalCfg.icon}
          </div>
          <div>
            <div className={`text-2xl font-bold tracking-widest ${evalCfg.color}`}>
              {evalCfg.label}
            </div>
            <p className={`text-xs mt-1 ${evalCfg.color} opacity-80 max-w-md`}>
              {evalCfg.desc}
            </p>
          </div>
        </div>

        {/* 🔥 CONFIDENCE SCORE (NEW) */}
        <div className="text-right">
          <div className="text-xs text-gray-500">Confidence</div>
          <div className="text-xl font-bold text-gov-navy">
            {result.confidence ? `${Math.round(result.confidence * 100)}%` : '—'}
          </div>
        </div>
      </div>

      {/* 🔥 KEY INSIGHTS (NEW SECTION) */}
      <div>
        <div className="gov-section-title">Key Extracted Insights</div>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(structured).map(([key, value]) => (
            <div key={key} className="border p-4 bg-white">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-sm font-semibold text-gov-navy break-words">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 RULE EXPLANATION (IF AVAILABLE) */}
      {result.rules_checked && (
        <div>
          <div className="gov-section-title">Eligibility Breakdown</div>
          <div className="space-y-2">
            {result.rules_checked.map((rule: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs border px-3 py-2">
                <span className="text-gray-700">{rule.rule}</span>
                <span className={`font-bold ${
                  rule.result === 'pass'
                    ? 'text-green-700'
                    : rule.result === 'fail'
                    ? 'text-red-700'
                    : 'text-yellow-700'
                }`}>
                  {rule.result.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* AI Explanation */}
      {result.explanation && (
        <div>
          <div className="gov-section-title">AI Decision Explanation</div>
          <div className="gov-card p-4 text-sm text-gray-700 leading-relaxed">
            {result.explanation}
          </div>
        </div>
      )}
      {/* OCR TEXT */}
      <div>
        <div className="gov-section-title">Raw OCR Output</div>
        <div className="gov-card border">
          <div className="bg-gray-50 border-b px-4 py-2 flex justify-between">
            <span className="text-xs text-gray-500 font-mono">ocr_output.txt</span>
            <button
              onClick={() => navigator.clipboard.writeText(result.ocr_text)}
              className="text-xs text-gov-blue hover:underline"
            >
              Copy
            </button>
          </div>
          <div className="p-4">
            <pre className="ocr-scroll text-gray-700">
              {result.ocr_text || '(No OCR text)'}
            </pre>
          </div>
        </div>
      </div>

      {/* RAW JSON (COLLAPSIBLE 🔥) */}
      <details className="gov-card border">
        <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-gov-navy">
          View Raw Structured JSON
        </summary>
        <div className="p-4 border-t">
          <pre className="ocr-scroll text-gray-700 text-xs">
            {JSON.stringify(structured, null, 2)}
          </pre>
        </div>
      </details>

    </div>
  )
}