import 'server-only'
import { randomUUID } from 'crypto'
import { and, asc, count, desc, eq, exists, isNull } from 'drizzle-orm'
import { db } from './db'
import { draw, drawAssignment, staffMember } from '@/db/schema'
import { decryptReceiver, drawAssignments, encryptReceiver, parseSecret, DRAW_SCHEME } from './draw-core'
import { loginLeaders } from './tabu'

// The draw among leaders (README → Sorteggio). Who drew whom exists in clear only in memory: while
// drawing, and when a leader reveals their own row. Nothing here returns, logs or stores it
// otherwise. Callers must have checked requireLeader() / requireAdmin() first.

// Read on every use, so a missing or malformed secret fails loudly instead of encrypting with
// an empty key
const secret = () => parseSecret(process.env.DRAW_SECRET)

export type DrawStatus = (typeof draw.$inferSelect)['status']

// Who can take part: the leaders not removed from the staff. Those without an email are listed
// too, but can't be picked: they could never log in to see their draw.
export async function getDrawPool() {
  return db
    .select({ memberCode: staffMember.memberCode, nome: staffMember.nome, img: staffMember.img, email: staffMember.email })
    .from(staffMember)
    .where(and(eq(staffMember.coca, true), isNull(staffMember.deletedAt)))
    .orderBy(asc(staffMember.position), asc(staffMember.memberCode))
}

export class DrawError extends Error {}

// Draws and stores a new draw in one batch. Returns only the number of participants.
export async function createDraw(createdBy: string, title: string, included: string[]) {
  const key = secret()
  const pool = await db.select({ memberCode: staffMember.memberCode, slug: staffMember.slug }).from(staffMember).where(loginLeaders)
  const slugOf = new Map(pool.map(p => [p.memberCode, p.slug]))
  const participants = [...new Set(included)]
  if (participants.some(code => !slugOf.has(code))) throw new DrawError('Uno dei capi scelti non può partecipare: ricarica la pagina.')
  if (participants.length < 2) throw new DrawError('Servono almeno 2 partecipanti.')

  const id = randomUUID()
  const rows = drawAssignments(participants.map(code => ({ code, slug: slugOf.get(code)! }))).map(r => ({
    drawId: id,
    giver: r.giver,
    payload: encryptReceiver(key, id, r.giverSlug, r.receiverSlug),
  }))
  await db.batch([
    db.insert(draw).values({ id, title, createdAt: new Date(), createdBy, participantCount: rows.length, scheme: DRAW_SCHEME }),
    db.insert(drawAssignment).values(rows),
  ])
  return rows.length
}

// Admin list: never the assignments
export async function listDraws() {
  return db.select().from(draw).orderBy(desc(draw.createdAt))
}

export async function setDrawStatus(id: string, status: DrawStatus) {
  const rows = await db.update(draw).set({ status }).where(eq(draw.id, id)).returning({ id: draw.id })
  return rows.length > 0
}

export async function deleteDraw(id: string) {
  const rows = await db.delete(draw).where(eq(draw.id, id)).returning({ id: draw.id })
  return rows.length > 0
}

const mineOpen = (memberCode: string) =>
  and(eq(drawAssignment.giver, memberCode), eq(draw.status, 'open'))

// The open draws the leader takes part in, most recent first (/tabu/sorteggio)
export async function listOpenDrawsFor(memberCode: string) {
  return db
    .select({ id: draw.id, title: draw.title, createdAt: draw.createdAt })
    .from(drawAssignment)
    .innerJoin(draw, eq(draw.id, drawAssignment.drawId))
    .where(mineOpen(memberCode))
    .orderBy(desc(draw.createdAt))
}

// Titles of the open draws this person gives in (admin notice when they lose their access)
export async function openDrawTitlesFor(memberCode: string) {
  const rows = await listOpenDrawsFor(memberCode)
  return rows.map(r => r.title)
}

// Whether the Tabù shows the Sorteggio page to this leader at all
export async function hasOpenDraw(memberCode: string) {
  const [row] = await db
    .select({ n: count() })
    .from(drawAssignment)
    .where(
      and(
        eq(drawAssignment.giver, memberCode),
        exists(db.select({ id: draw.id }).from(draw).where(and(eq(draw.id, drawAssignment.drawId), eq(draw.status, 'open')))),
      ),
    )
  return row.n > 0
}

// The leader's own row of an open draw, decrypted: who they drew. Null when they have no row
// there (or it is archived). Throws if the row can't be decrypted (wrong secret, tampered row).
export async function revealAssignmentFor(drawId: string, memberCode: string) {
  const [row] = await db
    .select({ payload: drawAssignment.payload, scheme: draw.scheme, giverSlug: staffMember.slug })
    .from(drawAssignment)
    .innerJoin(draw, eq(draw.id, drawAssignment.drawId))
    .innerJoin(staffMember, eq(staffMember.memberCode, drawAssignment.giver))
    .where(and(eq(drawAssignment.drawId, drawId), mineOpen(memberCode)))
  if (!row) return null
  if (row.scheme !== DRAW_SCHEME) throw new Error(`Unknown draw scheme ${row.scheme}`)
  const receiverSlug = decryptReceiver(secret(), drawId, row.giverSlug, row.payload)
  // Whoever was drawn, even if removed from the staff since
  const [receiver] = await db
    .select({ nome: staffMember.nome, img: staffMember.img })
    .from(staffMember)
    .where(eq(staffMember.slug, receiverSlug))
  if (!receiver) throw new Error('Draw receiver not found')
  return receiver
}
