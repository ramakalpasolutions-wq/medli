'use client'

import { useState, useRef, useCallback } from 'react'

export default function FileUpload({
  purpose,
  entityId,
  accept    = 'image/*',
  label     = 'Upload File',
  onSuccess,
  maxSizeMB = 5,
  style: extraStyle = {},
}) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')
  const [fileName,  setFileName]  = useState('')
  const inputRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB}MB.`)
      return
    }
    setError('')
    setUploading(true)
    setProgress(0)
    setFileName(file.name)
    setDone(false)

    try {
      const qs = new URLSearchParams({
        fileType: file.type,
        purpose,
        ...(entityId ? { entityId } : {}),
      })
      const presignRes  = await fetch(`/api/uploads/presigned-url?${qs}`, { credentials: 'include' })
      const presignJson = await presignRes.json()
      if (!presignJson.success) throw new Error(presignJson.error)

      const { presignedUrl, key, publicUrl } = presignJson.data

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', presignedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload  = () => xhr.status === 200 ? resolve() : reject(new Error('Upload failed'))
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.send(file)
      })

      setProgress(100)

      const confirmRes  = await fetch('/api/uploads/confirm', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ key, purpose, entityId }),
      })
      const confirmJson = await confirmRes.json()
      if (!confirmJson.success) throw new Error(confirmJson.error)

      setDone(true)
      onSuccess?.({ key, publicUrl })
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [purpose, entityId, maxSizeMB, onSuccess])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <>
      <style>{`@keyframes prog-fill { from { width: 0% } }`}</style>

      <div style={extraStyle}>
        {label && (
          <p style={{
            fontSize: 12, fontWeight: 600,
            color: '#475569', marginBottom: 8,
          }}>
            {label}
          </p>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#6366f1' : '#e2e8f0'}`,
            borderRadius: 16,
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            background: dragging
              ? 'rgba(99,102,241,0.04)'
              : '#fafafa',
            minHeight: 140,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {done ? (
            <>
              <div style={{ fontSize: 36 }}>✅</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#10b981', margin: 0 }}>Uploaded!</p>
              <p style={{
                fontSize: 11, color: '#94a3b8', margin: 0,
                maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{fileName}</p>
            </>
          ) : uploading ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 28 }}>📄</div>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{fileName}</p>
              <div style={{
                width: '100%', maxWidth: 240,
                height: 6, background: '#e2e8f0', borderRadius: 100, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  borderRadius: 100,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, margin: 0 }}>{progress}%</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 36 }}>☁️</div>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                Drop file here or{' '}
                <span style={{ color: '#6366f1', fontWeight: 600 }}>browse</span>
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Max {maxSizeMB}MB</p>
            </>
          )}
        </div>

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