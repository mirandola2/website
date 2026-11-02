// Gives a leader their Tabù login email (and optionally the admin flag). Needed once to create the
// first admin; after that, emails are managed from /tabu/admin/staff.
//
//   npm run db:set-leader -- <slug> <email> [--admin]
//   npm run db:set-leader                       (lists the slugs)
import { eq } from 'drizzle-orm'
import { db } from './db.mjs'
import { staffMember } from '../db/schema'

const [slug, email] = process.argv.slice(2).filter(a => !a.startsWith('--'))
const admin = process.argv.includes('--admin')

if (!slug || !email) {
  const rows = await db.select({ slug: staffMember.slug, coca: staffMember.coca, email: staffMember.email }).from(staffMember)
  for (const r of rows) console.log(`${r.coca ? 'capo' : 'RS  '}  ${r.slug}${r.email ? `  <${r.email}>` : ''}`)
  console.log('\nUsage: set-leader.mts <slug> <email> [--admin]')
  process.exit(slug ? 1 : 0)
}

const [row] = await db
  .update(staffMember)
  .set({ email: email.trim().toLowerCase(), ...(admin ? { isAdmin: true } : {}) })
  .where(eq(staffMember.slug, slug))
  .returning()
if (!row) throw new Error(`No staff row with slug "${slug}"`)
console.log(`${row.nome}: ${row.email}${row.isAdmin ? ' (admin)' : ''}`)
