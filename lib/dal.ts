import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { auth } from './auth'
import { db } from './db'
import { staffMember } from '@/db/schema'

// Data Access Layer: the only place that decides who is logged in. Every Tabù page and server
// action calls requireLeader() or requireAdmin(); proxy.ts is just a fast redirect.

export type Leader = typeof staffMember.$inferSelect

// The session's own staff row, matched by email: null if logged out or no longer a leader
export const getLeader = cache(async (): Promise<Leader | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  const [leader] = await db
    .select()
    .from(staffMember)
    .where(and(eq(staffMember.email, session.user.email.toLowerCase()), eq(staffMember.coca, true)))
  return leader ?? null
})

export async function requireLeader() {
  const leader = await getLeader()
  if (!leader) redirect('/tabu/login/')
  return leader
}

export async function requireAdmin() {
  const leader = await requireLeader()
  if (!leader.isAdmin) redirect('/tabu/')
  return leader
}
