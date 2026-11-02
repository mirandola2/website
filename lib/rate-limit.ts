import 'server-only'
import { lt, sql } from 'drizzle-orm'
import { db } from './db'
import { rateLimit } from '@/db/schema'

// Counts a hit for `key` and says whether it is still within `limit` hits per `windowMs`. Kept in
// the database: on Vercel every request may land on a different instance.
export async function hitRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)
  const expired = sql`${rateLimit.resetAt} <= ${now.getTime()}`
  // One statement, so concurrent hits can't both read the old count
  const [{ count }] = await db
    .insert(rateLimit)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`CASE WHEN ${expired} THEN 1 ELSE ${rateLimit.count} + 1 END`,
        resetAt: sql`CASE WHEN ${expired} THEN ${resetAt.getTime()} ELSE ${rateLimit.resetAt} END`,
      },
    })
    .returning({ count: rateLimit.count })
  // Old windows of other IPs: the table only keeps the active ones
  await db.delete(rateLimit).where(lt(rateLimit.resetAt, now))
  return count <= limit
}
