'use client'

import { useState, useRef } from 'react'

export default function BulkUploadModal({ isOpen, onClose, entityType }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [report, setReport] = useState(null)
  const [status, setStatus] = useState('idle') // idle | success | error
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const label = entityType === 'hospital' ? 'Hospital' : 'Lab'
  const templateEndpoint = `/api/admin/bulk-upload/${entityType}s/template`
  const uploadEndpoint = `/api/admin/bulk-upload/${entityType}s`

  const handleDownloadTemplate = () => {
    window.open(templateEndpoint, '_blank')
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && (selected.name.endsWith('.xlsx') || selected.name.endsWith('.xls'))) {
      setFile(selected)
      setReport(null)
      setStatus('idle')
    } else {
      alert('Please select a valid .xlsx or .xls file')
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setReport(null)
    setStatus('idle')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (json.success) {
        setReport(json.data)
        setStatus('success')
      } else {
        setStatus('error')
        setReport({ errors: [json.error || 'Upload failed'] })
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
      setReport({ errors: ['Network error while uploading file'] })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setReport(null)
    setStatus('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Bulk Upload {label}s
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload an Excel file to create multiple {label.toLowerCase()}s at once
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Step 1: Download Template */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                1
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Download Sample Template</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Download the pre-filled Excel template with correct column headers and sample data.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download {label} Template (.xlsx)
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                2
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Upload Your File</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fill in the template and upload it here. Supported: .xlsx, .xls
                </p>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-5 text-center hover:border-green-400 hover:bg-green-50/50 transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  {file ? (
                    <div>
                      <span className="text-2xl">📄</span>
                      <p className="mt-1 text-sm font-semibold text-green-700">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB — Click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl text-gray-300">⬆️</span>
                      <p className="mt-1 text-sm text-gray-500">
                        Click to browse or drag & drop
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Report */}
          {report && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <h4 className="font-bold text-gray-800 mb-2">Processing Report</h4>
              {report.created !== undefined && (
                <div className="flex gap-4 text-xs font-semibold mb-2">
                  <span className="text-green-700">✅ Created: {report.created}</span>
                  <span className="text-red-700">❌ Failed: {report.failed}</span>
                </div>
              )}
              {report.errors?.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto rounded bg-white/70 p-2 text-xs text-red-600 space-y-0.5">
                  {report.errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          >
            {status === 'success' ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload & Process
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}