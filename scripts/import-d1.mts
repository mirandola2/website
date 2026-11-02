// Copies `totem` and `data` (→ `member`) from a D1 SQL dump into the database, replacing their rows.
//
//   wrangler d1 export people --remote --output=d1.sql   (in BackendMirandola2)
//   npm run db:import-d1 -- path/to/d1.sql
//
// The dump is loaded into an in-memory SQLite first, so no SQL parsing is needed here.
import fs from 'fs'
import { createClient } from '@libsql/client'
import { db } from './db.mjs'
import { member, totem } from '../db/schema'

const dumpPath = process.argv[2]
if (!dumpPath) throw new Error('Usage: import-d1.mts <d1 dump .sql>')

const source = createClient({ url: ':memory:' })
// A dump made with `sqlite3 .dump` wraps everything in a transaction, which executeMultiple runs as is
await source.executeMultiple(fs.readFileSync(dumpPath, 'utf-8'))

const totemRows = (await source.execute('SELECT id, name, location, totem, year FROM totem ORDER BY id')).rows
const memberRows = (await source.execute('SELECT member_code, full_name, birthday FROM data')).rows

const str = (v: unknown) => String(v ?? '').trim()

await db.transaction(async tx => {
  await tx.delete(totem)
  await tx.delete(member)
  if (totemRows.length) {
    await tx.insert(totem).values(
      totemRows.map(r => ({
        id: Number(r.id),
        name: str(r.name),
        location: str(r.location),
        totem: str(r.totem),
        year: str(r.year),
      })),
    )
  }
  if (memberRows.length) {
    await tx.insert(member).values(
      memberRows.map(r => ({
        memberCode: str(r.member_code),
        // Collapse double spaces ("Angelo  Milioto"): the search matches the whole name
        fullName: str(r.full_name).replace(/\s+/g, ' '),
        birthday: str(r.birthday),
      })),
    )
  }
})

console.log(`Imported ${totemRows.length} totem, ${memberRows.length} members`)
