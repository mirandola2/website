import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth, findLeaderByEmail } from './auth'
import { firstName } from './format'
import type { staffMember } from '@/db/schema'

// Data Access Layer: the only place that decides who is logged in. Every Tabù page and server
// action calls requireLeader() or requireAdmin(); proxy.ts is just a fast redirect.

export type Leader = typeof staffMember.$inferSelect

// The session's own staff row, matched by email: null if logged out or no longer a leader
export const getLeader = cache(async (): Promise<Leader | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session ? findLeaderByEmail(session.user.email) : null
})

export interface NavbarLeader {
  firstName: string
  isAdmin: boolean
}

// What the navbars show of the logged-in leader: the Tabù layout reads it on the server, the site
// navbar (SiteAccount) through /api/leader/
export async function getNavbarLeader(): Promise<NavbarLeader | null> {
  const leader = await getLeader()
  return leader && { firstName: firstName(leader.nome), isAdmin: leader.isAdmin }
}

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
