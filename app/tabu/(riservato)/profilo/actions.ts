'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireLeader } from '@/lib/dal'
import { replaceStaffPhoto } from '@/lib/staff-photo'
import { isLcStaff } from '@/lib/staff'
import { optionalText } from '@/lib/validation'
import { staffMember } from '@/db/schema'
import type { ActionResult } from '@/components/tabu/types'

// Both actions only ever touch the session's own staff row

export async function uploadMyPhoto(formData: FormData): Promise<ActionResult> {
  const leader = await requireLeader()
  return replaceStaffPhoto(leader, formData.get('photo'))
}

const DescSchema = z.object({ desc: optionalText(600) })

export async function updateMyDesc(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const leader = await requireLeader()
  // The description only appears on the L/C pages
  if (!isLcStaff(leader.staff)) return { ok: false, message: 'La descrizione è solo per i capi L/C.' }
  const parsed = DescSchema.safeParse({ desc: formData.get('desc') ?? '' })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  await db.update(staffMember).set({ desc: parsed.data.desc }).where(eq(staffMember.id, leader.id))
  revalidateTag('staff', 'max')
  revalidatePath('/tabu', 'layout')
  return { ok: true, message: 'Descrizione salvata.' }
}
