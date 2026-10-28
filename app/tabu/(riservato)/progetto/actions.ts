'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireLeader } from '@/lib/dal'
import { parseScoutYear } from '@/lib/scout-year'
import { yearProject } from '@/db/schema'
import type { ActionResult } from '@/components/tabu/types'

// Browsers submit textarea newlines as \r\n
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Massimo ${max} caratteri.`)
    .transform(v => v.replace(/\r\n?/g, '\n'))

const ProjectSchema = z.object({
  scoutYear: z.string().refine(v => parseScoutYear(v) !== null, 'Anno non valido.'),
  titolo: text(200),
  obiettivi: text(5000),
  tappe: text(5000),
  verifica: text(5000),
})

// The owner always comes from the session: a form can't write someone else's project
export async function saveYearProject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const leader = await requireLeader()
  const parsed = ProjectSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  const { scoutYear, ...fields } = parsed.data
  const updatedAt = new Date()
  await db
    .insert(yearProject)
    .values({ staffMemberId: leader.id, scoutYear, ...fields, updatedAt })
    .onConflictDoUpdate({
      target: [yearProject.staffMemberId, yearProject.scoutYear],
      set: { ...fields, updatedAt },
    })

  revalidatePath('/tabu', 'layout')
  return { ok: true, message: 'Progetto salvato.' }
}
