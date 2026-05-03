"use client";

import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("tenderResults");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  const parsed = data
    .filter((r) => r?.result)
    .map((r) => ({
      company: r.result.extracted_data?.company ?? "Unknown",
      score: r.result.evaluation?.score ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
        📊 Tender Reports
      </h1>

      {parsed.length === 0 ? (
        <p style={{ marginTop: "20px" }}>No data available</p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {parsed.map((item, index) => (
            <div
              key={index}
              style={{
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                marginBottom: "10px",
                background: index === 0 ? "#dcfce7" : "#fff",
              }}
            >
              <b>
                {index === 0 ? "🏆 " : ""}
                {index + 1}. {item.company}
              </b>
              <div>Score: {item.score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}