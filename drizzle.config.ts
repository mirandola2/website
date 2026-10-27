import { loadEnvConfig } from '@next/env'
import { defineConfig } from 'drizzle-kit'

// Same env files as Next (.env.local in development)
loadEnvConfig(process.cwd())

export default defineConfig({
  dialect: 'turso',
  schema: './db/schema.ts',
  out: './db/migrations',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
})
