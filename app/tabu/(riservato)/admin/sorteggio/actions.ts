'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/dal'
import { createDraw as makeDraw, deleteDraw as removeDraw, DrawError, setDrawStatus } from '@/lib/draw'
import type { ActionResult } from '@/components/tabu/types'

// Every action re-checks the admin flag. None of them ever returns who drew whom: not even the
// admin who starts a draw learns it.

function done(message: string): ActionResult {
  // The navbar and the Bacheca show the Sorteggio only to whoever has an open one
  revalidatePath('/tabu', 'layout')
  return { ok: true, message }
}

const CreateSchema = z.object({
  title: z.string().trim().min(1, 'Titolo obbligatorio.').max(100, 'Titolo troppo lungo.'),
  participants: z.array(z.string().trim().min(1).max(100)).max(500),
})

export async function createDraw(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = CreateSchema.safeParse({ title: formData.get('title') ?? '', participants: formData.getAll('participants') })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  try {
    const n = await makeDraw(admin.memberCode, parsed.data.title, parsed.data.participants)
    return done(`Sorteggio fatto: ${n} partecipanti. Ognuno vede chi gli è toccato nel Tabù, alla voce Sorteggio.`)
  } catch (error) {
    if (error instanceof DrawError) return { ok: false, message: error.message }
    // Only the error's name: never the data being encrypted
    console.error('createDraw failed:', error instanceof Error ? error.message : 'unknown error')
    return { ok: false, message: 'Sorteggio non riuscito: controlla che DRAW_SECRET sia impostato.' }
  }
}

const IdSchema = z.object({ id: z.uuid() })
const StatusSchema = IdSchema.extend({ status: z.enum(['open', 'archived']) })
const notFound: ActionResult = { ok: false, message: 'Sorteggio non trovato.' }

export async function saveDrawStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = StatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return notFound
  if (!(await setDrawStatus(parsed.data.id, parsed.data.status))) return notFound
  return done(parsed.data.status === 'archived' ? 'Archiviato: i capi non lo vedono più.' : 'Riaperto: i capi lo vedono di nuovo.')
}

export async function deleteDraw(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = IdSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success || !(await removeDraw(parsed.data.id))) return notFound
  return done('Sorteggio eliminato.')
}
