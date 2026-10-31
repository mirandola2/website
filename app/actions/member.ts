'use server'

import { createHash, timingSafeEqual } from 'crypto'
import { cookies, headers } from 'next/headers'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { member } from '@/db/schema'
import { getLeader } from '@/lib/dal'
import { hitRateLimit } from '@/lib/rate-limit'

export type MemberCodeResult =
  | { ok: true; people: { name: string; code: string; birthday: string }[] }
  | { ok: false; error: 'unauthorized' | 'invalid' | 'rate_limited' }

export type MemberTokenResult = { ok: true } | { ok: false; error: 'invalid' | 'rate_limited' }

// The `psk` cookie holds the "Token Magico" itself, HttpOnly so no script can read it. The server
// only knows its sha256 (MEMBER_PSK_SHA256), so the env value alone can't be used to log in.
// `psk_set` is readable by CodiceSocio and only tells the UI that a token was saved.
const TOKEN_COOKIE = 'psk'
const HINT_COOKIE = 'psk_set'
const COOKIE_MAX_AGE = 365 * 24 * 3600

function tokenMatches(token: string | undefined) {
  const expected = process.env.MEMBER_PSK_SHA256?.toLowerCase()
  if (!expected || !token || token.length > 200) return false
  const actual = createHash('sha256').update(token).digest('hex')
  return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}

// Per IP: Vercel overwrites x-forwarded-for, so the first address is the client's
async function clientIp() {
  return (await headers()).get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
}

export async function saveMemberToken(token: string): Promise<MemberTokenResult> {
  // Guessing the token: a few tries per hour
  if (!(await hitRateLimit(`member-token:${await clientIp()}`, 10, 3600_000))) return { ok: false, error: 'rate_limited' }
  if (typeof token !== 'string' || !tokenMatches(token)) return { ok: false, error: 'invalid' }

  const jar = await cookies()
  const options = { maxAge: COOKIE_MAX_AGE, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' } as const
  jar.set(TOKEN_COOKIE, token, { ...options, httpOnly: true })
  jar.set(HINT_COOKIE, '1', options)
  return { ok: true }
}

export async function clearMemberToken() {
  const jar = await cookies()
  jar.delete(TOKEN_COOKIE)
  jar.delete(HINT_COOKIE)
}

export async function searchMemberCode(name: string): Promise<MemberCodeResult> {
  // A logged-in leader, or anyone with the "Token Magico". The token is shared with families, so
  // its searches are rate limited: a leaked token can't be used to harvest codes and birthdays.
  if (!(await getLeader())) {
    if (!tokenMatches((await cookies()).get(TOKEN_COOKIE)?.value)) return { ok: false, error: 'unauthorized' }
    if (!(await hitRateLimit(`member-search:${await clientIp()}`, 20, 3600_000))) return { ok: false, error: 'rate_limited' }
  }

  const cleaned = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : ''
  if (!cleaned || cleaned.length > 100) return { ok: false, error: 'invalid' }

  const people = await db
    .select({ name: member.fullName, code: member.memberCode, birthday: member.birthday })
    .from(member)
    .where(sql`lower(${member.fullName}) = lower(${cleaned})`)
  return { ok: true, people }
}
