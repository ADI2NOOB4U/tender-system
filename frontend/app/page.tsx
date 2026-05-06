'use client'

import UploadBox from '@/components/UploadBox'

export default function HomePage() {
  return (
    <main className="page">
      <div className="section-header">
        <div className="section-title">
          Submit Tender Documents
        </div>

        <div className="section-desc">
          Upload procurement documents for
          AI-powered evaluation and ranking.
        </div>
      </div>

      <UploadBox />
    </main>
  )
}