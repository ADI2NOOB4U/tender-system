'use client'

import { useCallback, useRef, useState } from 'react'

interface UploadBoxProps {
  onUpload: (file: File) => void
  isUploading: boolean
  error?: string
}

export function UploadBox({ onUpload, isUploading, error }: UploadBoxProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setSelectedFile(file)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleSubmit = () => {
    if (selectedFile) onUpload(selectedFile)
  }

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed cursor-pointer transition-colors duration-150
          ${dragActive
            ? 'border-gov-blue bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gov-blue hover:bg-gray-100'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.tiff"
          onChange={handleChange}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {/* Upload Icon */}
          <svg
            className="w-10 h-10 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>

          {selectedFile ? (
            <>
              <p className="text-gov-navy font-semibold text-sm">{selectedFile.name}</p>
              <p className="text-gray-500 text-xs mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB &nbsp;·&nbsp; Click to change file
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 text-sm font-semibold">
                Drag &amp; drop tender document here
              </p>
              <p className="text-gray-400 text-xs mt-1">or click to browse files</p>
              <p className="text-gray-400 text-xs mt-3">
                Accepted formats: PDF, DOC, DOCX, PNG, JPG, TIFF
              </p>
            </>
          )}
        </div>
      </div>

      {/* File Info Row */}
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-gov-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
            </svg>
            <span className="text-xs text-gov-navy font-semibold">{selectedFile.name}</span>
            <span className="text-xs text-gray-500">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
            className="text-gray-400 hover:text-red-600 text-xs underline"
            disabled={isUploading}
          >
            Remove
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 px-4 py-2.5 text-xs text-red-800 flex items-start gap-2">
          <span className="font-bold mt-0.5">✕</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading}
          className="gov-btn-primary flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Submit Tender Document
            </>
          )}
        </button>
        <span className="text-xs text-gray-400">
          Maximum file size: 25 MB
        </span>
      </div>
    </div>
  )
}
