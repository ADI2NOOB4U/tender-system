"use client";

import { useState, useEffect } from "react";

export default function StatusPage() {
  const [jobId, setJobId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = "https://tender-system-md8s.onrender.com";

  const checkStatus = async () => {
    if (!jobId) return alert("Enter Job ID");

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/job/${jobId}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      alert("Error fetching job");
    }

    setLoading(false);
  };

  // 🔁 AUTO POLL
  useEffect(() => {
    if (!data || data.status !== "processing") return;

    const interval = setInterval(() => {
      checkStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [data]);

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
        🔍 Job Status
      </h1>

      <div style={{ marginTop: "20px" }}>
        <input
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          placeholder="Enter Job ID"
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            marginRight: "10px",
          }}
        />

        <button onClick={checkStatus}>
          {loading ? "Checking..." : "Check Status"}
        </button>
      </div>

      {data && (
        <div style={{ marginTop: "20px" }}>
          <h3>Status: {data.status}</h3>

          {data.status === "done" && (
            <pre>{JSON.stringify(data.result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}