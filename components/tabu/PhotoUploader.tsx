'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { UploadSimpleIcon } from '@phosphor-icons/react'
import type { ActionResult } from './types'

const SIZE = 256

// Center square crop, resized in the browser to 256×256 (WebP where supported, else JPEG):
// ~10–30 KB, under the server's 100 KB limit.
async function toSquare(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()

  const encode = (type: string) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.85))
  let blob = await encode('image/webp')
  // Older Safari silently returns PNG for unsupported types
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg')
  if (!blob) throw new Error('encode failed')
  return new File([blob], blob.type === 'image/webp' ? 'photo.webp' : 'photo.jpg', { type: blob.type })
}

interface PhotoUploaderProps {
  action: (formData: FormData) => Promise<ActionResult>
  // Extra fields for the action (the admin passes the staff row id)
  fields?: Record<string, string>
}

export default function PhotoUploader({ action, fields = {} }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ActionResult>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setResult(null)
    if (!file) return
    try {
      const square = await toSquare(file)
      setPhoto(square)
      setPreview(URL.createObjectURL(square))
    } catch {
      setResult({ ok: false, message: 'Immagine non leggibile: prova con un JPEG o un PNG.' })
    }
  }

  function upload() {
    if (!photo) return
    const data = new FormData()
    data.set('photo', photo)
    for (const [k, v] of Object.entries(fields)) data.set(k, v)
    startTransition(async () => {
      const res = await action(data)
      setResult(res)
      if (res?.ok) {
        setPhoto(null)
        setPreview(null)
        if (inputRef.current) inputRef.current.value = ''
      }
    })
  }

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" className="file-input w-full max-w-sm" onChange={onPick} aria-label="Scegli una foto" />
      {preview && (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={preview} alt="Anteprima" className="mask mask-squircle w-28 h-28 object-cover" />
          <div className="text-sm opacity-70">
            Ritaglio quadrato, {Math.round((photo?.size ?? 0) / 1024)} KB
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={upload} disabled={!photo || pending}>
          {pending ? <span className="loading loading-spinner loading-xs" /> : <UploadSimpleIcon size={18} weight="bold" aria-hidden />}
          Carica foto
        </button>
        {result && !pending && (
          <span role="status" className={`text-sm ${result.ok ? 'text-success' : 'text-error'}`}>
            {result.message}
          </span>
        )}
      </div>
    </div>
  )
}
