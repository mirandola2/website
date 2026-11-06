// Imports a CSV into the database, to rebuild it from scratch (README → Messa online).
//
//   npm run db:import-csv -- staff <file.csv>   upsert by member code, CSV order = position. Reads the export
//                                               of Admin → Staff: on existing rows the CSV columns are
//                                               overwritten and email/admin/imgFileId kept; new rows also take
//                                               the `email` and `admin` columns, when present. Without a
//                                               `memberCode` column the code comes from the name (homonyms
//                                               stop the import); import the members first
//   npm run db:import-csv -- media <file.csv>   replaces every media row (CSV order = sortOrder); columns
//                                               type,id,year,name,url
import fs from 'fs'
import Papa from 'papaparse'
import { sql } from 'drizzle-orm'
import { db } from './db.mjs'
import { media, member, staffMember } from '../db/schema'
import { normalizeName, slugify } from '../lib/format'
import { isPlaceholderCode, placeholderCode } from '../lib/member-code'

const [target, file] = process.argv.slice(2)

function readCsv(filePath: string) {
  // The admin exports start with a BOM (for Excel), which would end up in the first column's name
  return Papa.parse<Record<string, string>>(fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: true,
  }).data
}

const clean = (v: string | undefined) => v?.trim() || null

async function importStaff(filePath: string) {
  const rows = readCsv(filePath)
  const members = await db.select({ code: member.memberCode, fullName: member.fullName, birthday: member.birthday }).from(member)
  const known = new Set(members.map(m => m.code))
  const byName = Map.groupBy(
    members.filter(m => m.birthday),
    m => m.fullName.toLowerCase(),
  )
  const names = rows.map(r => normalizeName(r.nome ?? '').toLowerCase())
  // Existing rows keep their slug; new ones get a free one
  const existing = await db.select({ code: staffMember.memberCode, slug: staffMember.slug }).from(staffMember)
  const slugOf = new Map(existing.map(e => [e.code, e.slug]))
  const seen = new Set(existing.map(e => e.slug))
  const newSlug = (nome: string) => {
    let slug = slugify(nome)
    for (let i = 2; seen.has(slug); i++) slug = `${slugify(nome)}-${i}`
    seen.add(slug)
    return slug
  }

  const codes = new Set<string>()
  const errors: string[] = []
  const values = rows.map((r, i) => {
    // The key: the CSV's memberCode (the export has it), else the only member with that name
    // (when no other row has it too), else a placeholder
    let memberCode = clean(r.memberCode)
    if (!memberCode) {
      const candidates = byName.get(names[i]) ?? []
      if (candidates.length === 1 && names.filter(n => n === names[i]).length === 1) memberCode = candidates[0].code
      else if (candidates.length > 1) errors.push(`Row ${i + 2} (${r.nome}): homonyms ${candidates.map(c => `${c.code} (${c.birthday})`).join(', ')}, add the memberCode column`)
      // The placeholder of an existing row is X-<its slug>
      else memberCode = placeholderCode(slugify(r.nome))
    } else if (!isPlaceholderCode(memberCode) && !known.has(memberCode)) {
      errors.push(`Row ${i + 2} (${r.nome}): member code ${memberCode} is not in the member table (import the members first)`)
    }
    if (memberCode && codes.has(memberCode)) errors.push(`Row ${i + 2} (${r.nome}): member code ${memberCode} repeated`)
    if (memberCode) codes.add(memberCode)
    const order = clean(r.order)
    return {
      memberCode: memberCode ?? '',
      slug: (memberCode && slugOf.get(memberCode)) || newSlug(r.nome),
      nome: r.nome.trim(),
      nomeCaccia: clean(r.nomeCaccia),
      ruolo: r.ruolo?.trim() ?? '',
      staff: r.staff?.trim() ?? '',
      coca: r.coca?.trim() === '1',
      desc: clean(r.desc),
      img: clean(r.img),
      order: order === null ? null : Number(order),
      position: i + 1,
      email: clean(r.email)?.toLowerCase() ?? null,
      isAdmin: r.admin?.trim() === '1',
    }
  })
  if (errors.length) throw new Error(`Nothing imported:\n${errors.join('\n')}`)

  // Upsert by member code: homonyms keep their own row (and projects) whatever the CSV order
  await db.transaction(async tx => {
    for (const v of values) {
      if (isPlaceholderCode(v.memberCode)) {
        await tx.insert(member).values({ memberCode: v.memberCode, fullName: v.nome, birthday: null }).onConflictDoNothing()
      }
      await tx
        .insert(staffMember)
        .values(v)
        .onConflictDoUpdate({
          target: staffMember.memberCode,
          set: {
            nome: sql`excluded.nome`,
            nomeCaccia: sql`excluded.nome_caccia`,
            ruolo: sql`excluded.ruolo`,
            staff: sql`excluded.staff`,
            coca: sql`excluded.coca`,
            desc: sql`excluded.desc`,
            img: sql`excluded.img`,
            order: sql`excluded."order"`,
            position: sql`excluded.position`,
          },
        })
    }
  })
  const placeholders = values.filter(v => isPlaceholderCode(v.memberCode))
  console.log(`Upserted ${values.length} staff members (${values.filter(v => v.coca).length} leaders)`)
  if (placeholders.length) console.log(`Without a member code (placeholder): ${placeholders.map(v => v.nome).join(', ')}`)
}

async function importMedia(filePath: string) {
  const values = readCsv(filePath).map((r, i): typeof media.$inferInsert => {
    const type = r.type?.trim()
    if (type !== 'image' && type !== 'video') throw new Error(`Row ${i + 2}: unknown type "${type}"`)
    return {
      slug: r.id.trim(),
      type,
      year: Number(r.year),
      name: r.name.trim(),
      url: r.url.trim(),
      sortOrder: i,
    }
  })

  await db.transaction(async tx => {
    await tx.delete(media)
    await tx.insert(media).values(values)
  })
  console.log(`Replaced media with ${values.length} rows`)
}

if (!file || (target !== 'staff' && target !== 'media')) throw new Error('Usage: import-csv.mts staff|media <file.csv>')
if (target === 'staff') await importStaff(file)
else await importMedia(file)
