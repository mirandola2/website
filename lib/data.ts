import 'server-only'
import { unstable_cache } from 'next/cache'
import { and, asc, isNotNull, isNull, or, sql } from 'drizzle-orm'
import { db } from './db'
import { birthdayWindow } from './birthdays'
import { normalizeName } from './format'
import { link, media, member, staffMember, totem } from '@/db/schema'

// Cached database reads for the public pages: they stay static and are regenerated when a write
// from the site calls `revalidateTag('<tag>', 'max')`. Never select personal fields (email,
// birthday...) here unless the caller filters them out.
//
// The cache outlives builds (.next/cache, and Vercel's build cache), so edits made outside the
// site (import scripts, Turso shell) would never show up: REVALIDATE refreshes them within a day.
// Every edit from the site is immediate anyway, so a longer time only saves database reads.
const REVALIDATE = 86400

export const getTotem = unstable_cache(
  () =>
    db
      .select({ name: totem.name, totem: totem.totem, location: totem.location, year: totem.year })
      .from(totem)
      .orderBy(asc(totem.year), asc(totem.name)),
  ['totem'],
  { tags: ['totem'], revalidate: REVALIDATE },
)

export type StaffMember = Awaited<ReturnType<typeof getStaffMembers>>[number]

// Leaders and RS in service, in the main order
export const getStaffMembers = unstable_cache(
  () =>
    db
      .select({
        nome: staffMember.nome,
        nomeCaccia: staffMember.nomeCaccia,
        ruolo: staffMember.ruolo,
        staff: staffMember.staff,
        coca: staffMember.coca,
        desc: staffMember.desc,
        img: staffMember.img,
        order: staffMember.order,
      })
      .from(staffMember)
      .where(isNull(staffMember.deletedAt))
      .orderBy(asc(staffMember.position), asc(staffMember.memberCode)),
  ['staff'],
  { tags: ['staff'], revalidate: REVALIDATE },
)

export const getMedia = unstable_cache(
  () =>
    db
      .select({ slug: media.slug, type: media.type, year: media.year, name: media.name, url: media.url })
      .from(media)
      .orderBy(asc(media.sortOrder), asc(media.id)),
  ['media'],
  { tags: ['media'], revalidate: REVALIDATE },
)

export const getLinks = unstable_cache(
  () =>
    db
      .select({ category: link.category, type: link.type, name: link.name, url: link.url })
      .from(link)
      .orderBy(asc(link.category), asc(link.sortOrder), asc(link.id)),
  ['links'],
  { tags: ['links'], revalidate: REVALIDATE },
)

// Not cached: only the birthdays route reads it, and that route is cached as a whole. Only the
// members whose 'MM-DD' falls in the window (index member_birthday_md_idx), not the whole table:
// upcomingBirthdays() then keeps the exact ones.
export async function getMemberBirthdays(today: string, days: number) {
  const { from, to } = birthdayWindow(today, days)
  const md = sql`substr(${member.birthday}, 6)`
  // Over New Year the window is two ranges
  const inWindow = from <= to ? sql`${md} BETWEEN ${from} AND ${to}` : or(sql`${md} >= ${from}`, sql`${md} <= ${to}`)
  const rows = await db
    .select({ fullName: member.fullName, birthday: member.birthday })
    .from(member)
    .where(and(isNotNull(member.birthday), inWindow))
  return rows.flatMap(r => (r.birthday ? [{ fullName: r.fullName, birthday: r.birthday }] : []))
}

// Personal data, not cached: callers must check the session or the Token Magico first.
// Matched on the whole name, ignoring case and extra spaces. The expression is the one of the
// index member_full_name_idx, so only the matching rows are read. Placeholders (staff without a
// real code) have no birthday and are left out.
export function findMembersByName(name: string) {
  return db
    .select({ name: member.fullName, code: member.memberCode, birthday: sql<string>`${member.birthday}` })
    .from(member)
    .where(and(sql`lower(${member.fullName}) = lower(${normalizeName(name)})`, isNotNull(member.birthday)))
}
