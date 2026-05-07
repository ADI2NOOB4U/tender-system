# 🇮🇳 AI-Based Tender Evaluation & Comparative Scoring System

An AI-powered procurement intelligence platform designed to automate tender evaluation, bidder comparison, OCR extraction, and compliance assessment for modern government procurement workflows.

---

# 📌 Overview

Government tender evaluation is often:

* manual
* document-heavy
* time-consuming
* inconsistent

This system streamlines the procurement workflow using:

* OCR-based document extraction
* AI-powered comparative evaluation
* automated compliance checks
* bidder ranking & scoring
* downloadable evaluation reports

The platform enables procurement teams to rapidly analyze bidder submissions and generate structured evaluation insights in real time.

---

# 🚀 Key Features

## 📄 Multi-Document Upload

Upload multiple bidder documents simultaneously for comparative analysis.

Supported formats:

* PDF
* PNG
* JPG

---

## 🔍 OCR Extraction

Extracts structured text from uploaded procurement documents using OCR processing.

---

## 🧠 AI-Based Evaluation

Each bidder is analyzed across:

* Technical Strength
* Financial Competitiveness
* Compliance Readiness

The system generates:

* composite score
* AI confidence
* evaluation explanation
* comparative ranking

---

## 🏆 Comparative Bidder Ranking

Automatically ranks submissions and identifies the top-performing bidder.

---

## 📊 Interactive Dashboard

Professional government-style dashboard featuring:

* live AI processing workflow
* evaluation cards
* animated scoring bars
* compliance breakdown
* bidder comparison UI

---

## 📑 PDF Evaluation Report Export

Generate downloadable procurement evaluation reports directly from the platform.

---

# ⚙️ Tech Stack

## Frontend

* Next.js 14
* TypeScript
* CSS3
* Responsive UI

## Backend

* FastAPI
* Python

## AI / Processing

* OCR Pipeline
* AI-based scoring engine
* Rule-based compliance evaluation

## Infrastructure

* Redis (Upstash)
* Async job processing

---

# 🏗️ System Workflow

```text
Upload Documents
        ↓
OCR Extraction
        ↓
Text Parsing
        ↓
AI Evaluation
        ↓
Comparative Scoring
        ↓
Redis Job Storage
        ↓
Frontend Result Rendering
```

---

# 📂 Project Structure

```text
TENDER/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── worker/
│   │   ├── db/
│   │   └── core/
│   │
│   ├── uploads/
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── styles/
│   └── public/
│
└── README.md
```

---

# 🧠 AI Evaluation Logic

The evaluation engine analyzes:

* bidder documentation
* procurement compliance
* financial indicators
* technical readiness
* verification signals

Scoring categories:

* Technical Score (50)
* Financial Score (30)
* Compliance Score (20)

---

# 🏛️ Government Relevance

This system can support:

* digital procurement modernization
* faster bidder screening
* procurement transparency
* standardized evaluation workflows
* reduced manual workload

Potential deployment areas:

* government procurement departments
* PSU procurement systems
* enterprise vendor evaluation
* digital governance platforms

---

# 📈 Future Scope

* Multilingual OCR support
* Fraud/risk detection
* Vendor analytics dashboard
* GeM/e-procurement integration
* AI-powered procurement insights
* Historical bidder intelligence

---

# ▶️ Running the Project

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 👨‍💻 Team

Built during hackathon development for AI-driven procurement modernization and tender intelligence.

---

# 📜 License

This project was developed for hackathon/demo purposes.
