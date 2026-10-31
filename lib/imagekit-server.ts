import 'server-only'
import ImageKit from '@imagekit/nodejs'

// Uploads go through our server so the private key never reaches the browser. Development uses
// a separate folder (IMAGEKIT_STAFF_FOLDER=/dev/staff/), so tests never touch production photos.
const STAFF_FOLDER = process.env.IMAGEKIT_STAFF_FOLDER || '/img/staff/'

// The browser sends a 256×256 photo (components/tabu/PhotoUploader.tsx): ~10–30 KB
export const MAX_PHOTO_BYTES = 100 * 1024

export type PhotoExt = 'webp' | 'jpg' | 'png'

// The format comes from the file's first bytes: the Content-Type is whatever the client sent.
// null when it's not a WebP, JPEG or PNG within the size limit.
export async function photoExtension(file: unknown): Promise<PhotoExt | null> {
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_PHOTO_BYTES) return null
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpg'
  if (ascii(1, 4) === 'PNG' && head[0] === 0x89 && head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a) return 'png'
  return null
}

function client() {
  if (!process.env.IMAGEKIT_PRIVATE_KEY) throw new Error('IMAGEKIT_PRIVATE_KEY is not set')
  return new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY })
}

// The server picks the name: <slug>-<timestamp>.<ext>. A new name per upload means no stale CDN copy.
export async function uploadStaffPhoto(file: File, ext: PhotoExt, slug: string) {
  const res = await client().files.upload({
    file,
    fileName: `${slug}-${Date.now()}.${ext}`,
    folder: STAFF_FOLDER,
    useUniqueFileName: false,
  })
  if (!res.fileId || !res.filePath) throw new Error('ImageKit upload returned no file')
  return { fileId: res.fileId, path: res.filePath }
}

// Only files uploaded from the site have a stored fileId: imported photos are never deleted
export async function deleteStaffPhoto(fileId: string | null) {
  if (!fileId) return
  try {
    await client().files.delete(fileId)
  } catch (err) {
    // The new photo is already saved: a leftover file is harmless
    console.error('ImageKit delete failed', fileId, err)
  }
}
