import type { Metadata } from 'next'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { DownloadSimpleIcon } from '@phosphor-icons/react/ssr'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { totem } from '@/db/schema'
import CrudPage from '@/components/tabu/CrudPage'
import { Field } from '@/components/tabu/Field'
import { deleteTotem, saveTotem } from '../actions'

export const metadata: Metadata = { title: 'Admin · Totem' }

export default async function AdminTotemPage({ searchParams }: { searchParams: Promise<{ id?: string; q?: string }> }) {
  await requireAdmin()
  const { id, q = '' } = await searchParams
  const query = q.trim().toLowerCase()
  const rows = await db
    .select()
    .from(totem)
    .where(
      query
        ? sql`instr(lower(${totem.name} || ' ' || ${totem.totem} || ' ' || ${totem.location} || ' ' || ${totem.year}), ${query}) > 0`
        : undefined,
    )
    .orderBy(desc(totem.year), asc(totem.location), asc(totem.name))
  const [editing] = id ? await db.select().from(totem).where(eq(totem.id, Number(id))) : []
  const last = rows[0]

  return (
    <CrudPage
      title="Totem"
      addTitle="Aggiungi un totem"
      // The search survives editing and deleting
      href={`/tabu/admin/totem/${q ? `?q=${encodeURIComponent(q)}` : ''}`}
      editing={editing}
      save={saveTotem}
      remove={deleteTotem}
      deleteConfirm={row => `Eliminare il totem di ${row.name}?`}
      rows={rows}
      fields={row => (
        <>
          <Field label="Nome e cognome" name="name" defaultValue={row?.name} required />
          <Field label="Totem" name="totem" defaultValue={row?.totem} required />
          {/* New entries usually belong to the latest campo: prefill its place and year */}
          <Field label="Luogo del campo" name="location" defaultValue={row?.location ?? last?.location} required />
          <Field label="Anno" name="year" defaultValue={row?.year ?? last?.year} required />
        </>
      )}
      columns={[
        { label: 'Anno', cell: row => row.year },
        { label: 'Nome', cell: row => row.name },
        { label: 'Totem', cell: row => row.totem },
        { label: 'Luogo', className: 'hidden md:table-cell', cell: row => row.location },
      ]}
    >
      <form className="join w-full max-w-md" action="/tabu/admin/totem/">
        <input type="search" name="q" defaultValue={q} placeholder="Cerca nome, totem, luogo o anno" className="input join-item w-full" />
        <button type="submit" className="btn btn-primary join-item">
          Cerca
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm opacity-70">{rows.length} risultati</p>
        {/* Always every totem, whatever the search */}
        <a href="/tabu/admin/export/totem/" download className="btn btn-outline btn-sm">
          <DownloadSimpleIcon size={16} weight="bold" aria-hidden />
          Esporta tutti in CSV
        </a>
      </div>
    </CrudPage>
  )
}
