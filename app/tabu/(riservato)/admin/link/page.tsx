import type { Metadata } from 'next'
import Link from 'next/link'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { link } from '@/db/schema'
import { LINK_TYPES } from '@/lib/links'
import CrudPage from '@/components/tabu/CrudPage'
import { Field } from '@/components/tabu/Field'
import LinkTypeIcon from '@/components/mdx/LinkTypeIcon'
import { deleteLink, saveLink } from '../actions'

export const metadata: Metadata = { title: 'Admin · Materiali e link' }

export default async function AdminLinkPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdmin()
  const { id } = await searchParams
  const rows = await db.select().from(link).orderBy(asc(link.category), asc(link.sortOrder), asc(link.id))
  const [editing] = id ? await db.select().from(link).where(eq(link.id, Number(id))) : []
  const categories = [...new Set(rows.map(r => r.category))]

  return (
    <CrudPage
      title="Materiali e link"
      intro={
        <>
          Le righe della pagina pubblica{' '}
          <Link href="/materiale" className="link">
            Materiali e link
          </Link>
          , raggruppate per categoria.
        </>
      }
      addTitle="Aggiungi un link"
      href="/tabu/admin/link/"
      editing={editing}
      save={saveLink}
      remove={deleteLink}
      deleteConfirm={row => `Eliminare “${row.name}”?`}
      rows={rows}
      fields={row => (
        <>
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
        </>
      )}
      columns={[
        { label: 'Categoria', cell: row => row.category },
        {
          label: 'Nome',
          cell: row => (
            <span className="flex items-center gap-2">
              <LinkTypeIcon type={row.type} size={16} />
              {row.name}
            </span>
          ),
        },
        {
          label: 'Link',
          className: 'hidden md:table-cell max-w-xs truncate',
          cell: row => (
            <a href={row.url} className="link" target="_blank" rel="noopener noreferrer">
              {row.url}
            </a>
          ),
        },
      ]}
    />
  )
}
