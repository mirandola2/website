'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { and, count, eq, isNotNull, isNull, max, ne, notInArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { formatBirthday, normalizeName, slugify } from '@/lib/format'
import { isPlaceholderCode, placeholderCode } from '@/lib/member-code'
import { replaceStaffPhoto } from '@/lib/staff-photo'
import { optionalText } from '@/lib/validation'
import { parseMembersCsv } from '@/lib/members-csv'
import { link, media, member, scoutYear, staffMember, totem, yearProject } from '@/db/schema'
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
const notFound: ActionResult = { ok: false, message: 'Riga non trovata.' }

const requiredText = (max: number, label: string) => z.string().trim().min(1, `${label} obbligatorio.`).max(max)
const id = z.coerce.number().int().positive()
// Rendered as public links: only http(s) to a real domain (no javascript:, data:, ...)
const webUrl = z.url({ protocol: /^https?$/, hostname: z.regexes.domain, error: 'Link non valido: deve iniziare con https://.' }).max(2000)

// The row id of a form: a malformed one gives null (then "Riga non trovata."), never an exception
function formId(formData: FormData) {
  const parsed = id.safeParse(formData.get('id'))
  return parsed.success ? parsed.data : null
}

// --- Staff ---

// Rows are identified by their member code (the hidden `id` field of the forms)
const memberCodeField = z.string().trim().min(1).max(100)
function formCode(formData: FormData) {
  const parsed = memberCodeField.safeParse(formData.get('id'))
  return parsed.success ? parsed.data : null
}

const StaffSchema = z
  .object({
    id: z.string().optional(),
    // Empty when adding: found from the name, or a placeholder (lib/member-code.ts)
    memberCode: z.string().trim().max(100),
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
  // A real code is digits only; a placeholder can only be kept, never typed
  .refine(v => !v.memberCode || /^\d{1,10}$/.test(v.memberCode) || v.memberCode === v.id, {
    message: 'Codice socio: solo cifre.',
  })

// Why `code` can't become the code of a staff row (null if it can). `deletedOwner` is set when the
// code belongs to a removed row, which adding the same person restores.
async function checkMemberCode(code: string) {
  const [socio] = await db.select({ code: member.memberCode }).from(member).where(eq(member.memberCode, code))
  if (!socio) return { error: `Il codice socio ${code} non è tra i soci: aggiorna prima l’elenco in Codici socio.` }
  const [owner] = await db
    .select({ nome: staffMember.nome, deletedAt: staffMember.deletedAt })
    .from(staffMember)
    .where(eq(staffMember.memberCode, code))
  if (owner && !owner.deletedAt) return { error: `Il codice socio ${code} è già di ${owner.nome}.` }
  return { error: null, deleted: !!owner }
}

// The code of a new row without one: the only member with exactly that name and not already in
// the staff; with homonyms the admin must choose; with none, a placeholder
async function codeFromName(nome: string, slug: string): Promise<{ code: string } | { error: string }> {
  const candidates = await db
    .select({ code: member.memberCode, birthday: member.birthday })
    .from(member)
    .where(and(sql`lower(${member.fullName}) = lower(${normalizeName(nome)})`, isNotNull(member.birthday)))
  if (candidates.length > 1) {
    const list = candidates.map(c => `${c.code} (nato/a il ${formatBirthday(c.birthday!)})`).join(', ')
    return { error: `Ci sono più soci di nome ${nome}: ${list}. Scrivi il codice socio giusto.` }
  }
  if (candidates.length === 1) return { code: candidates[0].code }
  return { code: placeholderCode(slug) }
}

export async function saveStaffMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = StaffSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error)
  const { id: currentCode, memberCode: requested, coca, isAdmin, ...fields } = parsed.data
  const values = { ...fields, coca: !!coca, isAdmin: !!coca && !!isAdmin }

  if (currentCode === admin.memberCode && (!values.isAdmin || values.email !== admin.email)) {
    return { ok: false, message: 'Non puoi togliere a te stesso l’accesso admin: chiedi a un altro admin.' }
  }
  if (values.email) {
    const [taken] = await db
      .select({ nome: staffMember.nome })
      .from(staffMember)
      .where(and(eq(staffMember.email, values.email), currentCode ? ne(staffMember.memberCode, currentCode) : undefined))
    if (taken) return { ok: false, message: `Email già usata da ${taken.nome}.` }
  }

  // Edit: a new code moves the row and its projects (ON UPDATE CASCADE)
  if (currentCode) {
    const code = requested || currentCode
    if (code !== currentCode) {
      const check = await checkMemberCode(code)
      if (check.error) return { ok: false, message: check.error }
      if (check.deleted) return { ok: false, message: `Il codice socio ${code} è di una persona eliminata dallo staff.` }
    }
    const updated = await db.transaction(async tx => {
      const rows = await tx
        .update(staffMember)
        .set({ ...values, memberCode: code })
        .where(and(eq(staffMember.memberCode, currentCode), isNull(staffMember.deletedAt)))
        .returning({ code: staffMember.memberCode })
      // The placeholder is no longer anyone's
      if (rows.length && code !== currentCode && isPlaceholderCode(currentCode)) {
        await tx.delete(member).where(eq(member.memberCode, currentCode))
      }
      return rows.length
    })
    return updated ? done('staff', 'Salvato.') : notFound
  }

  let slug = slugify(values.nome)
  const base = slug
  for (let i = 2; (await db.select({ slug: staffMember.slug }).from(staffMember).where(eq(staffMember.slug, slug))).length; i++) {
    slug = `${base}-${i}`
  }
  const resolved = requested ? { code: requested } : await codeFromName(values.nome, slug)
  if ('error' in resolved) return { ok: false, message: resolved.error }
  const code = resolved.code
  const placeholder = isPlaceholderCode(code)
  const check = placeholder ? { error: null, deleted: false } : await checkMemberCode(code)
  if (check.error) return { ok: false, message: check.error }

  // New rows go last
  const [{ last }] = await db.select({ last: max(staffMember.position) }).from(staffMember)
  const position = (last ?? 0) + 1
  // Someone removed and added again: same row, so their projects are theirs again
  if (check.deleted) {
    await db
      .update(staffMember)
      .set({ ...values, position, order: null, deletedAt: null })
      .where(eq(staffMember.memberCode, code))
    return done('staff', `${values.nome} è di nuovo nello staff, con i suoi progetti.`)
  }
  await db.transaction(async tx => {
    if (placeholder) await tx.insert(member).values({ memberCode: code, fullName: values.nome, birthday: null })
    await tx.insert(staffMember).values({ ...values, memberCode: code, slug, position })
  })
  return done(
    'staff',
    placeholder ? `Aggiunto ${values.nome}, senza codice socio: aggiungilo quando ce l’ha.` : `Aggiunto ${values.nome} (codice socio ${code}).`,
  )
}

