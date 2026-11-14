'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/dal'
import { createPesca as drawPesca, deletePesca as removePesca, PescaError, setPescaStatus } from '@/lib/pesca'
import type { ActionResult } from '@/components/tabu/types'

// Every action re-checks the admin flag. None of them ever returns who drew whom: not even the
// admin who starts a pesca learns it.

function done(message: string): ActionResult {
  // The navbar and the Bacheca show the Pesca only to whoever has an open one
  revalidatePath('/tabu', 'layout')
  return { ok: true, message }
}

const CreateSchema = z.object({
  title: z.string().trim().min(1, 'Titolo obbligatorio.').max(100, 'Titolo troppo lungo.'),
  participants: z.array(z.string().trim().min(1).max(100)).max(500),
})

export async function createPesca(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = CreateSchema.safeParse({ title: formData.get('title') ?? '', participants: formData.getAll('participants') })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  try {
    const n = await drawPesca(admin.memberCode, parsed.data.title, parsed.data.participants)
    return done(`Pesca fatta: ${n} partecipanti. Ognuno vede il proprio abbinamento nel Tabù, alla voce Pesca.`)
  } catch (error) {
    if (error instanceof PescaError) return { ok: false, message: error.message }
    // Only the error's name: never the data being encrypted
    console.error('createPesca failed:', error instanceof Error ? error.message : 'unknown error')
    return { ok: false, message: 'Pesca non riuscita: controlla che PESCA_SECRET sia impostato.' }
  }
}

const IdSchema = z.object({ id: z.uuid() })
const StatusSchema = IdSchema.extend({ status: z.enum(['open', 'archived']) })
const notFound: ActionResult = { ok: false, message: 'Pesca non trovata.' }

export async function savePescaStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = StatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return notFound
  if (!(await setPescaStatus(parsed.data.id, parsed.data.status))) return notFound
  return done(parsed.data.status === 'archived' ? 'Archiviata: i capi non la vedono più.' : 'Riaperta: i capi la vedono di nuovo.')
}

export async function deletePesca(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = IdSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success || !(await removePesca(parsed.data.id))) return notFound
  return done('Pesca eliminata.')
}
