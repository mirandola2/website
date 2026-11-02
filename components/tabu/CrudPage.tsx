import Link from 'next/link'
import type { ReactNode } from 'react'
import ActionForm from './ActionForm'
import DeleteButton from './DeleteButton'
import type { ActionResult } from './types'

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>

export interface Column<Row> {
  label: string
  // On both the header and the cells, e.g. 'hidden md:table-cell' to hide it on phones
  className?: string
  cell: (row: Row) => ReactNode
}

interface CrudPageProps<Row extends { id: number; name: string }> {
  title: string
  intro?: ReactNode
  // Card title when nothing is being edited ("Aggiungi un link")
  addTitle: string
  // The page URL, with the search params to keep (e.g. the totem search)
  href: string
  // The row picked with ?id=
  editing?: Row
  save: Action
  remove: Action
  deleteConfirm: (row: Row) => string
  // The form fields, empty for a new row
  fields: (row?: Row) => ReactNode
  rows: Row[]
  columns: Column<Row>[]
  // Between the form and the table: bulk tools, search box
  children?: ReactNode
}

// The admin pages for media, links and totem: the add / edit form on top, every row below with a
// "Modifica" link that reopens the form on it (?id=)
export default function CrudPage<Row extends { id: number; name: string }>({
  title,
  intro,
  addTitle,
  href,
  editing,
  save,
  remove,
  deleteConfirm,
  fields,
  rows,
  columns,
  children,
}: CrudPageProps<Row>) {
  const editHref = (id: number) => `${href}${href.includes('?') ? '&' : '?'}id=${id}`

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">{title}</h1>
      {intro && <p className="opacity-70">{intro}</p>}

      <section className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">{editing ? `Modifica: ${editing.name}` : addTitle}</h2>
          <ActionForm
            key={editing?.id ?? 'new'}
            action={save}
            submitLabel={editing ? 'Salva' : 'Aggiungi'}
            extraActions={
              editing && (
                <>
                  <Link href={href} className="btn btn-ghost">
                    Annulla
                  </Link>
                  <DeleteButton action={remove} id={editing.id} confirm={deleteConfirm(editing)} redirectTo={href} />
                </>
              )
            }
          >
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-x-4 md:grid-cols-2">{fields(editing)}</div>
          </ActionForm>
        </div>
      </section>

      {children}

      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.label} className={c.className}>
                  {c.label}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className={row.id === editing?.id ? 'bg-base-200' : undefined}>
                {columns.map(c => (
                  <td key={c.label} className={c.className}>
                    {c.cell(row)}
                  </td>
                ))}
                <td>
                  <Link href={editHref(row.id)} className="btn btn-ghost btn-xs">
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
