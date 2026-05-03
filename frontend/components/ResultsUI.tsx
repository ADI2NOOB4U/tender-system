"use client";

export default function ResultsUI({
  parsedResults,
  filteredResults,
  winner,
  minScore,
  setMinScore,
}: any) {

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
    <>
      {/* WINNER */}
      {winner && (
        <div className="winner-card">
          <div className="winner-tag">🏆 Best Bid · Top Ranked</div>
          <div className="winner-body">
            <div>
              <div className="winner-company-label">Winning Company</div>
              <div className="winner-company">{winner.company}</div>
            </div>
            <div className="winner-score-box">
              <div className="winner-score-num">{winner.score}</div>
              <div className="winner-score-label">Score out of 100</div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER */}
      <div className="filter-bar">
        <span className="filter-label">🎛 Min Score:</span>
        <input
          type="range"
          min={0}
          max={100}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
        />
      </div>

      {/* RANKING */}
      <div className="ranking-list">
        {filteredResults.map((r: any, idx: number) => {
          const barPct = (r.score / maxScore) * 100;

          return (
            <div key={idx} className="rank-card">
              <b>{medals[idx] ?? idx + 1}. {r.company}</b>

              <div>Score: {r.score}</div>

              <div style={{ height: "8px", background: "#eee", borderRadius: "5px" }}>
                <div
                  style={{
                    width: `${barPct}%`,
                    height: "100%",
                    background: scoreGradient(r.score),
                  }}
                />
              </div>

              {r.explanation && <p>{r.explanation}</p>}
            </div>
          );
        })}
      </div>
    </>
  );
}