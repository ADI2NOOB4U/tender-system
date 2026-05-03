"use client";

import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("tenderResults");
    if (stored) {
      setResults(JSON.parse(stored));
    }
  }, []);

  const parsedResults = results
    .filter((r) => r?.result)
    .map((r) => ({
      company: r.result.extracted_data?.company ?? "Unknown",
      amount: r.result.extracted_data?.amount ?? null,
      score: r.result.evaluation?.score ?? 0,
      status: r.result.evaluation?.status ?? "",
      explanation: r.result.explanation ?? "",
    }))
    .sort((a, b) => b.score - a.score);

  const filteredResults = parsedResults.filter((r) => r.score >= minScore);
  const winner = parsedResults[0] ?? null;
  const maxScore = parsedResults[0]?.score ?? 100;

  const medals = ["🥇", "🥈", "🥉"];

  const scoreColor = (s: number) =>
    s >= 75 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626";

  const scoreGradient = (s: number) =>
    s >= 75
      ? "linear-gradient(90deg,#16a34a,#22c55e)"
      : s >= 50
      ? "linear-gradient(90deg,#d97706,#f59e0b)"
      : "linear-gradient(90deg,#dc2626,#ef4444)";

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
        📊 Tender Reports
      </h1>

      {parsedResults.length > 0 && (
        <>
          {/* WINNER */}
          {winner && (
            <div style={{
              background: "#1e3a8a",
              color: "white",
              padding: "20px",
              borderRadius: "10px",
              marginTop: "20px"
            }}>
              <h2>🏆 {winner.company}</h2>
              <p>Score: {winner.score}</p>
            </div>
          )}

          {/* FILTER */}
          <div style={{ marginTop: "20px" }}>
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
            />
            <span style={{ marginLeft: "10px" }}>{minScore}+</span>
          </div>

          {/* RANKING */}
          <div style={{ marginTop: "20px" }}>
            {filteredResults.map((r, idx) => {
              const barPct = (r.score / maxScore) * 100;

              return (
                <div key={idx} style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  marginBottom: "10px"
                }}>
                  <b>
                    {medals[idx] ?? `${idx + 1}.`} {r.company}
                  </b>

                  <div>Score: {r.score}</div>

                  <div style={{
                    height: "8px",
                    background: "#eee",
                    borderRadius: "5px",
                    marginTop: "5px"
                  }}>
                    <div style={{
                      width: `${barPct}%`,
                      height: "100%",
                      background: scoreGradient(r.score),
                      borderRadius: "5px"
                    }} />
                  </div>

                  {r.explanation && (
                    <p style={{ marginTop: "10px", fontSize: "13px" }}>
                      {r.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}