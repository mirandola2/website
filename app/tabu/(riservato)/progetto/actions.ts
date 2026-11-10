'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireLeader } from '@/lib/dal'
import { getYearSetting } from '@/lib/tabu'
import { MAX_TEXT, type ProjectAnswers, type ProjectTemplate } from '@/lib/project'
import { text } from '@/lib/validation'
import { yearProject } from '@/db/schema'
import type { ActionResult } from '@/components/tabu/types'

const score = z.coerce.number().int().min(0).max(5)

// One field per area and question, named "<area>.<question>"
function answersSchema(template: ProjectTemplate) {
  const question = z.object(
    Object.fromEntries(template.questions.map(q => [q.id, q.kind === 'score' ? score : text(MAX_TEXT[q.kind])])),
  )
  return z.object(Object.fromEntries(template.areas.map(a => [a.id, question])))
}

function readAnswers(template: ProjectTemplate, formData: FormData) {
  return Object.fromEntries(
    template.areas.map(a => [a.id, Object.fromEntries(template.questions.map(q => [q.id, formData.get(`${a.id}.${q.id}`) ?? '']))]),
  )
}

// The owner always comes from the session: a form can't write someone else's project
export async function saveYearProject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const leader = await requireLeader()
  const year = await getYearSetting(String(formData.get('scoutYear')))
  if (!year) return { ok: false, message: 'Anno non valido.' }
  // Closed years (set in /tabu/admin/progetti) are read-only
  if (!year.active) return { ok: false, message: 'Questo anno è chiuso: il progetto non si può più modificare.' }
  const parsed = answersSchema(year.template).safeParse(readAnswers(year.template, formData))
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  const sections = parsed.data as ProjectAnswers
  // The "Bozza" toggle: a checkbox, sent only when on
  const draft = formData.get('draft') === 'on'
  const updatedAt = new Date()
  await db
    .insert(yearProject)
    .values({ memberCode: leader.memberCode, scoutYear: year.id, sections, draft, updatedAt })
    .onConflictDoUpdate({
      target: [yearProject.memberCode, yearProject.scoutYear],
      set: { sections, draft, updatedAt },
    })

  revalidatePath('/tabu', 'layout')
  return { ok: true, message: draft ? 'Bozza salvata.' : 'Progetto salvato.' }
}

