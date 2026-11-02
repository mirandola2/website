// Local testing only: opens a Tabù session for a leader's email without going through Google, and
// prints the cookie to set in the browser (DevTools → Application → Cookies → localhost).
// Refuses to run against anything but a local SQLite file.
//
//   npm run db:dev-login -- <email>
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from './db.mjs'
import { session, staffMember, user } from '../db/schema'

if (!process.env.TURSO_DATABASE_URL?.startsWith('file:')) throw new Error('dev-login only works on a local file: database')
const secret = process.env.BETTER_AUTH_SECRET
if (!secret) throw new Error('BETTER_AUTH_SECRET is not set')

const email = process.argv[2]?.trim().toLowerCase()
if (!email) throw new Error('Usage: dev-login.mts <email>')
const [leader] = await db.select().from(staffMember).where(eq(staffMember.email, email))
if (!leader?.coca) throw new Error(`${email} is not a leader's email (see npm run db:set-leader)`)

const now = new Date()
let [u] = await db.select().from(user).where(eq(user.email, email))
if (!u) {
  ;[u] = await db
    .insert(user)
    .values({ id: crypto.randomUUID(), name: leader.nome, email, emailVerified: true, createdAt: now, updatedAt: now })
    .returning()
}

const token = crypto.randomBytes(24).toString('base64url')
await db.insert(session).values({
  id: crypto.randomUUID(),
  token,
  userId: u.id,
  expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
  createdAt: now,
  updatedAt: now,
})

// Same format as Better Auth's signed cookie: <token>.<base64 HMAC-SHA256>, URI-encoded
const signature = crypto.createHmac('sha256', secret).update(token).digest('base64')
console.log(`better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`)
