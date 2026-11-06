import type { NextRequest } from 'next/server'
import Papa from 'papaparse'
import { asc, desc, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { media, staffMember, totem } from '@/db/schema'
import { romeToday } from '@/lib/birthdays'

// CSV downloads for admins, in the same order as their admin pages. The staff and media files are
// also the backups to rebuild the database: `npm run db:import-csv -- staff|media <file>` reads them.
const exports: Record<string, () => Promise<object[]>> = {
  staff: async () =>
    (
      await db
        .select()
        .from(staffMember)
        .where(isNull(staffMember.deletedAt))
        .orderBy(asc(staffMember.position), asc(staffMember.memberCode))
    ).map(r => ({
      // The key of the row: the importer updates by it (placeholders included)
      memberCode: r.memberCode,
      nome: r.nome,
      nomeCaccia: r.nomeCaccia,
      ruolo: r.ruolo,
      staff: r.staff,
      coca: r.coca ? 1 : 0,
      desc: r.desc,
      img: r.img,
      order: r.order,
      email: r.email,
      admin: r.isAdmin ? 1 : 0,
    })),
  // Same columns as the importer (id = slug), in the public page order
  media: () =>
    db
      .select({ type: media.type, id: media.slug, year: media.year, name: media.name, url: media.url })
      .from(media)
      .orderBy(asc(media.sortOrder), asc(media.id)),
  totem: () =>
    db
      .select({ name: totem.name, totem: totem.totem, location: totem.location, year: totem.year })
      .from(totem)
      .orderBy(desc(totem.year), asc(totem.location), asc(totem.name)),
}

export async function GET(_req: NextRequest, ctx: RouteContext<'/tabu/admin/export/[kind]'>) {
  await requireAdmin()
  const { kind } = await ctx.params
  if (!Object.hasOwn(exports, kind)) return new Response('Not found', { status: 404 })

  const rows = await exports[kind]()
  // escapeFormulae: leaders write their own profile text, which must not run as a formula in Excel.
  // The BOM makes Excel read the file as UTF-8.
  const csv = '\uFEFF' + Papa.unparse(rows, { escapeFormulae: true })
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${kind}-${romeToday()}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
