'use server'

import { timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { member } from '@/db/schema'

export type MemberCodeResult =
  | { ok: true; people: { name: string; code: string; birthday: string }[] }
  | { ok: false; error: 'unauthorized' | 'invalid' }

// The `psk` cookie holds the sha256 of the "Token Magico" (set by CodiceSocio in the browser)
async function hasValidToken() {
  const expected = process.env.MEMBER_PSK_SHA256?.toLowerCase()
  const psk = (await cookies()).get('psk')?.value.toLowerCase()
  if (!expected || !psk || psk.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(psk), Buffer.from(expected))
}

export async function searchMemberCode(name: string): Promise<MemberCodeResult> {
  if (!(await hasValidToken())) return { ok: false, error: 'unauthorized' }

  const cleaned = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : ''
  if (!cleaned || cleaned.length > 100) return { ok: false, error: 'invalid' }

  const people = await db
    .select({ name: member.fullName, code: member.memberCode, birthday: member.birthday })
    .from(member)
    .where(sql`lower(${member.fullName}) = lower(${cleaned})`)
  return { ok: true, people }
}
