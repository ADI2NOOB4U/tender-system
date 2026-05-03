"use client";

import { useState } from "react";

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      alert("Please select at least one file");
      return;
    }

    setLoading(true);

    const formData = new FormData();

    // 🔥 IMPORTANT: backend expects "files"
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch(
        "https://tender-system-md8s.onrender.com/upload-batch",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
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

      {response && (
        <div style={{ marginTop: "30px" }}>
          <h2>Response:</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}