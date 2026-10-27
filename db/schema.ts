import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Column names are camelCase here and snake_case in SQL (`casing: 'snake_case'` in lib/db.ts
// and drizzle.config.ts).

// Migrated from the Worker's D1 `totem` table
export const totem = sqliteTable('totem', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  location: text().notNull(),
  totem: text().notNull(),
  year: text().notNull(),
})

// Migrated from the Worker's D1 `data` table. Personal data: never exposed as is.
export const member = sqliteTable('member', {
  memberCode: text().primaryKey(),
  fullName: text().notNull(),
  // YYYY-MM-DD
  birthday: text().notNull(),
})

// From content/_capi.csv: leaders (coca = 1) and RS in service (coca = 0), in the CSV row order (id).
// Only leaders can have an email, so RS can never log in.
export const staffMember = sqliteTable(
  'staff_member',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    slug: text().notNull().unique(),
    nome: text().notNull(),
    nomeCaccia: text(),
    // One service per staff, `|`-separated like `staff` ("Capo Fuoco|Aiuto Capo Gruppo")
    ruolo: text().notNull().default(''),
    staff: text().notNull().default(''),
    coca: integer({ mode: 'boolean' }).notNull().default(true),
    desc: text(),
    // File name inside the ImageKit staff folder; empty = DiceBear avatar
    img: text(),
    // ImageKit file id, set only by uploads from the site: imported photos are never deleted
    imgFileId: text(),
    // Coca page: rows with an order come first (ascending), the others keep the row order
    order: integer(),
    email: text().unique(),
    isAdmin: integer({ mode: 'boolean' }).notNull().default(false),
  },
  t => [check('rs_without_email', sql`${t.coca} = 1 OR ${t.email} IS NULL`)],
)

// From content/_media.csv. `slug` is the CSV id, used as the card anchor: an image and a video of
// the same event share it, so it is not unique.
export const media = sqliteTable('media', {
  id: integer().primaryKey({ autoIncrement: true }),
  slug: text().notNull(),
  type: text({ enum: ['image', 'video'] }).notNull(),
  // Scout year start: 2024 = 2024-25
  year: integer().notNull(),
  name: text().notNull(),
  url: text().notNull(),
  sortOrder: integer().notNull().default(0),
})
