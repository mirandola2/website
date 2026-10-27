// Database for the one-off scripts: lib/db.ts is `server-only`, so it can't be imported here.
import nextEnv from '@next/env'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../db/schema'

nextEnv.loadEnvConfig(process.cwd())

const url = process.env.TURSO_DATABASE_URL
if (!url) throw new Error('TURSO_DATABASE_URL is not set (see .env.example)')
console.log(`Database: ${url.startsWith('file:') ? url : new URL(url).host}`)

export const db = drizzle({
  connection: { url, authToken: process.env.TURSO_AUTH_TOKEN },
  schema,
  casing: 'snake_case',
})
