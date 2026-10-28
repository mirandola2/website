'use server'

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireLeader } from '@/lib/dal'
import { member } from '@/db/schema'

// The leader's own member code, matched on the full name of their staff row. Only runs when
// the dashboard button is pressed.
export async function getMyMemberCode() {
  const leader = await requireLeader()
  return db
    .select({ name: member.fullName, code: member.memberCode })
    .from(member)
    .where(sql`lower(${member.fullName}) = lower(${leader.nome.trim().replace(/\s+/g, ' ')})`)
}