const OrderSchema = z.array(memberCodeField).min(1)

// Drag and drop in /tabu/admin/staff: the main order (every row) or the Coca page one (leaders)
export async function saveStaffOrder(kind: 'main' | 'coca', codes: string[]): Promise<ActionResult> {
  await requireAdmin()
  if (kind !== 'main' && kind !== 'coca') return { ok: false, message: 'Ordine non valido.' }
  const parsed = OrderSchema.safeParse(codes)
  if (!parsed.success) return fail(parsed.error)
  const column = kind === 'main' ? 'position' : 'order'
  await db.transaction(async tx => {
    for (const [i, code] of parsed.data.entries()) {
      await tx.update(staffMember).set({ [column]: i + 1 }).where(eq(staffMember.memberCode, code))
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

// Never a real delete: the row keeps its Progetti del Capo (and the database refuses to delete a
// row that has any). It disappears from the site and the Tabù, and can't log in any more. Adding
// the same member code again restores it.
export async function deleteStaffMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin()
  const code = formCode(formData)
  if (code === admin.memberCode) return { ok: false, message: 'Non puoi eliminare te stesso.' }
  const [row] = code
    ? await db
        .update(staffMember)
        .set({ deletedAt: new Date(), email: null, isAdmin: false, order: null })
        .where(and(eq(staffMember.memberCode, code), isNull(staffMember.deletedAt)))
        .returning({ nome: staffMember.nome })
    : []
  return row ? done('staff', `Eliminato ${row.nome}. I suoi progetti restano.`) : notFound
}

// Any row's photo, RS included
export async function uploadStaffPhotoAdmin(formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const code = formCode(formData)
  const [row] = code
    ? await db
        .select()
        .from(staffMember)
        .where(and(eq(staffMember.memberCode, code), isNull(staffMember.deletedAt)))
    : []
  return row ? replaceStaffPhoto(row, formData.get('photo')) : notFound
}

// --- Media, materials and links, totem: the same add / edit / delete on three tables ---

const crudTables = { media, links: link, totem }
type CrudTag = keyof typeof crudTables

// Each schema matches its own table; the three share an integer `id` and a `name`
async function saveRow<T extends { id?: string; name: string }>(tag: CrudTag, schema: z.ZodType<T>, formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error)
  const { id: rawId, ...values } = parsed.data
  const table = crudTables[tag] as typeof media
  if (rawId) {
    const rows = await db
      .update(table)
      .set(values as Partial<typeof media.$inferInsert>)
      .where(eq(table.id, Number(rawId)))
      .returning({ id: table.id })
    return rows.length ? done(tag, 'Salvato.') : notFound
  }
  await db.insert(table).values(values as unknown as typeof media.$inferInsert)
  return done(tag, `Aggiunto “${values.name}”.`)
}

async function deleteRow(tag: CrudTag, formData: FormData) {
  const table = crudTables[tag] as typeof media
  const rowId = formId(formData)
  const [row] = rowId ? await db.delete(table).where(eq(table.id, rowId)).returning({ name: table.name }) : []
  return row ? done(tag, `Eliminato “${row.name}”.`) : notFound
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
  url: webUrl,
  sortOrder: z.coerce.number().int(),
})

export async function saveMedia(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  return saveRow('media', MediaSchema, formData)
}

export async function deleteMedia(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  return deleteRow('media', formData)
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
  const rows = await db.select({ id: media.id, url: media.url }).from(media).where(sql`instr(${media.url}, ${find}) > 0`)
  const updated = rows.map(r => ({ id: r.id, url: r.url.replaceAll(find, replace) }))
  // Every new link must still be valid: nothing is saved otherwise
  const invalid = updated.find(r => !webUrl.safeParse(r.url).success)
  if (invalid) return { ok: false, message: `Il risultato non sarebbe un link valido: ${invalid.url}` }
  await db.transaction(async tx => {
    for (const r of updated) await tx.update(media).set({ url: r.url }).where(eq(media.id, r.id))
  })
  return done('media', `Link aggiornati: ${updated.length}.`)
}

// --- Materials and links ---

const LinkSchema = z.object({
  id: z.string().optional(),
  category: requiredText(100, 'Categoria'),
  type: z.enum(['link', 'document', 'video', 'book']),
  name: requiredText(200, 'Nome'),
  url: webUrl,
  sortOrder: z.coerce.number().int(),
})

export async function saveLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  return saveRow('links', LinkSchema, formData)
}

