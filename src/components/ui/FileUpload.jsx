'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, CheckCircle, File } from 'lucide-react'

export default function FileUpload({
  purpose,
  entityId,
  accept      = 'image/*',
  label       = 'Upload File',
  onSuccess,
  maxSizeMB   = 5,
  className   = '',
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
      // 1. Get presigned URL
      const qs = new URLSearchParams({ fileType: file.type, purpose, ...(entityId ? { entityId } : {}) })
      const presignRes = await fetch(`/api/uploads/presigned-url?${qs}`, { credentials: 'include' })
      const presignJson = await presignRes.json()
      if (!presignJson.success) throw new Error(presignJson.error)

      const { presignedUrl, key, publicUrl } = presignJson.data

      // 2. PUT to R2
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', presignedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload  = () => (xhr.status === 200 ? resolve() : reject(new Error('Upload failed')))
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.send(file)
      })

      setProgress(100)

      // 3. Confirm
      const confirmRes = await fetch('/api/uploads/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, purpose, entityId }),
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
    <div className={className}>
      {label && <p className="text-xs font-medium text-gray-700 mb-1.5">{label}</p>}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 cursor-pointer transition-all rounded-2xl ${
          dragging
            ? 'border-2 border-dashed border-blue-400 bg-blue-50'
            : 'border-2 border-dashed border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <p className="text-xs text-emerald-600 font-medium">Uploaded!</p>
              <p className="text-xs text-gray-400 truncate max-w-xs">{fileName}</p>
            </motion.div>
          ) : uploading ? (
            <motion.div key="uploading" className="w-full flex flex-col items-center gap-3">
              <File className="w-6 h-6 text-blue-500" />
              <p className="text-xs text-gray-500 truncate max-w-xs">{fileName}</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-1.5 bg-blue-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-blue-600 font-medium">{progress}%</p>
            </motion.div>
          ) : (
            <motion.div key="idle" className="flex flex-col items-center gap-2">
              <Upload className="w-7 h-7 text-gray-300" />
              <p className="text-sm text-gray-500">Drop file here or <span className="text-blue-600 font-medium">browse</span></p>
              <p className="text-xs text-gray-400">Max {maxSizeMB}MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}