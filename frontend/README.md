# e-Procurement Portal — Tender Evaluation System

A professional government-style web dashboard built with **Next.js 14 (App Router)** and **Tailwind CSS**.

---

## Project Structure

```
tender-dashboard/
├── app/
│   ├── globals.css            # Tailwind base + government styles
│   ├── layout.tsx             # Root layout (header, footer, nav)
│   ├── page.tsx               # Upload Page (/)
│   └── job/
│       └── [id]/
│           └── page.tsx       # Job Status Page (/job/:id)
├── components/
│   ├── UploadBox.tsx          # Drag & drop file uploader
│   ├── StatusCard.tsx         # Job status indicator
│   ├── Timer.tsx              # Live processing timer
│   └── ResultView.tsx         # Results display (OCR, JSON, verdict)
├── lib/
│   └── api.ts                 # API helpers: uploadFile(), getJob()
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Setup & Run

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open: http://localhost:3000

> Make sure your backend API is running at http://127.0.0.1:8000

---

## API Contract

### POST /upload
- **Body**: `multipart/form-data` with field `file`
- **Response**: `{ "job_id": "string" }`

### GET /job/{id}
- **Response**:
```json
{
  "job_id": "abc123",
  "status": "pending | processing | done | failed",
  "result": {
    "evaluation": "PASS | FAIL | REVIEW",
    "ocr_text": "...",
    "structured_data": { ... }
  },
  "error": "optional error message"
}
```

---

## Features

| Feature | Description |
|---|---|
| Drag & Drop Upload | Accepts PDF, DOC, DOCX, PNG, JPG, TIFF |
| Auto-redirect | Goes to `/job/{id}` after upload |
| Live Polling | Fetches job status every 2 seconds |
| Live Timer | MM:SS counter, stops when done/failed |
| Status Cards | Colour-coded: Pending / Processing / Done / Failed |
| OCR Output | Scrollable monospaced text box |
| Structured JSON | Formatted + copyable JSON output |
| Verdict Banner | Bold PASS / FAIL / REVIEW with colour |
| Field Table | Auto-rendered key-value table from JSON |
| Print / Download | Print report or download as JSON |

---

## Design System

- **Typography**: Georgia (serif) — professional, document-like
- **Palette**: Navy `#1a3a5c`, Blue `#2c5f8a`, Grey tones
- **Style**: Sharp edges (no border-radius), white cards, structured grids
- **Target**: Non-technical government procurement officers
