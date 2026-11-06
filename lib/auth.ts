import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from './db'
import * as schema from '@/db/schema'

// Login allowlist: only the email of a leader row (coca = 1, not removed) can sign up or open a
// session. RS rows can't have an email (CHECK in db/schema.ts), so they can never log in.
export async function findLeaderByEmail(email: string) {
  const { staffMember } = schema
  const [row] = await db
    .select()
    .from(staffMember)
    .where(and(eq(staffMember.email, email.toLowerCase()), eq(staffMember.coca, true), isNull(staffMember.deletedAt)))
  return row ?? null
}

// The OAuth callback turns this into a redirect to /tabu/login/?error=not_a_leader
const notALeader = () =>
  new APIError('FORBIDDEN', { code: 'not_a_leader', message: 'Questa email non è abilitata al Tabù.' })

export const auth = betterAuth({
  // BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      prompt: 'select_account',
    },
  },
  // BETTER_AUTH_URL is the apex domain: without www here, POSTs from www.mirandola2.it (sign-out) get 403 INVALID_ORIGIN
  trustedOrigins: ['https://www.mirandola2.it'],
  onAPIError: { errorURL: '/tabu/login/' },
  // The session is also kept in a signed cookie for 5 minutes, saving the session and user reads on
  // every Tabù page. Removing a leader still takes effect at once: getLeader() (lib/dal.ts) checks
  // their staff row on every request.
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  // next.config.ts has trailingSlash: true, so /api/auth/x is redirected to /api/auth/x/
  advanced: { skipTrailingSlashes: true },
  databaseHooks: {
    user: {
      create: {
        before: async user => {
          if (!(await findLeaderByEmail(user.email))) throw notALeader()
        },
      },
    },
    // Also blocks existing users whose email was later removed from their staff row
    session: {
      create: {
        before: async session => {
          const [row] = await db
            .select({ email: schema.user.email })
            .from(schema.user)
            .where(eq(schema.user.id, session.userId))
          if (!row || !(await findLeaderByEmail(row.email))) throw notALeader()
        },
      },
    },
  },
  // Must be the last plugin: lets server actions set cookies
  plugins: [nextCookies()],
})
