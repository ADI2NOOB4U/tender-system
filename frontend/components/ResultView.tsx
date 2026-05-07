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

export function ResultView({
  result,
}: ResultViewProps) {

  type EvaluationKey =
    keyof typeof EVALUATION_CONFIG;

  // =====================================================
  // SAFE EVALUATION
  // =====================================================

  const evaluation =
    result?.evaluation || {};

  const evaluationKey = String(
    evaluation?.status || "REVIEW"
  ).toUpperCase() as EvaluationKey;

  const evalCfg =
    EVALUATION_CONFIG[evaluationKey] ??
    EVALUATION_CONFIG.REVIEW;

  // =====================================================
  // SAFE DATA
  // =====================================================

  const structured =
    result?.structured || {};

  const score =
    evaluation?.score ??
    0;

  const confidence =
    evaluation?.confidence ??
    0;

  const breakdown =
    evaluation?.breakdown || {
      technical: Math.round(score * 0.5),
      financial: Math.round(score * 0.3),
      compliance: Math.round(score * 0.2),
    };

  const explanation =
    evaluation?.explanation ||
    "AI evaluation completed";

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-8">

      {/* ================================================= */}
      {/* HERO VERDICT */}
      {/* ================================================= */}

      <div
        className={`border-2 ${evalCfg.border} ${evalCfg.bg} p-6 flex items-center justify-between rounded-xl`}
      >

        <div className="flex items-center gap-5">

          <div
            className={`text-5xl font-bold ${evalCfg.color}`}
          >
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

          <div className="text-xs text-gray-500">
            Confidence
          </div>

          <div className="text-xl font-bold text-gov-navy">
            {confidence}%
          </div>

        </div>
      </div>

      {/* ================================================= */}
      {/* SCORE PANEL */}
      {/* ================================================= */}

      <div className="gov-card p-4 rounded-xl border">

        <div className="gov-section-title">
          AI Evaluation Score
        </div>

        <div className="text-3xl font-bold text-gov-navy mb-4">
          {score}/100
        </div>

        <div className="space-y-4 text-sm">

          {/* TECHNICAL */}

          <div>

            <div className="flex justify-between mb-1">
              <span>Technical</span>
              <span>{breakdown.technical}</span>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-2"
                style={{
                  width: `${breakdown.technical}%`,
                }}
              />
            </div>

          </div>

          {/* FINANCIAL */}

          <div>

            <div className="flex justify-between mb-1">
              <span>Financial</span>
              <span>{breakdown.financial}</span>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-600 h-2"
                style={{
                  width: `${breakdown.financial}%`,
                }}
              />
            </div>

          </div>

          {/* COMPLIANCE */}

          <div>

            <div className="flex justify-between mb-1">
              <span>Compliance</span>
              <span>{breakdown.compliance}</span>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-yellow-500 h-2"
                style={{
                  width: `${breakdown.compliance}%`,
                }}
              />
            </div>

          </div>

        </div>
      </div>

      {/* ================================================= */}
      {/* EXPLANATION */}
      {/* ================================================= */}

      <div className="gov-card p-4 rounded-xl border">

        <div className="gov-section-title mb-3">
          AI Explanation
        </div>

        <p className="text-sm text-gray-700 leading-7">
          {explanation}
        </p>

      </div>

      {/* ================================================= */}
      {/* STRUCTURED DATA */}
      {/* ================================================= */}

      <div className="gov-card p-4 rounded-xl border">

        <div className="gov-section-title mb-3">
          Extracted Information
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

          {Object.entries(structured).map(
            ([key, value]) => (

              <div
                key={key}
                className="border rounded-lg p-3 bg-gray-50"
              >

                <div className="font-semibold text-gray-500 uppercase text-xs mb-1">
                  {key.replace(/_/g, " ")}
                </div>

                <div className="text-gray-800 break-words">
                  {String(value || "—")}
                </div>

              </div>
            )
          )}

        </div>

      </div>
    </div>
  );
}