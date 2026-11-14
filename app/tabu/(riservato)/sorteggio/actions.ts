'use server'

import { z } from 'zod'
import { requireLeader } from '@/lib/dal'
import { revealAssignmentFor } from '@/lib/draw'
import { hitRateLimit } from '@/lib/rate-limit'

export type RevealResult = { ok: true; nome: string; img: string | null } | { ok: false; message: string }

// Who the session's leader drew in an open draw: only their own row, never anyone else's. Not in
// the page's HTML, so it is not stored with the page by the browser or the service worker.
export async function revealAssignment(drawId: string): Promise<RevealResult> {
  const leader = await requireLeader()
  const parsed = z.uuid().safeParse(drawId)
  if (!parsed.success) return { ok: false, message: 'Sorteggio non trovato.' }
  if (!(await hitRateLimit(`draw-reveal:${leader.memberCode}`, 60, 3600_000))) {
    return { ok: false, message: 'Troppe richieste: riprova tra un po’.' }
  }
  try {
    const receiver = await revealAssignmentFor(parsed.data, leader.memberCode)
    return receiver ? { ok: true, ...receiver } : { ok: false, message: 'Sorteggio non trovato, o archiviato.' }
  } catch (error) {
    console.error('revealAssignment failed:', error instanceof Error ? error.message : 'unknown error')
    return { ok: false, message: 'Non riesco a leggere il tuo sorteggio: avvisa un admin.' }
  }
}
