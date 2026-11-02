'use server'

import { requireLeader } from '@/lib/dal'
import { findMembersByName } from '@/lib/data'

// The leader's own member code, matched on the full name of their staff row. Only runs when
// the dashboard button is pressed.
export async function getMyMemberCode() {
  const leader = await requireLeader()
  return (await findMembersByName(leader.nome)).map(({ name, code }) => ({ name, code }))
}
