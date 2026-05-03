"use client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useEffect, useState } from "react";
import ResultsUI from "../../components/ResultsUI";

export default function ReportsPage() {
    const exportPDF = async () => {
        const element = document.getElementById("report-section");

        if (!element) return alert("Nothing to export");

        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");

        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
        pdf.save("tender-report.pdf");
        };
    const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [minScore, setMinScore] = useState(0);

  // 🔥 LOAD HISTORY
  useEffect(() => {
    const stored = localStorage.getItem("tenderHistory");

    if (stored) {
      const parsed = JSON.parse(stored);
      setBatches(parsed);
    }
  }, []);

  // 🔥 SELECT DATA
  const selectedData =
    selectedBatch !== null
      ? batches[selectedBatch]?.data ?? []
      : batches.flatMap((b) => b.data ?? []);

  // 🔥 PARSE DATA (same as page.tsx)
  const parsedResults = selectedData
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

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
        📊 Tender Reports
      </h1>

      {/* 🔥 BATCH SELECTOR */}
      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>📦 Select Batch:</label>

        <select
          onChange={(e) => {
            const val = e.target.value;
            setSelectedBatch(val === "" ? null : Number(val));
          }}
        >
          <option value="">All Batches</option>

          {batches.map((_, index) => (
            <option key={index} value={index}>
              Batch {index + 1}
            </option>
          ))}
        </select>
      </div>

      {/* 🔥 RESULTS UI */}
      {parsedResults.length > 0 && (
        <ResultsUI
          parsedResults={parsedResults}
          filteredResults={filteredResults}
          winner={winner}
          minScore={minScore}
          setMinScore={setMinScore}
        />
      )}
    </div>
  );
}