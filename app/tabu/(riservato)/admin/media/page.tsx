import type { Metadata } from 'next'
import { asc, desc, eq } from 'drizzle-orm'
import { CameraIcon, VideoCameraIcon } from '@phosphor-icons/react/ssr'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { media } from '@/db/schema'
import ActionForm from '@/components/tabu/ActionForm'
import CrudPage from '@/components/tabu/CrudPage'
import { Field } from '@/components/tabu/Field'
import { deleteMedia, replaceMediaUrls, saveMedia } from '../actions'

export const metadata: Metadata = { title: 'Admin · Foto e video' }

// Imported rows may hold an empty or broken link: show it instead of crashing the page
function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdmin()
  const { id } = await searchParams
  const rows = await db.select().from(media).orderBy(desc(media.year), asc(media.sortOrder), asc(media.id))
  const [editing] = id ? await db.select().from(media).where(eq(media.id, Number(id))) : []

  return (
    <CrudPage
      title="Foto e video"
      addTitle="Aggiungi un link"
      href="/tabu/admin/media/"
      editing={editing}
      save={saveMedia}
      remove={deleteMedia}
      deleteConfirm={row => `Eliminare “${row.name}”?`}
      rows={rows}
      fields={row => (
        <>
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
        </>
      )}
      columns={[
        { label: 'Anno', cell: row => row.year },
        {
          label: 'Nome',
          cell: row => (
            <span className="flex items-center gap-2">
              {row.type === 'image' ? <CameraIcon size={16} aria-label="Foto" /> : <VideoCameraIcon size={16} aria-label="Video" />}
              {row.name}
            </span>
          ),
        },
        {
          label: 'Link',
          className: 'hidden md:table-cell max-w-xs truncate',
          cell: row =>
            hostOf(row.url) ? (
              <a href={row.url} className="link" target="_blank" rel="noopener noreferrer">
                {hostOf(row.url)}
              </a>
            ) : (
              <span className="badge badge-warning badge-sm">link mancante</span>
            ),
        },
      ]}
    >
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
    </CrudPage>
  )
}
