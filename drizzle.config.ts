import fs from 'fs'
import { parseEnv } from 'util'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit loads `.env` (production) into process.env by itself before reading this file, so
// `.env.local` would never win: it is read here explicitly. `npm run db:migrate` always targets the
// database of `.env.local` (local.db); `npm run db:migrate:prod` (DRIZZLE_ENV=production) the one
// exported in the shell, or else the one of `.env`.
const readEnv = (file: string) => (fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8')) : {})
const env = process.env.DRIZZLE_ENV === 'production' ? process.env : { ...readEnv('.env'), ...readEnv('.env.local') }

const url = env.TURSO_DATABASE_URL
if (!url) throw new Error('TURSO_DATABASE_URL is not set (see .env.example)')
console.log(`Database: ${url.startsWith('file:') ? url : `${new URL(url).host} (PRODUCTION)`}`)

export default defineConfig({
  dialect: 'turso',
  schema: './db/schema.ts',
  out: './db/migrations',
  casing: 'snake_case',
  dbCredentials: { url, authToken: env.TURSO_AUTH_TOKEN },
})
