"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import ResultsUI from "../components/ResultsUI";
export default function Home() {
  const pathname = usePathname();
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
      const jobIds = data.jobs ?? [];

      if (jobIds.length === 0) throw new Error("No job IDs returned");

      const settled = [];

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

      // 🔥 SAVE HISTORY (FIXED)
      const existing = localStorage.getItem("tenderHistory");
      let history = [];

      if (existing) {
        history = JSON.parse(existing);
      }

      history.push({
        id: Date.now(),
        data: settled,
      });

      localStorage.setItem("tenderHistory", JSON.stringify(history));

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

  const fileCount = files ? files.length : 0;
  const fileNames = files
    ? Array.from(files).map((f) => f.name).join(", ")
    : "";


  return (
    <>
      

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
          <Link
            href="/"
            className={`navbar-badge ${pathname === "/" ? "bg-yellow-400/20" : ""}`}
          >
            HOME
          </Link>

          <Link
            href="/reports"
            className={`navbar-badge ${pathname === "/reports" ? "bg-yellow-400/20" : ""}`}
          >
            REPORTS
          </Link>

          <Link
            href="/status"
            className={`navbar-badge ${pathname === "/status" ? "bg-yellow-400/20" : ""}`}
          >
            STATUS
          </Link>

          <div className="navbar-clock">{clock || "00:00:00"}</div>
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
        {parsedResults.length > 0 && (
        <ResultsUI
          parsedResults={parsedResults}
          filteredResults={filteredResults}
          winner={winner}
          minScore={minScore}
          setMinScore={setMinScore}
        />
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