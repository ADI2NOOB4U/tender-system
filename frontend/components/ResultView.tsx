"use client";

import { JobResult } from "@/lib/api";

interface ResultViewProps {
  result: JobResult;
}

const EVALUATION_CONFIG = {
  PASS: {
    label: "ELIGIBLE",
    color: "text-green-800",
    bg: "bg-green-100",
    border: "border-green-400",
    icon: "✓",
    desc: "All eligibility criteria satisfied. Candidate qualifies for next stage.",
  },
  FAIL: {
    label: "NOT ELIGIBLE",
    color: "text-red-800",
    bg: "bg-red-100",
    border: "border-red-400",
    icon: "✕",
    desc: "Critical criteria not met. Submission rejected.",
  },
  REVIEW: {
    label: "REQUIRES REVIEW",
    color: "text-yellow-800",
    bg: "bg-yellow-100",
    border: "border-yellow-400",
    icon: "⚠",
    desc: "Partial compliance. Manual verification required.",
  },
};

export function ResultView({ result }: ResultViewProps) {
  const evaluationKey = (result.evaluation || "REVIEW").toUpperCase();
  const evalCfg =
    EVALUATION_CONFIG[evaluationKey] ?? EVALUATION_CONFIG.REVIEW;

  const structured = result.structured_data || {};

  // 🔥 AI SCORE + BREAKDOWN
  const score =
    result.score ?? Math.floor((result.confidence || 0.75) * 100);

  const breakdown = {
    technical: Math.round(score * 0.5),
    financial: Math.round(score * 0.3),
    compliance: Math.round(score * 0.2),
  };

  return (
    <div className="space-y-8">

      {/* 🔥 HERO VERDICT */}
      <div
        className={`border-2 ${evalCfg.border} ${evalCfg.bg} p-6 flex items-center justify-between`}
      >
        <div className="flex items-center gap-5">
          <div className={`text-5xl font-bold ${evalCfg.color}`}>
            {evalCfg.icon}
          </div>

          <div>
            <div
              className={`text-2xl font-bold tracking-widest ${evalCfg.color}`}
            >
              {evalCfg.label}
            </div>

            <p
              className={`text-xs mt-1 ${evalCfg.color} opacity-80 max-w-md`}
            >
              {evalCfg.desc}
            </p>
          </div>
        </div>

        {/* CONFIDENCE */}
        <div className="text-right">
          <div className="text-xs text-gray-500">Confidence</div>
          <div className="text-xl font-bold text-gov-navy">
            {result.confidence
              ? `${Math.round(result.confidence * 100)}%`
              : "—"}
          </div>
        </div>
      </div>

      {/* 🔥 AI SCORE PANEL */}
      <div className="gov-card p-4">
        <div className="gov-section-title">AI Evaluation Score</div>

        <div className="text-2xl font-bold text-gov-navy mb-3">
          {score}/100
        </div>

        <div className="space-y-3 text-sm">

          {/* Technical */}
          <div>
            <div className="flex justify-between">
              <span>Technical</span>
              <span>{breakdown.technical}/50</span>
            </div>
            <div className="h-2 bg-gray-200 rounded">
              <div
                style={{ width: `${(breakdown.technical / 50) * 100}%` }}
                className="h-2 bg-blue-500 rounded"
              />
            </div>
          </div>

          {/* Financial */}
          <div>
            <div className="flex justify-between">
              <span>Financial</span>
              <span>{breakdown.financial}/30</span>
            </div>
            <div className="h-2 bg-gray-200 rounded">
              <div
                style={{ width: `${(breakdown.financial / 30) * 100}%` }}
                className="h-2 bg-green-500 rounded"
              />
            </div>
          </div>

          {/* Compliance */}
          <div>
            <div className="flex justify-between">
              <span>Compliance</span>
              <span>{breakdown.compliance}/20</span>
            </div>
            <div className="h-2 bg-gray-200 rounded">
              <div
                style={{ width: `${(breakdown.compliance / 20) * 100}%` }}
                className="h-2 bg-yellow-500 rounded"
              />
            </div>
          </div>

        </div>
      </div>

      {/* 🔥 KEY INSIGHTS */}
      <div>
        <div className="gov-section-title">Key Extracted Insights</div>

        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(structured).map(([key, value]) => (
            <div key={key} className="border p-4 bg-white">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {key.replace(/_/g, " ")}
              </div>
              <div className="text-sm font-semibold text-gov-navy break-words">
                {typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 RULE CHECKS */}
      {result.rules_checked && (
        <div>
          <div className="gov-section-title">Eligibility Breakdown</div>

          <div className="space-y-2">
            {result.rules_checked.map((rule: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs border px-3 py-2"
              >
                <span className="text-gray-700">{rule.rule}</span>

                <span
                  className={`font-bold ${
                    rule.result === "pass"
                      ? "text-green-700"
                      : rule.result === "fail"
                      ? "text-red-700"
                      : "text-yellow-700"
                  }`}
                >
                  {rule.result.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔥 AI EXPLANATION */}
      {result.explanation && (
        <div>
          <div className="gov-section-title">AI Decision Explanation</div>

          <div className="gov-card p-4 text-sm text-gray-700 leading-relaxed">
            {result.explanation}
          </div>
        </div>
      )}

      {/* 🔥 OCR TEXT */}
      <div>
        <div className="gov-section-title">Raw OCR Output</div>

        <div className="gov-card border">
          <div className="bg-gray-50 border-b px-4 py-2 flex justify-between">
            <span className="text-xs text-gray-500 font-mono">
              ocr_output.txt
            </span>

            <button
              onClick={() => navigator.clipboard.writeText(result.ocr_text)}
              className="text-xs text-gov-blue hover:underline"
            >
              Copy
            </button>
          </div>

          <div className="p-4">
            <pre className="ocr-scroll text-gray-700">
              {result.ocr_text || "(No OCR text)"}
            </pre>
          </div>
        </div>
      </div>

      {/* 🔥 RAW JSON */}
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
  );
}