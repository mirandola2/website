'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { and, count, eq, max, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { deleteStaffPhoto } from '@/lib/imagekit-server'
import { replaceStaffPhoto } from '@/lib/staff-photo'
import { link, media, scoutYear, staffMember, totem, yearProject } from '@/db/schema'
import { parseScoutYear } from '@/lib/scout-year'
import { MAX_AREAS, MAX_QUESTIONS, normalizeAnswers, normalizeTemplate, QUESTION_KINDS } from '@/lib/project'
import type { ActionResult } from '@/components/tabu/types'

// Every action re-checks the admin flag: the pages hiding the forms is not enough.

function done(tag: 'staff' | 'media' | 'links' | 'totem', message: string): ActionResult {
  revalidateTag(tag, 'max')
  revalidatePath('/tabu', 'layout')
  return { ok: true, message }
}

const fail = (error: z.ZodError): ActionResult => ({ ok: false, message: error.issues[0].message })

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Massimo ${max} caratteri.`)
    .transform(v => v.replace(/\r\n?/g, '\n') || null)
const requiredText = (max: number, label: string) => z.string().trim().min(1, `${label} obbligatorio.`).max(max)
const id = z.coerce.number().int().positive()

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// --- Staff ---

const StaffSchema = z
  .object({
    id: z.string().optional(),
    nome: requiredText(100, 'Nome'),
    nomeCaccia: optionalText(100),
    ruolo: z.string().trim().max(200),
    staff: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^([A-Z]+)(\|[A-Z]+)*$/, 'Staff: codici separati da | (es. E|CJ).'),
    coca: z.literal('on').optional(),
    desc: optionalText(600),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .transform(v => v || null)
      .pipe(z.email('Email non valida.').nullable()),
    isAdmin: z.literal('on').optional(),
  })
  .refine(v => v.coca || !v.email, { message: 'Un RS in servizio (non in Co.Ca.) non può avere un’email di accesso.' })

export async function saveStaffMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = StaffSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error)
  const { id: rawId, coca, isAdmin, ...fields } = parsed.data
  const values = { ...fields, coca: !!coca, isAdmin: !!coca && !!isAdmin }
  const rowId = rawId ? Number(rawId) : null

  if (rowId === admin.id && (!values.isAdmin || values.email !== admin.email)) {
    return { ok: false, message: 'Non puoi togliere a te stesso l’accesso admin: chiedi a un altro admin.' }
  }
  if (values.email) {
    const [taken] = await db
      .select({ nome: staffMember.nome })
      .from(staffMember)
      .where(and(eq(staffMember.email, values.email), rowId ? ne(staffMember.id, rowId) : undefined))
    if (taken) return { ok: false, message: `Email già usata da ${taken.nome}.` }
  }

  if (rowId) {
    await db.update(staffMember).set(values).where(eq(staffMember.id, rowId))
    return done('staff', 'Salvato.')
  }
  let slug = slugify(values.nome)
  const base = slug
  for (let i = 2; (await db.select({ id: staffMember.id }).from(staffMember).where(eq(staffMember.slug, slug))).length; i++) {
    slug = `${base}-${i}`
  }
  // New rows go last
  const [{ last }] = await db.select({ last: max(staffMember.position) }).from(staffMember)
  await db.insert(staffMember).values({ ...values, slug, position: (last ?? 0) + 1 })
  return done('staff', `Aggiunto ${values.nome}.`)
}

const OrderSchema = z.array(id).min(1)

// Drag and drop in /tabu/admin/staff: the main order (every row) or the Coca page one (leaders)
export async function saveStaffOrder(kind: 'main' | 'coca', ids: number[]): Promise<ActionResult> {
  await requireAdmin()
  const parsed = OrderSchema.safeParse(ids)
  if (!parsed.success) return fail(parsed.error)
  const column = kind === 'main' ? 'position' : 'order'
  await db.transaction(async tx => {
    for (const [i, rowId] of parsed.data.entries()) {
      await tx.update(staffMember).set({ [column]: i + 1 }).where(eq(staffMember.id, rowId))
    }
  })
  return done('staff', 'Ordine salvato.')
}

// The Coca page goes back to the main order
export async function resetCocaOrder(): Promise<ActionResult> {
  await requireAdmin()
  await db.update(staffMember).set({ order: null })
  return done('staff', 'La pagina Co.Ca. usa di nuovo l’ordine principale.')
}

export async function deleteStaffMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const rowId = id.parse(formData.get('id'))
  if (rowId === admin.id) return { ok: false, message: 'Non puoi eliminare te stesso.' }
  const [row] = await db.delete(staffMember).where(eq(staffMember.id, rowId)).returning()
  if (!row) return { ok: false, message: 'Riga non trovata.' }
  await deleteStaffPhoto(row.imgFileId)
  return done('staff', `Eliminato ${row.nome}.`)
}

// Any row's photo, RS included
export async function uploadStaffPhotoAdmin(formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const [row] = await db.select().from(staffMember).where(eq(staffMember.id, id.parse(formData.get('id'))))
  if (!row) return { ok: false, message: 'Riga non trovata.' }
  return replaceStaffPhoto(row, formData.get('photo'))
}

// --- Media ---

const MediaSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Id: solo lettere minuscole, numeri e trattini.'),
  type: z.enum(['image', 'video']),
  year: z.coerce.number().int().min(1950).max(2100),
  name: requiredText(200, 'Nome'),
  url: z.url('Link non valido.').max(2000),
  sortOrder: z.coerce.number().int(),
})

export async function saveMedia(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = MediaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error)
  const { id: rawId, ...values } = parsed.data
  if (rawId) {
    await db.update(media).set(values).where(eq(media.id, Number(rawId)))
    return done('media', 'Salvato.')
  }
  await db.insert(media).values(values)
  return done('media', `Aggiunto “${values.name}”.`)
}

export async function deleteMedia(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const [row] = await db.delete(media).where(eq(media.id, id.parse(formData.get('id')))).returning()
  return row ? done('media', `Eliminato “${row.name}”.`) : { ok: false, message: 'Riga non trovata.' }
}

const ReplaceSchema = z.object({
  find: z.string().min(3, 'Testo da cercare: almeno 3 caratteri.').max(500),
  replace: z.string().max(500),
})

// Bulk edit for the SharePoint → Google Drive move: replaces a piece of text in every link
export async function replaceMediaUrls(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = ReplaceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error)
  const { find, replace } = parsed.data
  const rows = await db
    .update(media)
    .set({ url: sql`replace(${media.url}, ${find}, ${replace})` })
    .where(sql`instr(${media.url}, ${find}) > 0`)
    .returning({ id: media.id })
  return done('media', `Link aggiornati: ${rows.length}.`)
}

// --- Materials and links ---

const LinkSchema = z.object({
  id: z.string().optional(),
  category: requiredText(100, 'Categoria'),
  type: z.enum(['link', 'document', 'video', 'book']),
  name: requiredText(200, 'Nome'),
  url: z.url('Link non valido.').max(2000),
  sortOrder: z.coerce.number().int(),
})

export async function saveLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = LinkSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error)
  const { id: rawId, ...values } = parsed.data
  if (rawId) {
    await db.update(link).set(values).where(eq(link.id, Number(rawId)))
    return done('links', 'Salvato.')
  }
  await db.insert(link).values(values)
  return done('links', `Aggiunto “${values.name}”.`)
}

export async function deleteLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const [row] = await db.delete(link).where(eq(link.id, id.parse(formData.get('id')))).returning()
  return row ? done('links', `Eliminato “${row.name}”.`) : { ok: false, message: 'Riga non trovata.' }
}

// --- Totem ---

const TotemSchema = z.object({
  id: z.string().optional(),
  name: requiredText(100, 'Nome'),
  totem: requiredText(100, 'Totem'),
  location: requiredText(200, 'Luogo'),
  year: z.string().trim().regex(/^\d{4}$/, 'Anno: 4 cifre.'),
})

export async function saveTotem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = TotemSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error)
  const { id: rawId, ...values } = parsed.data
  if (rawId) {
    await db.update(totem).set(values).where(eq(totem.id, Number(rawId)))
    return done('totem', 'Salvato.')
  }
  await db.insert(totem).values(values)
  return done('totem', `Aggiunto ${values.name}.`)
}

export async function deleteTotem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const [row] = await db.delete(totem).where(eq(totem.id, id.parse(formData.get('id')))).returning()
  return row ? done('totem', `Eliminato ${row.name}.`) : { ok: false, message: 'Riga non trovata.' }
}

// --- Progetto del Capo: scout years ---

const yearId = z.string().refine(v => parseScoutYear(v) !== null, 'Anno non valido.')

const YearSchema = z.object({
  id: yearId,
  visible: z.literal('on').optional(),
  active: z.literal('on').optional(),
})

// Per year: whether it is listed and whether it is still editable
export async function saveYearSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = YearSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error)
  const active = !!parsed.data.active
  // An editable year must be reachable
  const visible = active || !!parsed.data.visible
  const rows = await db.update(scoutYear).set({ visible, active }).where(eq(scoutYear.id, parsed.data.id)).returning()
  if (!rows.length) return { ok: false, message: 'Anno non trovato.' }
  revalidatePath('/tabu', 'layout')
  return { ok: true, message: 'Salvato.' }
}

const AddYearSchema = z.object({ id: yearId, copyFrom: z.string() })

// A new year starts hidden, with the template of an existing year (or the paper one)
export async function addYear(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = AddYearSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error)
  const { id, copyFrom } = parsed.data
  const [source] = await db.select({ template: scoutYear.template }).from(scoutYear).where(eq(scoutYear.id, copyFrom))
  const [added] = await db
    .insert(scoutYear)
    .values({ id, template: normalizeTemplate(source?.template), visible: false, active: false })
    .onConflictDoNothing()
    .returning()
  if (!added) return { ok: false, message: `L’anno ${id} c’è già.` }
  revalidatePath('/tabu', 'layout')
  return { ok: true, message: `Aggiunto il ${id}.` }
}

// Only a year without projects: the projects reference it
export async function deleteYear(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const id = yearId.parse(formData.get('id'))
  const [{ n }] = await db.select({ n: count() }).from(yearProject).where(eq(yearProject.scoutYear, id))
  if (n) return { ok: false, message: 'Questo anno ha dei progetti: non si può eliminare.' }
  await db.delete(scoutYear).where(eq(scoutYear.id, id))
  revalidatePath('/tabu', 'layout')
  return { ok: true, message: `Eliminato il ${id}.` }
}

const templateId = z.string().regex(/^[a-z0-9-]{1,40}$/, 'Id non valido.')
const TemplateSchema = z
  .object({
    areas: z
      .array(z.object({ id: templateId, title: requiredText(100, 'Titolo dell’area'), subtitle: z.string().trim().max(300) }))
      .min(1, 'Serve almeno un’area.')
      .max(MAX_AREAS, `Al massimo ${MAX_AREAS} aree.`),
    questions: z
      .array(
        z.object({
          id: templateId,
          label: requiredText(200, 'Testo della domanda'),
          kind: z.enum(QUESTION_KINDS.map(k => k.value)),
        }),
      )
      .min(1, 'Serve almeno una domanda.')
      .max(MAX_QUESTIONS, `Al massimo ${MAX_QUESTIONS} domande.`),
  })
  .refine(t => new Set(t.areas.map(a => a.id)).size === t.areas.length, 'Aree duplicate.')
  .refine(t => new Set(t.questions.map(q => q.id)).size === t.questions.length, 'Domande duplicate.')

// The year's areas and questions. Applies in cascade to the projects already written: answers
// follow their area and question (also when renamed), those of removed ones are deleted.
export async function saveYearTemplate(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const id = yearId.parse(formData.get('id'))
  let json: unknown
  try {
    json = JSON.parse(String(formData.get('template')))
  } catch {
    return { ok: false, message: 'Modello non valido.' }
  }
  const parsed = TemplateSchema.safeParse(json)
  if (!parsed.success) return fail(parsed.error)
  const template = parsed.data

  const updated = await db.transaction(async tx => {
    const rows = await tx.update(scoutYear).set({ template }).where(eq(scoutYear.id, id)).returning()
    if (!rows.length) return null
    const projects = await tx.select().from(yearProject).where(eq(yearProject.scoutYear, id))
    for (const p of projects) {
      await tx
        .update(yearProject)
        .set({ sections: normalizeAnswers(template, p.sections) })
        .where(eq(yearProject.id, p.id))
    }
    return projects.length
  })
  if (updated === null) return { ok: false, message: 'Anno non trovato.' }
  revalidatePath('/tabu', 'layout')
  return { ok: true, message: updated ? `Modello salvato e applicato a ${updated === 1 ? 'un progetto' : `${updated} progetti`}.` : 'Modello salvato.' }
}
