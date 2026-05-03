const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ---------------- TYPES ----------------

export interface UploadResponse {
  job_id: string;
}

export interface EvaluationResult {
  status: "pass" | "fail" | "review";
  reasons: string[];
}

export interface JobResult {
  raw_text: string;
  structured: Record<string, unknown>;
  evaluation: EvaluationResult;
}

export interface JobResponse {
  status: "pending" | "processing" | "done" | "failed";
  result?: JobResult;
  error?: string;
}

// ---------------- API ----------------

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const res = await fetch(`${BASE_URL}/job/${jobId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch job (${res.status}): ${errorText}`);
  }

  return res.json();
}