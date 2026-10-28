'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireLeader } from '@/lib/dal'
import { parseScoutYear } from '@/lib/scout-year'
import { CHECKPOINTS, MAX_ANSWER, MAX_TEXT, PROJECT_SECTIONS, type ProjectSections } from '@/lib/project'
import { yearProject } from '@/db/schema'
import type { ActionResult } from '@/components/tabu/types'

// Browsers submit textarea newlines as \r\n
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Massimo ${max} caratteri.`)
    .transform(v => v.replace(/\r\n?/g, '\n'))
const score = z.coerce.number().int().min(0).max(5)

const SectionSchema = z.object({
  obiettivi: text(MAX_TEXT),
  strumenti: text(MAX_TEXT),
  risposta: text(MAX_ANSWER),
  inizio: score,
  meta: score,
  fine: score,
})

// Form fields are named "<section>.<field>" (servizio.obiettivi, fede.fine...)
function readSections(formData: FormData) {
  return Object.fromEntries(
    PROJECT_SECTIONS.map(({ key }) => [
      key,
      Object.fromEntries(
        ['obiettivi', 'strumenti', 'risposta', ...CHECKPOINTS.map(c => c.key)].map(f => [f, formData.get(`${key}.${f}`) ?? '']),
      ),
    ]),
  )
}

const ProjectSchema = z.object({
  scoutYear: z.string().refine(v => parseScoutYear(v) !== null, 'Anno non valido.'),
  sections: z.object(Object.fromEntries(PROJECT_SECTIONS.map(s => [s.key, SectionSchema]))),
})

// The owner always comes from the session: a form can't write someone else's project
export async function saveYearProject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const leader = await requireLeader()
  const parsed = ProjectSchema.safeParse({ scoutYear: formData.get('scoutYear'), sections: readSections(formData) })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  const sections = parsed.data.sections as ProjectSections
  const updatedAt = new Date()
  await db
    .insert(yearProject)
    .values({ staffMemberId: leader.id, scoutYear: parsed.data.scoutYear, sections, updatedAt })
    .onConflictDoUpdate({
      target: [yearProject.staffMemberId, yearProject.scoutYear],
      set: { sections, updatedAt },
    })

  revalidatePath('/tabu', 'layout')
  return { ok: true, message: 'Progetto salvato.' }
}
