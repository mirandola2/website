'use server'

import { z } from 'zod'
import { requireLeader } from '@/lib/dal'
import { revealAssignmentFor } from '@/lib/pesca'
import { hitRateLimit } from '@/lib/rate-limit'

export type RevealResult = { ok: true; nome: string; img: string | null } | { ok: false; message: string }

// Who the session's leader drew in an open pesca: only their own row, never anyone else's. Not in
// the page's HTML, so it is not stored with the page by the browser or the service worker.
export async function revealAssignment(pescaId: string): Promise<RevealResult> {
  const leader = await requireLeader()
  const parsed = z.uuid().safeParse(pescaId)
  if (!parsed.success) return { ok: false, message: 'Pesca non trovata.' }
  if (!(await hitRateLimit(`pesca-reveal:${leader.memberCode}`, 60, 3600_000))) {
    return { ok: false, message: 'Troppe richieste: riprova tra un po’.' }
  }
  try {
    const receiver = await revealAssignmentFor(parsed.data, leader.memberCode)
    return receiver ? { ok: true, ...receiver } : { ok: false, message: 'Pesca non trovata, o archiviata.' }
  } catch (error) {
    console.error('revealAssignment failed:', error instanceof Error ? error.message : 'unknown error')
    return { ok: false, message: 'Non riesco a leggere la tua pesca: avvisa un admin.' }
  }
}
