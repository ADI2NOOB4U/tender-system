"use client";

import { useState } from "react";

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const API_URL = "https://tender-system-md8s.onrender.com";

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      alert("Please select at least one file");
      return;
    }

    setLoading(true);
    setResponse(null);

    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      // STEP 1: Upload
      const res = await fetch(`${API_URL}/upload-batch`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const data = JSON.parse(text);

      // STEP 2: Get job ID
      const jobId = data.jobs?.[0];
      if (!jobId) throw new Error("No job ID returned");

      // STEP 3: Fetch result
      let jobData;

      // small polling (because processing might take time)
      for (let i = 0; i < 5; i++) {
        const jobRes = await fetch(`${API_URL}/job/${jobId}`);
        jobData = await jobRes.json();

        if (jobData.status === "done") break;

        await new Promise((r) => setTimeout(r, 1000)); // wait 1 sec
      }

      setResponse(jobData);

    } catch (err) {
      console.error("ERROR:", err);
      alert("Upload failed — check console");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>AI Tender Evaluation System</h1>

      <div style={{ marginTop: "20px" }}>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
        />
      </div>

      <button
        onClick={handleUpload}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#1e3a8a",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Processing..." : "Submit Tender Document"}
      </button>

      {/* ✅ CLEAN RESULT UI */}
      {response?.result && (
        <div style={{ marginTop: "30px" }}>
          <h2>Evaluation Result</h2>

          <div style={{ background: "#f3f4f6", padding: "20px", borderRadius: "10px" }}>
            <pre>{JSON.stringify(response.result, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* fallback debug */}
      {response && !response.result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Raw Response (debug)</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}