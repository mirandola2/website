import type { Metadata } from 'next'
import Link from 'next/link'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { totem } from '@/db/schema'
import ActionForm from '@/components/tabu/ActionForm'
import { Field } from '@/components/tabu/Field'
import DeleteButton from '@/components/tabu/DeleteButton'
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
  const backHref = `/tabu/admin/totem/${q ? `?q=${encodeURIComponent(q)}` : ''}`

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Totem</h1>

      <section className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">{editing ? `Modifica: ${editing.name}` : 'Aggiungi un totem'}</h2>
          <ActionForm
            key={editing?.id ?? 'new'}
            action={saveTotem}
            submitLabel={editing ? 'Salva' : 'Aggiungi'}
            extraActions={
              editing && (
                <>
                  <Link href={backHref} className="btn btn-ghost">
                    Annulla
                  </Link>
                  <DeleteButton action={deleteTotem} id={editing.id} confirm={`Eliminare il totem di ${editing.name}?`} redirectTo={backHref} />
                </>
              )
            }
          >
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-x-4 md:grid-cols-2">
              <Field label="Nome e cognome" name="name" defaultValue={editing?.name} required />
              <Field label="Totem" name="totem" defaultValue={editing?.totem} required />
              {/* New entries usually belong to the latest campo: prefill its place and year */}
              <Field label="Luogo del campo" name="location" defaultValue={editing?.location ?? last?.location} required />
              <Field label="Anno" name="year" defaultValue={editing?.year ?? last?.year} required />
            </div>
          </ActionForm>
        </div>
      </section>

      <form className="join w-full max-w-md" action="/tabu/admin/totem/">
        <input type="search" name="q" defaultValue={q} placeholder="Cerca nome, totem, luogo o anno" className="input join-item w-full" />
        <button type="submit" className="btn btn-primary join-item">
          Cerca
        </button>
      </form>

      <p className="text-sm opacity-70">{rows.length} risultati</p>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Anno</th>
              <th>Nome</th>
              <th>Totem</th>
              <th className="hidden md:table-cell">Luogo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className={row.id === editing?.id ? 'bg-base-200' : undefined}>
                <td>{row.year}</td>
                <td>{row.name}</td>
                <td>{row.totem}</td>
                <td className="hidden md:table-cell">{row.location}</td>
                <td>
                  <Link href={`/tabu/admin/totem/?id=${row.id}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className="btn btn-ghost btn-xs">
                    Modifica
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