export async function deleteLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  return deleteRow('links', formData)
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
  return saveRow('totem', TotemSchema, formData)
}

export async function deleteTotem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  return deleteRow('totem', formData)
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
  const parsed = yearId.safeParse(formData.get('id'))
  if (!parsed.success) return fail(parsed.error)
  const id = parsed.data
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
  const parsedId = yearId.safeParse(formData.get('id'))
  if (!parsedId.success) return fail(parsedId.error)
  const id = parsedId.data
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

// --- Member codes and birthdays (Codice socio search, birthdays on the home page) ---

const MAX_CSV_BYTES = 1024 * 1024

// Adds or updates every row of the CSV by member code; with "replace", whoever is not in the file is
// deleted, except the members of the staff (their rows are the key of staff_member). One bad row
// and nothing is saved.
export async function importMembers(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Scegli un file CSV.' }
  if (file.size > MAX_CSV_BYTES) return { ok: false, message: 'Il file supera 1 MB.' }
  const parsed = parseMembersCsv(await file.text())
  if (!parsed.ok) return { ok: false, message: parsed.errors.join(' ') }
  const replace = formData.get('replace') === 'on'

  const [{ before }] = await db.select({ before: count() }).from(member)
  await db.transaction(async tx => {
    if (replace) await tx.delete(member).where(notInArray(member.memberCode, tx.select({ code: staffMember.memberCode }).from(staffMember)))
    // 3 values per row: well under SQLite's limit of variables per statement
    for (let i = 0; i < parsed.rows.length; i += 200) {
      await tx
        .insert(member)
        .values(parsed.rows.slice(i, i + 200))
        .onConflictDoUpdate({
          target: member.memberCode,
          set: { fullName: sql`excluded.full_name`, birthday: sql`excluded.birthday` },
        })
    }
  })
  const [{ after }] = await db.select({ after: count() }).from(member)

  // The birthdays route is cached for an hour
  revalidatePath('/api/birthdays')
  revalidatePath('/tabu', 'layout')
  const rows = parsed.rows.length
  const added = after - before
  // Staff members (placeholders included) that the file doesn't have
  const kept = after - rows
  return {
    ok: true,
    message: replace
      ? `Elenco sostituito: ${rows} soci dal file${kept ? `, più ${kept} dello staff che non ci sono (restano perché sono capi o RS)` : ''}.`
      : `${rows === 1 ? 'Importata 1 riga' : `Importate ${rows} righe`}: ${added === 1 ? '1 socio nuovo' : `${added} soci nuovi`}, ${after} in totale.`,
  }
}
