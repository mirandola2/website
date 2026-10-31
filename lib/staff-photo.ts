import 'server-only'
import { revalidatePath, revalidateTag } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { deleteStaffPhoto, photoExtension, uploadStaffPhoto } from './imagekit-server'
import { staffMember } from '@/db/schema'
import type { ActionResult } from '@/components/tabu/types'

// Shared by the leader's own upload (profilo) and the admin's (any row, RS included). The caller
// decides which row: never trust an id from the form without checking the session first.
export async function replaceStaffPhoto(row: { id: number; slug: string; imgFileId: string | null }, file: unknown): Promise<ActionResult> {
  const ext = await photoExtension(file)
  if (!ext) return { ok: false, message: 'La foto deve essere WebP, JPEG o PNG, al massimo 100 KB.' }
  if (!process.env.IMAGEKIT_PRIVATE_KEY) return { ok: false, message: 'Caricamento foto non configurato (IMAGEKIT_PRIVATE_KEY).' }

  let uploaded
  try {
    uploaded = await uploadStaffPhoto(file as File, ext, row.slug)
  } catch (err) {
    console.error('ImageKit upload failed', err)
    return { ok: false, message: 'Caricamento non riuscito, riprova.' }
  }

  await db.update(staffMember).set({ img: uploaded.path, imgFileId: uploaded.fileId }).where(eq(staffMember.id, row.id))
  await deleteStaffPhoto(row.imgFileId)

  // The 7 public pages with staff cards regenerate on their next visit
  revalidateTag('staff', 'max')
  revalidatePath('/tabu', 'layout')
  return { ok: true, message: 'Foto aggiornata.' }
}
