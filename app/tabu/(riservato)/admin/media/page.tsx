import type { Metadata } from 'next'
import Link from 'next/link'
import { asc, desc, eq } from 'drizzle-orm'
import { CameraIcon, VideoCameraIcon } from '@phosphor-icons/react/ssr'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { media } from '@/db/schema'
import ActionForm from '@/components/tabu/ActionForm'
import { Field } from '@/components/tabu/Field'
import DeleteButton from '@/components/tabu/DeleteButton'
import { deleteMedia, replaceMediaUrls, saveMedia } from '../actions'

export const metadata: Metadata = { title: 'Admin · Foto e video' }

type Row = typeof media.$inferSelect

// Imported rows may hold an empty or broken link: show it instead of crashing the page
function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

function MediaForm({ row }: { row?: Row }) {
  return (
    <ActionForm
      key={row?.id ?? 'new'}
      action={saveMedia}
      submitLabel={row ? 'Salva' : 'Aggiungi'}
      extraActions={
        row && (
          <>
            <Link href="/tabu/admin/media/" className="btn btn-ghost">
              Annulla
            </Link>
            <DeleteButton action={deleteMedia} id={row.id} confirm={`Eliminare “${row.name}”?`} redirectTo="/tabu/admin/media/" />
          </>
        )
      }
    >
      {row && <input type="hidden" name="id" value={row.id} />}
      <div className="grid gap-x-4 md:grid-cols-2">
        <Field label="Nome" name="name" defaultValue={row?.name} required className="md:col-span-2" />
        <Field label="Link" name="url" type="url" defaultValue={row?.url} required className="md:col-span-2" />
        <label className="fieldset">
          <span className="fieldset-legend">Tipo</span>
          <select name="type" defaultValue={row?.type ?? 'image'} className="select w-full">
            <option value="image">Foto</option>
            <option value="video">Video</option>
          </select>
        </label>
        <Field label="Anno scout (inizio)" name="year" type="number" defaultValue={row?.year ?? new Date().getFullYear()} required hint="2024 = anno 2024-25" />
        <Field label="Id (ancora del link)" name="slug" defaultValue={row?.slug} required hint="es. 2024-campo-estivo" />
        <Field label="Ordine" name="sortOrder" type="number" defaultValue={row?.sortOrder ?? 0} hint="Crescente, a parità di anno" />
      </div>
    </ActionForm>
  )
}

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdmin()
  const { id } = await searchParams
  const rows = await db.select().from(media).orderBy(desc(media.year), asc(media.sortOrder), asc(media.id))
  const [editing] = id ? await db.select().from(media).where(eq(media.id, Number(id))) : []

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Foto e video</h1>

      <section className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">{editing ? `Modifica: ${editing.name}` : 'Aggiungi un link'}</h2>
          <MediaForm row={editing} />
        </div>
      </section>

      <details className="collapse collapse-arrow bg-base-200">
        <summary className="collapse-title font-bold">Sostituisci in tutti i link</summary>
        <div className="collapse-content">
          <p className="text-sm opacity-70 mb-2">
            Per il passaggio a Google Drive: sostituisce un pezzo di testo in ogni link che lo contiene.
          </p>
          <ActionForm action={replaceMediaUrls} submitLabel="Sostituisci" confirm="Sostituire il testo in tutti i link?">
            <div className="grid gap-x-4 md:grid-cols-2">
              <Field label="Cerca" name="find" required />
              <Field label="Sostituisci con" name="replace" />
            </div>
          </ActionForm>
        </div>
      </details>

      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Anno</th>
              <th>Nome</th>
              <th className="hidden md:table-cell">Link</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className={row.id === editing?.id ? 'bg-base-200' : undefined}>
                <td>{row.year}</td>
                <td className="flex items-center gap-2">
                  {row.type === 'image' ? <CameraIcon size={16} aria-label="Foto" /> : <VideoCameraIcon size={16} aria-label="Video" />}
                  {row.name}
                </td>
                <td className="hidden md:table-cell max-w-xs truncate">
                  {hostOf(row.url) ? (
                    <a href={row.url} className="link" target="_blank" rel="noopener noreferrer">
                      {hostOf(row.url)}
                    </a>
                  ) : (
                    <span className="badge badge-warning badge-sm">link mancante</span>
                  )}
                </td>
                <td>
                  <Link href={`/tabu/admin/media/?id=${row.id}`} className="btn btn-ghost btn-xs">
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
