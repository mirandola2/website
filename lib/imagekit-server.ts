import 'server-only'
import ImageKit from '@imagekit/nodejs'

// Uploads go through our server so the private key never reaches the browser. Development uses
// a separate folder (IMAGEKIT_STAFF_FOLDER=/dev/staff/), so tests never touch production photos.
const STAFF_FOLDER = process.env.IMAGEKIT_STAFF_FOLDER || '/img/staff/'

// The browser sends a 256×256 photo (components/tabu/PhotoUploader.tsx): ~10–30 KB
export const MAX_PHOTO_BYTES = 100 * 1024
const PHOTO_TYPES = ['image/webp', 'image/jpeg', 'image/png']

export function checkPhoto(file: unknown): file is File {
  return file instanceof File && PHOTO_TYPES.includes(file.type) && file.size > 0 && file.size <= MAX_PHOTO_BYTES
}

function client() {
  if (!process.env.IMAGEKIT_PRIVATE_KEY) throw new Error('IMAGEKIT_PRIVATE_KEY is not set')
  return new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY })
}

// The server picks the name: <slug>-<timestamp>.<ext>. A new name per upload means no stale CDN copy.
export async function uploadStaffPhoto(file: File, slug: string) {
  const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
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
