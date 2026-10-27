import 'server-only'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '@/db/schema'

// Turso in production; `file:local.db` (a plain SQLite file) in development.
export const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  schema,
  casing: 'snake_case',
})
