import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import type { ProjectAnswers, ProjectTemplate } from '@/lib/project'

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

// Imported once from the old content/_capi.csv: leaders (coca = 1) and RS in service (coca = 0), shown in `position` order.
// Only leaders can have an email, so RS can never log in. The email (lowercase) is the login
// allowlist and the link to the Better Auth `user` (lib/auth.ts, lib/dal.ts).
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
    // Main order on the site (drag and drop in /tabu/admin/staff), ascending
    position: integer().notNull().default(0),
    // Optional Coca page override: rows with an order come first (ascending), the others keep `position`
    order: integer(),
    email: text().unique(),
    isAdmin: integer({ mode: 'boolean' }).notNull().default(false),
    // Set by "Elimina" in /tabu/admin/staff: the row is hidden everywhere and can't log in, but it
    // is never deleted, so its Progetti del Capo are kept
    deletedAt: integer({ mode: 'timestamp_ms' }),
  },
  t => [check('rs_without_email', sql`${t.coca} = 1 OR ${t.email} IS NULL`)],
)

// Imported once from the old content/_media.csv. `slug` is the CSV id, used as the card anchor: an image and a video of
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

// Materials and links page (<LinkList />): free-text category to group by, type for the icon
export const link = sqliteTable('link', {
  id: integer().primaryKey({ autoIncrement: true }),
  category: text().notNull(),
  type: text({ enum: ['link', 'document', 'video', 'book'] }).notNull().default('link'),
  name: text().notNull(),
  url: text().notNull(),
  sortOrder: integer().notNull().default(0),
})

// A leader's yearly project: readable by every leader, editable only by its owner. The answers are
// one JSON value, by area and question of the year's template (lib/project.ts; read it with
// normalizeAnswers).
export const yearProject = sqliteTable(
  'year_project',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    staffMemberId: integer()
      .notNull()
      // Projects are never deleted: the database refuses to delete a staff row that has any
      .references(() => staffMember.id, { onDelete: 'restrict' }),
    // '2026-27': the year's template is in scout_year
    scoutYear: text()
      .notNull()
      .references(() => scoutYear.id),
    sections: text({ mode: 'json' }).$type<ProjectAnswers>().notNull().default(sql`'{}'`),
    updatedAt: integer({ mode: 'timestamp_ms' }).notNull(),
  },
  t => [unique().on(t.staffMemberId, t.scoutYear)],
)

// The scout years of the Progetto del Capo, added by admins (lib/tabu.ts getYearSettings): the
// year's template (areas × questions), whether it is listed (visible) and still editable (active)
export const scoutYear = sqliteTable('scout_year', {
  // '2026-27'
  id: text().primaryKey(),
  template: text({ mode: 'json' }).$type<ProjectTemplate>().notNull().default(sql`'{}'`),
  visible: integer({ mode: 'boolean' }).notNull().default(false),
  active: integer({ mode: 'boolean' }).notNull().default(false),
})

// Better Auth tables (core schema: user, session, account, verification)

export const user = sqliteTable('user', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: 'boolean' }).notNull().default(false),
  image: text(),
  createdAt: integer({ mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer({ mode: 'timestamp_ms' }).notNull(),
})

export const session = sqliteTable(
  'session',
  {
    id: text().primaryKey(),
    expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
    token: text().notNull().unique(),
    createdAt: integer({ mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer({ mode: 'timestamp_ms' }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  t => [index('session_user_id_idx').on(t.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: integer({ mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer({ mode: 'timestamp_ms' }),
    scope: text(),
    password: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer({ mode: 'timestamp_ms' }).notNull(),
  },
  t => [index('account_user_id_idx').on(t.userId)],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
    createdAt: integer({ mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer({ mode: 'timestamp_ms' }).notNull(),
  },
  t => [index('verification_identifier_idx').on(t.identifier)],
)

// Fixed-window counters for the public actions (lib/rate-limit.ts), one row per action and IP
export const rateLimit = sqliteTable('rate_limit', {
  key: text().primaryKey(),
  count: integer().notNull(),
  resetAt: integer({ mode: 'timestamp_ms' }).notNull(),
})
