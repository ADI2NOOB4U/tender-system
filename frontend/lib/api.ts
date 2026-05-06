const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000/api'

// ========================================================
// TYPES
// ========================================================

export interface UploadResponse {
  success: boolean
  batch_id?: string
  jobs?: string[]
  total_files?: number
  processed_jobs?: number
}

export interface EvaluationBreakdown {
  technical: number
  financial: number
  compliance: number
}

export interface EvaluationResult {
  status: 'PASS' | 'FAIL' | 'REVIEW'

  score: number

  confidence?: number

  breakdown: EvaluationBreakdown

  explanation: string

  rules?: Record<string, unknown>
}

export interface JobResult {
  raw_text: string

  structured: Record<string, unknown>

  evaluation: EvaluationResult
}

export interface JobResponse {
  status:
    | 'queued'
    | 'pending'
    | 'processing'
    | 'ocr'
    | 'extracting'
    | 'evaluating'
    | 'completed'
    | 'done'
    | 'failed'
    | 'error'

  progress?: number

  file_name?: string

  batch_id?: string

  result?: JobResult

  error?: string
}

// ========================================================
// API HELPER
// ========================================================

async function handleResponse<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    let errorMessage =
      'Unknown API error'

    try {
      const text =
        await response.text()

      errorMessage = text
    } catch {
      errorMessage =
        response.statusText
    }

    throw new Error(
      `API Error (${response.status}): ${errorMessage}`
    )
  }

  return response.json()
}

// ========================================================
// SINGLE FILE UPLOAD
// ========================================================

export async function uploadFile(
  file: File
): Promise<UploadResponse> {
  const formData = new FormData()

  formData.append('files', file)

  const response = await fetch(
    `${BASE_URL}/upload-batch`,
    {
      method: 'POST',

      body: formData,
    }
  )

  return handleResponse<UploadResponse>(
    response
  )
}

// ========================================================
// MULTI FILE UPLOAD
// ========================================================

export async function uploadFiles(
  files: File[]
): Promise<UploadResponse> {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await fetch(
    `${BASE_URL}/upload-batch`,
    {
      method: 'POST',

      body: formData,
    }
  )

  return handleResponse<UploadResponse>(
    response
  )
}

// ========================================================
// FETCH JOB
// ========================================================

export async function getJob(
  jobId: string
): Promise<JobResponse> {
  const response = await fetch(
    `${BASE_URL}/job/${jobId}`,
    {
      method: 'GET',

      cache: 'no-store',

      headers: {
        'Content-Type':
          'application/json',
      },
    }
  )

  return handleResponse<JobResponse>(
    response
  )
}

// ========================================================
// FETCH BATCH
// ========================================================

export async function getBatch(
  batchId: string
) {
  const response = await fetch(
    `${BASE_URL}/batch/${batchId}`,
    {
      method: 'GET',

      cache: 'no-store',
    }
  )

  return handleResponse(response)
}

// ========================================================
// FETCH RANKING
// ========================================================

export async function getBatchRanking(
  batchId: string
) {
  const response = await fetch(
    `${BASE_URL}/batch/${batchId}/rank`,
    {
      method: 'GET',

      cache: 'no-store',
    }
  )

  return handleResponse(response)
}

// ========================================================
// HEALTH CHECK
// ========================================================

export async function healthCheck() {
  const response = await fetch(
    `${BASE_URL.replace(
      '/api',
      ''
    )}/healthz`,
    {
      method: 'GET',

      cache: 'no-store',
    }
  )

  return handleResponse(response)
}