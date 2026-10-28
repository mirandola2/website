'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { and, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { deleteStaffPhoto } from '@/lib/imagekit-server'
import { replaceStaffPhoto } from '@/lib/staff-photo'
import { media, scoutYear, staffMember, totem } from '@/db/schema'
import { parseScoutYear } from '@/lib/scout-year'
import type { ActionResult } from '@/components/tabu/types'

// Every action re-checks the admin flag: the pages hiding the forms is not enough.

function done(tag: 'staff' | 'media' | 'totem', message: string): ActionResult {
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
const optionalInt = z
  .string()
  .trim()
  .transform(v => (v === '' ? null : Number(v)))
  .refine(v => v === null || Number.isInteger(v), 'Numero non valido.')
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
    order: optionalInt,
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
  await db.insert(staffMember).values({ ...values, slug })
  return done('staff', `Aggiunto ${values.nome}.`)
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

const YearSchema = z.object({
  id: z.string().refine(v => parseScoutYear(v) !== null, 'Anno non valido.'),
  question: requiredText(200, 'Domanda'),
  visible: z.literal('on').optional(),
  active: z.literal('on').optional(),
})

// Per year: the template's variable question, whether it is listed and whether it is still editable
export async function saveYearSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = YearSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error)
  const { id, question } = parsed.data
  const active = !!parsed.data.active
  // An editable year must be reachable
  const visible = active || !!parsed.data.visible
  await db
    .insert(scoutYear)
    .values({ id, question, visible, active })
    .onConflictDoUpdate({ target: scoutYear.id, set: { question, visible, active } })
  revalidatePath('/tabu', 'layout')
  return { ok: true, message: 'Salvato.' }
}
