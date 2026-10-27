import 'server-only'
import { unstable_cache } from 'next/cache'
import { asc } from 'drizzle-orm'
import { db } from './db'
import { media, member, staffMember, totem } from '@/db/schema'

// Cached database reads for the public pages: they stay static and are regenerated only when a
// write calls `revalidateTag('<tag>', 'max')`. Never select personal fields (email, birthday...)
// here unless the caller filters them out.

export const getTotem = unstable_cache(
  () =>
    db
      .select({ name: totem.name, totem: totem.totem, location: totem.location, year: totem.year })
      .from(totem)
      .orderBy(asc(totem.year), asc(totem.name)),
  ['totem'],
  { tags: ['totem'] },
)

export type StaffMember = Awaited<ReturnType<typeof getStaffMembers>>[number]

// Leaders and RS in service, in row order
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
      .orderBy(asc(staffMember.id)),
  ['staff'],
  { tags: ['staff'] },
)

export const getMedia = unstable_cache(
  () =>
    db
      .select({ slug: media.slug, type: media.type, year: media.year, name: media.name, url: media.url })
      .from(media)
      .orderBy(asc(media.sortOrder), asc(media.id)),
  ['media'],
  { tags: ['media'] },
)

// Not cached: only the birthdays route reads it, and that route is cached as a whole
export function getMemberBirthdays() {
  return db.select({ fullName: member.fullName, birthday: member.birthday }).from(member)
}
