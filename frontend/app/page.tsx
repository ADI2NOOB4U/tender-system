"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [clock, setClock] = useState("");

  const API_URL = "https://tender-system-md8s.onrender.com";

  // ─── LIVE CLOCK ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ─── ALL ORIGINAL API LOGIC UNCHANGED ───────────────────────────────────────
  const handleUpload = async () => {
    if (!files || files.length === 0) {
      alert("Please select at least one file");
      return;
    }
    setLoading(true);
    setAllResults([]);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    try {
      const res = await fetch(`${API_URL}/upload-batch`, {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const data = JSON.parse(text);
      const jobIds: string[] = data.jobs ?? [];
      if (jobIds.length === 0) throw new Error("No job IDs returned");

      const settled: any[] = [];
      for (const jobId of jobIds) {
        let jobData;
        for (let i = 0; i < 5; i++) {
          const jobRes = await fetch(`${API_URL}/job/${jobId}`);
          jobData = await jobRes.json();
          if (jobData.status === "done") break;
          await new Promise((r) => setTimeout(r, 1000));
        }
        if (jobData) settled.push(jobData);
      }
      setAllResults(settled);
      localStorage.setItem("tenderResults", JSON.stringify(settled));
      window.location.href = "/reports";
    } catch (err) {
      console.error("ERROR:", err);
      alert("Upload failed — check console");
    }
    setLoading(false);
  };

  // ─── DERIVED STATE ───────────────────────────────────────────────────────────
  const parsedResults = allResults
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

  const fileCount = files ? files.length : 0;
  const fileNames = files
    ? Array.from(files).map((f) => f.name).join(", ")
    : "";

  const scoreColor = (s: number) =>
    s >= 75 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626";
  const scoreGradient = (s: number) =>
    s >= 75
      ? "linear-gradient(90deg,#16a34a,#22c55e)"
      : s >= 50
      ? "linear-gradient(90deg,#d97706,#f59e0b)"
      : "linear-gradient(90deg,#dc2626,#ef4444)";

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #f0f2f7;
          min-height: 100vh;
          color: #1a1f36;
        }

        /* ── NAVBAR ── */
        .navbar {
          background: #0f1c3f;
          padding: 0 32px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 12px rgba(0,0,0,0.25);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .navbar-brand { display: flex; align-items: center; gap: 12px; }
        .navbar-emblem {
          width: 34px; height: 34px;
          background: linear-gradient(135deg,#f59e0b,#fbbf24);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: #0f1c3f;
          letter-spacing: -1px; flex-shrink: 0;
        }
        .navbar-title { font-size: 15px; font-weight: 600; color: #fff; letter-spacing: 0.2px; }
        .navbar-subtitle { font-size: 11px; color: #94a3b8; margin-top: 1px; font-weight: 400; }
        .navbar-right { display: flex; align-items: center; gap: 14px; }
        .navbar-clock {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fbbf24;
          font-size: 14px;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 1.5px;
          min-width: 96px;
          text-align: center;
        }
        .navbar-badge {
          background: rgba(245,158,11,0.15);
          border: 1px solid rgba(245,158,11,0.3);
          color: #fbbf24;
          font-size: 11px; font-weight: 500;
          padding: 3px 10px; border-radius: 20px;
          font-family: 'DM Mono', monospace; letter-spacing: 0.5px;
        }

        /* ── PAGE ── */
        .page { max-width: 960px; margin: 0 auto; padding: 36px 24px 60px; }

        /* ── SECTION HEADER ── */
        .section-header { margin-bottom: 28px; }
        .section-title { font-size: 22px; font-weight: 700; color: #0f1c3f; letter-spacing: -0.3px; }
        .section-desc { font-size: 14px; color: #64748b; margin-top: 4px; font-weight: 400; }

        /* ── UPLOAD CARD ── */
        .upload-card {
          background: #fff;
          border-radius: 16px; padding: 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06),0 4px 20px rgba(0,0,0,0.05);
          border: 1px solid #e8eaf2;
        }
        .upload-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .card-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: #eef2ff;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .card-label { font-size: 15px; font-weight: 600; color: #0f1c3f; }
        .card-sublabel { font-size: 12px; color: #94a3b8; margin-top: 1px; }

        /* ── DROP ZONE ── */
        .dropzone {
          border: 2px dashed #c7d2fe; border-radius: 12px;
          padding: 36px 20px; text-align: center; cursor: pointer;
          transition: all 0.2s ease; background: #fafbff; position: relative;
        }
        .dropzone.over { border-color: #6366f1; background: #eef2ff; }
        .dropzone input[type="file"] {
          position: absolute; inset: 0; opacity: 0; cursor: pointer;
          width: 100%; height: 100%;
        }
        .dropzone-icon { font-size: 36px; margin-bottom: 10px; display: block; }
        .dropzone-text { font-size: 14px; color: #475569; font-weight: 500; }
        .dropzone-hint { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .file-selected {
          margin-top: 14px; background: #f0fdf4;
          border: 1px solid #bbf7d0; border-radius: 8px;
          padding: 10px 14px; font-size: 13px; color: #15803d;
          font-family: 'DM Mono', monospace;
          display: flex; align-items: center; gap: 8px;
        }

        /* ── SUBMIT BTN ── */
        .submit-btn {
          margin-top: 20px; width: 100%;
          padding: 14px 28px;
          background: linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);
          color: #fff; border: none; border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 4px 14px rgba(37,99,235,0.3); letter-spacing: 0.1px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.4);
        }
        .submit-btn:disabled { opacity: 0.75; cursor: not-allowed; transform: none; }
        .spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.8s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── PROCESSING BANNER ── */
        .processing-banner {
          margin-top: 20px; background: #fffbeb;
          border: 1px solid #fde68a; border-radius: 10px;
          padding: 14px 18px; display: flex; align-items: center; gap: 12px;
          font-size: 13px; color: #92400e;
        }

        /* ── DIVIDER ── */
        .divider {
          height: 1px;
          background: linear-gradient(to right,transparent,#e2e8f0,transparent);
          margin: 32px 0;
        }

        /* ── WINNER CARD ── */
        .winner-card {
          background: linear-gradient(135deg,#0f2850 0%,#1e3a8a 60%,#1d4ed8 100%);
          border-radius: 18px; padding: 28px 28px 24px;
          box-shadow: 0 8px 32px rgba(30,58,138,0.35);
          margin-bottom: 20px;
          position: relative; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .winner-card::before {
          content: '';
          position: absolute; top: -40px; right: -40px;
          width: 200px; height: 200px;
          background: radial-gradient(circle,rgba(251,191,36,0.15) 0%,transparent 70%);
          pointer-events: none;
        }
        .winner-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(251,191,36,0.18);
          border: 1px solid rgba(251,191,36,0.4);
          color: #fbbf24; font-size: 11px; font-weight: 700;
          padding: 4px 12px; border-radius: 20px;
          text-transform: uppercase; letter-spacing: 1px;
          margin-bottom: 16px;
        }
        .winner-body {
          display: flex; align-items: flex-end;
          justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }
        .winner-company {
          font-size: 26px; font-weight: 700; color: #fff;
          letter-spacing: -0.5px; line-height: 1.15;
        }
        .winner-company-label {
          font-size: 12px; color: rgba(255,255,255,0.5);
          text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;
        }
        .winner-score-box {
          display: flex; flex-direction: column; align-items: flex-end;
        }
        .winner-score-num {
          font-size: 56px; font-weight: 800;
          color: #fbbf24; line-height: 1; letter-spacing: -3px;
        }
        .winner-score-label {
          font-size: 12px; color: rgba(255,255,255,0.5);
          text-align: right; margin-top: 2px;
        }
        .winner-amount-row {
          margin-top: 18px; padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
        }
        .winner-pill {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px; padding: 6px 14px;
          font-size: 13px; color: rgba(255,255,255,0.8);
          font-family: 'DM Mono', monospace;
        }
        .winner-pill span { color: #fff; font-weight: 600; }

        /* ── FILTER BAR ── */
        .filter-bar {
          display: flex; align-items: center; gap: 14px;
          flex-wrap: wrap; margin-bottom: 18px;
        }
        .filter-label { font-size: 13px; font-weight: 600; color: #475569; white-space: nowrap; }
        .filter-range { flex: 1; min-width: 160px; max-width: 280px; cursor: pointer; accent-color: #2563eb; }
        .filter-value {
          background: #eef2ff; border: 1px solid #c7d2fe;
          color: #4338ca; font-size: 13px; font-weight: 700;
          padding: 4px 12px; border-radius: 8px;
          font-family: 'DM Mono', monospace; min-width: 52px; text-align: center;
        }
        .filter-count {
          font-size: 12px; color: #94a3b8; margin-left: auto;
        }

        /* ── RESULT HEADER ── */
        .result-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
        }
        .result-title {
          font-size: 18px; font-weight: 700; color: #0f1c3f;
          display: flex; align-items: center; gap: 8px;
        }
        .result-timestamp { font-size: 12px; color: #94a3b8; font-family: 'DM Mono', monospace; }

        /* ── RANKING TABLE ── */
        .ranking-list { display: flex; flex-direction: column; gap: 12px; }

        .rank-card {
          background: #fff;
          border-radius: 14px; padding: 18px 22px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);
          border: 1px solid #e8eaf2;
          transition: box-shadow 0.2s, transform 0.2s;
          position: relative; overflow: hidden;
        }
        .rank-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }
        .rank-card.rank-first {
          border-color: #fbbf24;
          box-shadow: 0 2px 6px rgba(251,191,36,0.15),0 6px 24px rgba(251,191,36,0.12);
        }
        .rank-card.rank-first::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b);
        }

        .rank-top {
          display: flex; align-items: center; gap: 14px; margin-bottom: 14px;
        }
        .rank-medal { font-size: 24px; flex-shrink: 0; width: 32px; text-align: center; }
        .rank-num {
          font-size: 13px; font-weight: 700; color: #94a3b8;
          font-family: 'DM Mono', monospace; width: 20px;
        }
        .rank-company { font-size: 16px; font-weight: 700; color: #0f1c3f; flex: 1; }
        .rank-amount {
          font-size: 13px; color: #64748b;
          font-family: 'DM Mono', monospace;
        }
        .rank-score-badge {
          font-size: 18px; font-weight: 800; letter-spacing: -0.5px;
          font-family: 'DM Mono', monospace; flex-shrink: 0;
        }
        .rank-status-pill {
          padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 700;
          display: inline-flex; align-items: center; gap: 5px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .rank-status-dot { width: 6px; height: 6px; border-radius: 50%; }

        /* ── COMPARISON BAR ── */
        .bar-track {
          height: 10px; background: #f1f5f9;
          border-radius: 99px; overflow: hidden; flex: 1;
        }
        .bar-fill {
          height: 100%; border-radius: 99px;
          transition: width 0.9s cubic-bezier(0.4,0,0.2,1);
          position: relative;
        }
        .bar-fill::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg,transparent 40%,rgba(255,255,255,0.3));
          border-radius: 99px;
        }
        .bar-row { display: flex; align-items: center; gap: 12px; }
        .bar-label { font-size: 11px; color: #94a3b8; font-family: 'DM Mono', monospace; width: 28px; text-align: right; }

        /* ── EXPLANATION ── */
        .explanation-card {
          background: #fff; border-radius: 14px; padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);
          border: 1px solid #e8eaf2; margin-top: 10px;
        }
        .explanation-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .ai-badge {
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          color: #fff; font-size: 10px; font-weight: 700;
          padding: 3px 8px; border-radius: 6px;
          letter-spacing: 0.5px; text-transform: uppercase;
        }
        .explanation-title { font-size: 13px; font-weight: 600; color: #0f1c3f; }
        .explanation-text {
          font-size: 13px; color: #475569; line-height: 1.7;
          background: #f8fafc; border-left: 3px solid #6366f1;
          border-radius: 0 8px 8px 0; padding: 12px 14px;
        }

        /* ── EMPTY STATE ── */
        .empty-state {
          text-align: center; padding: 40px 20px;
          color: #94a3b8; font-size: 14px;
        }
        .empty-icon { font-size: 40px; margin-bottom: 12px; }

        /* ── DEBUG ── */
        .debug-card {
          margin-top: 20px; background: #1e293b;
          border-radius: 12px; padding: 20px; overflow: auto;
        }
        .debug-title {
          font-size: 11px; font-weight: 600; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.8px;
          margin-bottom: 10px; font-family: 'DM Mono', monospace;
        }
        .debug-pre {
          font-family: 'DM Mono', monospace; font-size: 12px;
          color: #94a3b8; white-space: pre-wrap;
          word-break: break-all; line-height: 1.6;
        }

        /* ── FOOTER ── */
        .footer { text-align: center; margin-top: 48px; font-size: 12px; color: #cbd5e1; }

        @media (max-width: 600px) {
          .page { padding: 20px 16px 48px; }
          .navbar { padding: 0 16px; }
          .winner-company { font-size: 20px; }
          .winner-score-num { font-size: 42px; }
          .navbar-clock { font-size: 12px; min-width: 80px; }
          .rank-amount { display: none; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-emblem">TS</div>
          <div>
            <div className="navbar-title">AI Tender Evaluation System</div>
            <div className="navbar-subtitle">Government Procurement Intelligence</div>
          </div>
        </div>
        <div className="navbar-right">
          <div className="navbar-clock">{clock || "00:00:00"}</div>
          <div className="navbar-badge">v1.0 BETA</div>
        </div>
      </nav>

      <main className="page">

        {/* ── UPLOAD SECTION ── */}
        <div className="section-header">
          <div className="section-title">Submit Tender Documents</div>
          <div className="section-desc">Upload one or more procurement documents for automated AI-powered evaluation and ranking.</div>
        </div>

        <div className="upload-card">
          <div className="upload-card-header">
            <div className="card-icon">📂</div>
            <div>
              <div className="card-label">Document Upload</div>
              <div className="card-sublabel">PDF, DOCX, TXT — multiple files supported</div>
            </div>
          </div>

          <div
            className={`dropzone ${dragOver ? "over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); setFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
            <span className="dropzone-icon">📄</span>
            <div className="dropzone-text">Drag & drop files here, or click to browse</div>
            <div className="dropzone-hint">Upload multiple bidder documents for comparative evaluation</div>
          </div>

          {fileCount > 0 && (
            <div className="file-selected">
              <span>✅</span>
              <span>{fileCount} file{fileCount > 1 ? "s" : ""} selected: {fileNames}</span>
            </div>
          )}

          <button className="submit-btn" onClick={handleUpload} disabled={loading || fileCount === 0}>
            {loading ? (
              <><span className="spinner" />Evaluating Tenders…</>
            ) : (
              <><span>🔍</span>Submit for Evaluation</>
            )}
          </button>

          {loading && (
            <div className="processing-banner">
              <span>⏳</span>
              <span>AI is analyzing all documents. Processing may take a few seconds per file…</span>
            </div>
          )}
        </div>

        {/* ── RESULTS ── */}
        {parsedResults.length > 0 && (
          <>
            <div className="divider" />

            {/* WINNER CARD */}
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
                <div className="winner-amount-row">
                  <div className="winner-pill">
                    Status: <span>{winner.status.toUpperCase() || "—"}</span>
                  </div>
                  {winner.amount != null && (
                    <div className="winner-pill">
                      Quoted: <span>₹{Number(winner.amount).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="winner-pill">
                    Ranked #1 of <span>{parsedResults.length}</span> bidder{parsedResults.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            )}

            {/* FILTER BAR */}
            <div className="filter-bar">
              <span className="filter-label">🎛 Min Score:</span>
              <input
                type="range" min={0} max={100} step={5}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="filter-range"
              />
              <div className="filter-value">{minScore}+</div>
              <div className="filter-count">
                Showing {filteredResults.length} of {parsedResults.length} bidder{parsedResults.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* RESULT HEADER */}
            <div className="result-header">
              <div className="result-title">📊 Evaluation Rankings</div>
              <div className="result-timestamp">
                {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>

            {filteredResults.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                No bidders match the minimum score of {minScore}. Lower the filter to see results.
              </div>
            ) : (
              <div className="ranking-list">
                {filteredResults.map((r, idx) => {
                  const globalRank = parsedResults.indexOf(r);
                  const isFirst = globalRank === 0;
                  const isQual = r.status.toLowerCase() === "qualified";
                  const sc = scoreColor(r.score);
                  const barPct = maxScore > 0 ? (r.score / maxScore) * 100 : r.score;

                  return (
                    <div key={idx} className={`rank-card ${isFirst ? "rank-first" : ""}`}>
                      <div className="rank-top">
                        <div className="rank-medal">
                          {medals[globalRank] ?? <span style={{ color: "#94a3b8", fontSize: "14px" }}>#{globalRank + 1}</span>}
                        </div>
                        <div className="rank-company">{r.company}</div>
                        {r.amount != null && (
                          <div className="rank-amount">₹{Number(r.amount).toLocaleString("en-IN")}</div>
                        )}
                        <div
                          className="rank-status-pill"
                          style={{
                            background: isQual ? "#dcfce7" : "#fee2e2",
                            color: isQual ? "#15803d" : "#dc2626",
                          }}
                        >
                          <span className="rank-status-dot" style={{ background: isQual ? "#22c55e" : "#ef4444" }} />
                          {r.status.toUpperCase() || "—"}
                        </div>
                        <div className="rank-score-badge" style={{ color: sc }}>{r.score}<span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 400 }}>/100</span></div>
                      </div>

                      {/* Comparison Bar */}
                      <div className="bar-row">
                        <div className="bar-label">{r.score}</div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${barPct}%`,
                              background: scoreGradient(r.score),
                            }}
                          />
                        </div>
                      </div>

                      {/* AI Explanation */}
                      {r.explanation && (
                        <div className="explanation-card">
                          <div className="explanation-header">
                            <span className="ai-badge">AI</span>
                            <span className="explanation-title">Evaluation Rationale</span>
                          </div>
                          <div className="explanation-text">{r.explanation}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── FALLBACK DEBUG (single result without parsed data) ── */}
        {allResults.length > 0 && parsedResults.length === 0 && (
          <div className="debug-card">
            <div className="debug-title">Raw API Response (Debug)</div>
            <pre className="debug-pre">{JSON.stringify(allResults, null, 2)}</pre>
          </div>
        )}

        <div className="footer">
          Powered by AI Tender Evaluation System &nbsp;·&nbsp; Government Procurement Intelligence Platform
        </div>
      </main>
    </>
  );
}