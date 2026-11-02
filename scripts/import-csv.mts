// Imports a CSV into the database, to rebuild it from scratch (README → Messa online).
//
//   npm run db:import-csv -- staff <file.csv>   upsert by slug (from `nome`), CSV order = position. Reads the
//                                               export of Admin → Staff: on existing rows the CSV columns are
//                                               overwritten and email/admin/imgFileId kept; new rows also take
//                                               the `email` and `admin` columns, when present
//   npm run db:import-csv -- media <file.csv>   replaces every media row (CSV order = sortOrder); columns
//                                               type,id,year,name,url
import fs from 'fs'
import Papa from 'papaparse'
import { sql } from 'drizzle-orm'
import { db } from './db.mjs'
import { media, staffMember } from '../db/schema'
import { slugify } from '../lib/format'

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
  const seen = new Set<string>()
  const values = rows.map((r, i) => {
    let slug = slugify(r.nome)
    for (let i = 2; seen.has(slug); i++) slug = `${slugify(r.nome)}-${i}`
    seen.add(slug)
    const order = clean(r.order)
    return {
      slug,
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

  // One statement per row keeps the CSV order in the autoincrement ids
  for (const v of values) {
    await db
      .insert(staffMember)
      .values(v)
      .onConflictDoUpdate({
        target: staffMember.slug,
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
  console.log(`Upserted ${values.length} staff members (${values.filter(v => v.coca).length} leaders)`)
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
