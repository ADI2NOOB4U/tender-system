'use client'

const GUIDELINES = [
  {
    icon: '📋',
    title: 'Eligible Document Types',
    body: (
      <>
        <ul>
          <li><strong>Technical Bid:</strong> Scanned PDF, PNG, or JPG of the technical proposal</li>
          <li><strong>Financial Bid:</strong> Price schedule documents in PDF format</li>
          <li><strong>Eligibility Documents:</strong> Registration certificates, past experience, turnover proofs</li>
          <li>Maximum file size: <strong>20 MB per document</strong></li>
          <li>Resolution: Minimum <strong>200 DPI</strong> for OCR accuracy</li>
        </ul>
      </>
    ),
  },
  {
    icon: '⚖️',
    title: 'Evaluation Criteria — GFR 2017',
    body: (
      <>
        <p style={{ marginBottom: '10px' }}>Scoring is based on the three-criteria QCBS model:</p>
        <ul>
          <li><strong>Technical Score (50 pts):</strong> Qualifications, methodology, experience, manpower</li>
          <li><strong>Financial Score (30 pts):</strong> L1 pricing, rate analysis, reasonableness</li>
          <li><strong>Compliance Score (20 pts):</strong> Eligibility criteria, document completeness, certifications</li>
        </ul>
        <p style={{ marginTop: '10px' }}>Final Score = Technical + Financial + Compliance (Max 100)</p>
      </>
    ),
  },
  {
    icon: '🔄',
    title: 'Upload &amp; Processing Workflow',
    body: (
      <>
        <ul>
          <li>Upload all bidder documents simultaneously for comparative evaluation</li>
          <li>System performs OCR extraction and AI scoring within 30–90 seconds</li>
          <li>Job IDs are generated for each submission — track via <strong>Job Status</strong> tab</li>
          <li>Results are ranked automatically; winner is flagged as Best Bid</li>
          <li>Export final report as PDF from the <strong>Reports</strong> section</li>
        </ul>
      </>
    ),
  },
  {
    icon: '🔒',
    title: 'Data Security &amp; Confidentiality',
    body: (
      <>
        <ul>
          <li>All documents are processed in an isolated, air-gapped server environment</li>
          <li>No document data is retained beyond the session unless explicitly saved</li>
          <li>Access is restricted to authorized procurement officials (MoF Level 2+)</li>
          <li>Evaluation logs are immutable and stored for 7 years per audit requirements</li>
          <li>System complies with <strong>IT Act 2000</strong> and <strong>CERT-In guidelines</strong></li>
        </ul>
      </>
    ),
  },
  {
    icon: '⚠️',
    title: 'Important Notices',
    body: (
      <>
        <ul>
          <li>AI evaluation is advisory only; final procurement decision rests with the Committee</li>
          <li>Ensure documents are not password-protected before upload</li>
          <li>Handwritten documents may have reduced OCR accuracy; prefer digital PDFs</li>
          <li>For technical assistance, contact: <strong>eprocure-helpdesk@gov.in</strong></li>
          <li>Helpdesk hours: Monday–Friday, 09:00–17:30 IST</li>
        </ul>
      </>
    ),
  },
]

export default function GuidelinesPage() {
  return (
    <div className="page-wrap animate-fadeInUp">
      <div className="section-header">
        <h1>Portal Guidelines &amp; Instructions</h1>
        <p>Standard operating procedures for AI-assisted tender evaluation — Ministry of Finance, GoI</p>
      </div>

      <div className="guidelines-section">
        {GUIDELINES.map((item, i) => (
          <div key={i} className="guideline-card animate-fadeInUp" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="guideline-header">
              <div className="guideline-icon">{item.icon}</div>
              <div className="guideline-title">{item.title}</div>
            </div>
            <div className="guideline-body">{item.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
