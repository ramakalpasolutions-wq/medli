// src/components/ui/FileUpload.jsx
'use client'

import { useState, useRef, useCallback } from 'react'

export default function FileUpload({
  purpose,
  entityId,
  accept      = 'image/*',
  label       = 'Upload File',
  onSuccess,
  maxSizeMB   = 5,
  multiple    = false,        // enable multi-upload (gallery)
  showPreview = true,         // show image preview after upload
  currentUrl  = null,         // existing image to show before upload
  style: extraStyle = {},
}) {
  const [dragging,   setDragging]   = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState('')
  const [fileName,   setFileName]   = useState('')
  const [previewUrl, setPreviewUrl] = useState(currentUrl || null)
  const inputRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file) return

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB}MB.`)
      return
    }

    // Local preview
    if (file.type.startsWith('image/') && showPreview) {
      const reader = new FileReader()
      reader.onload = (e) => setPreviewUrl(e.target.result)
      reader.readAsDataURL(file)
    }

    setError('')
    setUploading(true)
    setProgress(0)
    setFileName(file.name)
    setDone(false)

    try {
      // 1️⃣ Get presigned URL
      const qs = new URLSearchParams({
        fileType: file.type,
        purpose,
        ...(entityId ? { entityId } : {}),
      })
      const presignRes  = await fetch(
        `/api/uploads/presigned-url?${qs}`,
        { credentials: 'include' }
      )
      const presignJson = await presignRes.json()
      if (!presignJson.success) throw new Error(presignJson.error || 'Failed to get upload URL')

      const { presignedUrl, key, publicUrl } = presignJson.data

      // 2️⃣ Upload directly to R2 via XHR (for progress)
      // 2️⃣ Upload directly to R2 via XHR (for progress)
await new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest()
  xhr.open('PUT', presignedUrl)
  xhr.setRequestHeader('Content-Type', file.type)

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable)
      setProgress(Math.round((e.loaded / e.total) * 100))
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      resolve()
    } else {
      console.error('[R2 Upload] Failed:', {
        status: xhr.status,
        statusText: xhr.statusText,
        response: xhr.responseText,
        url: presignedUrl.split('?')[0],
      })
      reject(new Error(`R2 upload failed (HTTP ${xhr.status}): ${xhr.statusText || 'see console'}`))
    }
  }

  xhr.onerror = () => {
    console.error('[R2 Upload] Network/CORS error', {
      url: presignedUrl.split('?')[0],
      status: xhr.status,
    })
    reject(new Error('Network error or CORS blocked — check R2 bucket CORS config'))
  }

  xhr.ontimeout = () => reject(new Error('Upload timed out'))

  xhr.send(file)
})

      setProgress(100)

      // 3️⃣ Confirm upload → update DB
      const confirmRes  = await fetch('/api/uploads/confirm', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ key, purpose, entityId }),
      })
      const confirmJson = await confirmRes.json()
      if (!confirmJson.success) throw new Error(confirmJson.error || 'Confirm failed')

      // Update preview to CDN URL
      if (file.type.startsWith('image/') && showPreview) {
        setPreviewUrl(publicUrl)
      }

      setDone(true)
      onSuccess?.({ key, publicUrl })
    } catch (err) {
      setError(err.message || 'Upload failed')
      setPreviewUrl(currentUrl || null) // revert preview on error
    } finally {
      setUploading(false)
    }
  }, [purpose, entityId, maxSizeMB, onSuccess, showPreview, currentUrl])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <>
      <style>{`@keyframes fu-spin { to { transform: rotate(360deg) } }`}</style>

      <div style={extraStyle}>
        {label && (
          <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
            {label}
          </p>
        )}

        {/* ── Current / preview image ── */}
        {showPreview && previewUrl && (
          <div style={{ marginBottom: 10 }}>
            <img
              src={previewUrl}
              alt="Preview"
              style={{
                width: '100%',
                maxHeight: 160,
                objectFit: 'cover',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
              }}
            />
          </div>
        )}

        {/* ── Drop zone ── */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#6366f1' : done ? '#10b981' : '#e2e8f0'}`,
            borderRadius: 16,
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            background: dragging
              ? 'rgba(99,102,241,0.04)'
              : done
                ? 'rgba(16,185,129,0.04)'
                : '#fafafa',
            minHeight: 110,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {done ? (
            <>
              <div style={{ fontSize: 30 }}>✅</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#10b981', margin: 0 }}>
                Uploaded!
              </p>
              <p style={{
                fontSize: 11, color: '#94a3b8', margin: 0,
                maxWidth: 200, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {fileName}
              </p>
              <p style={{
                fontSize: 11, color: '#6366f1', margin: 0,
                cursor: 'pointer', textDecoration: 'underline',
              }}>
                Upload a different file
              </p>
            </>
          ) : uploading ? (
            <div style={{
              width: '100%', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                border: '3px solid rgba(99,102,241,0.2)',
                borderTopColor: '#6366f1',
                animation: 'fu-spin .7s linear infinite',
                display: 'inline-block',
              }} />
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{fileName}</p>
              <div style={{
                width: '100%', maxWidth: 220,
                height: 6, background: '#e2e8f0',
                borderRadius: 100, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  borderRadius: 100,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, margin: 0 }}>
                {progress}%
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 30 }}>☁️</div>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Drop here or{' '}
                <span style={{ color: '#6366f1', fontWeight: 600 }}>browse</span>
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                Max {maxSizeMB}MB
              </p>
            </>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <p style={{
            fontSize: 12, color: '#ef4444',
            marginTop: 8, display: 'flex',
            alignItems: 'center', gap: 4,
          }}>
            ✕ {error}
          </p>
        )}
      </div>
    </>
  )
}