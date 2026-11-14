import 'server-only'
import { randomUUID } from 'crypto'
import { and, asc, count, desc, eq, exists, isNull } from 'drizzle-orm'
import { db } from './db'
import { pesca, pescaAssignment, staffMember } from '@/db/schema'
import { decryptReceiver, derange, encryptReceiver, parseSecret, PESCA_SCHEME } from './pesca-core'
import { loginLeaders } from './tabu'

// The pesca among leaders (README → Pesca). Who drew whom exists in clear only in memory: while
// drawing, and when a leader reveals their own row. Nothing here returns, logs or stores it
// otherwise. Callers must have checked requireLeader() / requireAdmin() first.

// Read on every use, so a missing or malformed secret fails loudly instead of encrypting with
// an empty key
const secret = () => parseSecret(process.env.PESCA_SECRET)

export type PescaStatus = (typeof pesca.$inferSelect)['status']

// Who can take part: the leaders not removed from the staff. Those without an email are listed
// too, but can't be picked: they could never log in to see their draw.
export async function getPescaPool() {
  return db
    .select({ memberCode: staffMember.memberCode, nome: staffMember.nome, img: staffMember.img, email: staffMember.email })
    .from(staffMember)
    .where(and(eq(staffMember.coca, true), isNull(staffMember.deletedAt)))
    .orderBy(asc(staffMember.position), asc(staffMember.memberCode))
}

export class PescaError extends Error {}

// Draws and stores a new pesca in one batch. Returns only the number of participants.
export async function createPesca(createdBy: string, title: string, included: string[]) {
  const key = secret()
  const pool = await db.select({ memberCode: staffMember.memberCode, slug: staffMember.slug }).from(staffMember).where(loginLeaders)
  const slugOf = new Map(pool.map(p => [p.memberCode, p.slug]))
  const participants = [...new Set(included)]
  if (participants.some(code => !slugOf.has(code))) throw new PescaError('Uno dei capi scelti non può partecipare: ricarica la pagina.')
  if (participants.length < 2) throw new PescaError('Servono almeno 2 partecipanti.')

  const id = randomUUID()
  const slugs = participants.map(code => slugOf.get(code)!)
  const draw = derange(slugs)
  const rows = participants.map((code, i) => ({
    pescaId: id,
    giver: code,
    payload: encryptReceiver(key, id, slugs[i], draw.get(slugs[i])!),
  }))
  await db.batch([
    db.insert(pesca).values({ id, title, createdAt: new Date(), createdBy, participantCount: rows.length, scheme: PESCA_SCHEME }),
    db.insert(pescaAssignment).values(rows),
  ])
  return rows.length
}

// Admin list: never the assignments
export async function listPesche() {
  return db.select().from(pesca).orderBy(desc(pesca.createdAt))
}

export async function setPescaStatus(id: string, status: PescaStatus) {
  const rows = await db.update(pesca).set({ status }).where(eq(pesca.id, id)).returning({ id: pesca.id })
  return rows.length > 0
}

export async function deletePesca(id: string) {
  const rows = await db.delete(pesca).where(eq(pesca.id, id)).returning({ id: pesca.id })
  return rows.length > 0
}

const mineOpen = (memberCode: string) =>
  and(eq(pescaAssignment.giver, memberCode), eq(pesca.status, 'open'))

// The open pesche the leader takes part in, most recent first (/tabu/pesca)
export async function listOpenPescheFor(memberCode: string) {
  return db
    .select({ id: pesca.id, title: pesca.title, createdAt: pesca.createdAt })
    .from(pescaAssignment)
    .innerJoin(pesca, eq(pesca.id, pescaAssignment.pescaId))
    .where(mineOpen(memberCode))
    .orderBy(desc(pesca.createdAt))
}

// Whether the Tabù shows the Pesca page to this leader at all
export async function hasOpenPesca(memberCode: string) {
  const [row] = await db
    .select({ n: count() })
    .from(pescaAssignment)
    .where(
      and(
        eq(pescaAssignment.giver, memberCode),
        exists(db.select({ id: pesca.id }).from(pesca).where(and(eq(pesca.id, pescaAssignment.pescaId), eq(pesca.status, 'open')))),
      ),
    )
  return row.n > 0
}

// The leader's own row of an open pesca, decrypted: who they drew. Null when they have no row
// there (or it is archived). Throws if the row can't be decrypted (wrong secret, tampered row).
export async function revealAssignmentFor(pescaId: string, memberCode: string) {
  const [row] = await db
    .select({ payload: pescaAssignment.payload, scheme: pesca.scheme, giverSlug: staffMember.slug })
    .from(pescaAssignment)
    .innerJoin(pesca, eq(pesca.id, pescaAssignment.pescaId))
    .innerJoin(staffMember, eq(staffMember.memberCode, pescaAssignment.giver))
    .where(and(eq(pescaAssignment.pescaId, pescaId), mineOpen(memberCode)))
  if (!row) return null
  if (row.scheme !== PESCA_SCHEME) throw new Error(`Unknown pesca scheme ${row.scheme}`)
  const receiverSlug = decryptReceiver(secret(), pescaId, row.giverSlug, row.payload)
  // Whoever was drawn, even if removed from the staff since
  const [receiver] = await db
    .select({ nome: staffMember.nome, img: staffMember.img })
    .from(staffMember)
    .where(eq(staffMember.slug, receiverSlug))
  if (!receiver) throw new Error('Pesca receiver not found')
  return receiver
}
