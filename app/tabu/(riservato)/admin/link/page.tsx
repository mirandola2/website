import type { Metadata } from 'next'
import Link from 'next/link'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { link } from '@/db/schema'
import { LINK_TYPES } from '@/lib/links'
import ActionForm from '@/components/tabu/ActionForm'
import { Field } from '@/components/tabu/Field'
import LinkTypeIcon from '@/components/mdx/LinkTypeIcon'
import { deleteLink, saveLink } from '../actions'

export const metadata: Metadata = { title: 'Admin · Materiali e link' }

type Row = typeof link.$inferSelect

function LinkForm({ row, categories }: { row?: Row; categories: string[] }) {
  return (
    <ActionForm key={row?.id ?? 'new'} action={saveLink} submitLabel={row ? 'Salva' : 'Aggiungi'}>
      {row && <input type="hidden" name="id" value={row.id} />}
      <div className="grid gap-x-4 md:grid-cols-2">
        <Field label="Nome" name="name" defaultValue={row?.name} required className="md:col-span-2" />
        <Field label="Link" name="url" type="url" defaultValue={row?.url} required className="md:col-span-2" />
        {/* Free text: the datalist only suggests the categories already in use */}
        <label className="fieldset">
          <span className="fieldset-legend">Categoria</span>
          <input name="category" list="link-categories" required defaultValue={row?.category ?? ''} className="input w-full" />
          <datalist id="link-categories">
            {categories.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <span className="label whitespace-normal">Le righe con la stessa categoria compaiono insieme</span>
        </label>
        <label className="fieldset">
          <span className="fieldset-legend">Tipo (icona)</span>
          <select name="type" defaultValue={row?.type ?? 'link'} className="select w-full">
            {LINK_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <Field label="Ordine" name="sortOrder" type="number" defaultValue={row?.sortOrder ?? 0} hint="Crescente, dentro la categoria" />
      </div>
    </ActionForm>
  )
}

export default async function AdminLinkPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdmin()
  const { id } = await searchParams
  const rows = await db.select().from(link).orderBy(asc(link.category), asc(link.sortOrder), asc(link.id))
  const [editing] = id ? await db.select().from(link).where(eq(link.id, Number(id))) : []
  const categories = [...new Set(rows.map(r => r.category))]

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Materiali e link</h1>
      <p className="opacity-70">
        Le righe della pagina pubblica{' '}
        <Link href="/materiale" className="link">
          Materiali e link
        </Link>
        , raggruppate per categoria.
      </p>

      <section className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">{editing ? `Modifica: ${editing.name}` : 'Aggiungi un link'}</h2>
          <LinkForm row={editing} categories={categories} />
          {editing && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Link href="/tabu/admin/link/" className="btn btn-ghost btn-sm">
                Annulla
              </Link>
              <ActionForm
                action={deleteLink}
                submitLabel="Elimina"
                buttonClassName="btn btn-error btn-outline btn-sm"
                confirm={`Eliminare “${editing.name}”?`}
              >
                <input type="hidden" name="id" value={editing.id} />
              </ActionForm>
            </div>
          )}
        </div>
      </section>

      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Nome</th>
              <th className="hidden md:table-cell">Link</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className={row.id === editing?.id ? 'bg-base-200' : undefined}>
                <td>{row.category}</td>
                <td>
                  <span className="flex items-center gap-2">
                    <LinkTypeIcon type={row.type} size={16} />
                    {row.name}
                  </span>
                </td>
                <td className="hidden md:table-cell max-w-xs truncate">
                  <a href={row.url} className="link" target="_blank" rel="noopener noreferrer">
                    {row.url}
                  </a>
                </td>
                <td>
                  <Link href={`/tabu/admin/link/?id=${row.id}`} className="btn btn-ghost btn-xs">
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
