'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadBox } from '@/components/UploadBox'
import { uploadFile } from '@/lib/api'

export default function UploadPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setError(undefined)
    try {
      const { job_id } = await uploadFile(file)
      router.push(`/job/${job_id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header Breadcrumb */}
      <div className="text-xs text-gray-400 tracking-wide">
        Home &rsaquo; Upload Tender Document
      </div>

      {/* Page Title */}
      <div className="border-b-2 border-gov-navy pb-3">
        <h1 className="text-xl font-bold text-gov-navy tracking-wide">
          Tender Document Submission
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Upload the official tender document for automated OCR extraction and compliance evaluation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="gov-card p-6">
            <div className="gov-section-title">Document Upload</div>
            <UploadBox
              onUpload={handleUpload}
              isUploading={isUploading}
              error={error}
            />
          </div>

          {/* Notice */}
          <div className="border border-yellow-300 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-sm mt-0.5">⚠</span>
              <div className="text-xs text-yellow-800 space-y-1">
                <p className="font-semibold">Important Notice</p>
                <p>
                  Only authenticated procurement officers are permitted to submit documents.
                  All uploads are logged and audited in accordance with the Right to Information
                  Act, 2005 and the GFR 2017.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Side Instructions Panel */}
        <div className="space-y-4">
          <div className="gov-card p-5">
            <div className="gov-section-title">Submission Guidelines</div>
            <ol className="space-y-3 text-xs text-gray-600 list-none">
              {[
                'Ensure the document is a complete, unredacted tender file.',
                'Scanned documents must be at 300 DPI or higher for accurate OCR.',
                'File must not exceed 25 MB in size.',
                'Accepted formats: PDF, DOC, DOCX, PNG, JPG, TIFF.',
                'Do not upload password-protected or encrypted files.',
                'Each submission will receive a unique Job ID for tracking.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="bg-gov-navy text-white text-xs w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="gov-card p-5">
            <div className="gov-section-title">System Status</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Server</span>
                <span className="flex items-center gap-1.5 text-green-700 font-semibold">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">OCR Engine</span>
                <span className="flex items-center gap-1.5 text-green-700 font-semibold">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Queue Depth</span>
                <span className="text-gray-700 font-semibold">0 jobs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg. Process Time</span>
                <span className="text-gray-700 font-semibold">~45s</span>
              </div>
            </div>
          </div>

          <div className="gov-card p-5">
            <div className="gov-section-title">Helpdesk</div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>For technical issues, contact:</p>
              <p className="font-semibold text-gov-navy">1800-111-2345</p>
              <p className="text-gray-400">(Toll-free · 9 AM–6 PM IST)</p>
              <p className="mt-2">Email:</p>
              <p className="font-semibold text-gov-blue">eprocure-support@gov.in</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
