import type { Metadata } from 'next'
import { asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { staffMember } from '@/db/schema'
import ActionForm from '@/components/tabu/ActionForm'
import PhotoUploader from '@/components/tabu/PhotoUploader'
import StaffAvatar from '@/components/tabu/StaffAvatar'
import StaffFields from '@/components/tabu/StaffFields'
import { deleteStaffMember, saveStaffMember, uploadStaffPhotoAdmin } from '../actions'

export const metadata: Metadata = { title: 'Admin · Staff' }

export default async function AdminStaffPage() {
  const admin = await requireAdmin()
  const rows = await db.select().from(staffMember).orderBy(asc(staffMember.id))

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Staff</h1>
      <p className="opacity-70">
        Capi (in Co.Ca.) e RS in servizio, nell&apos;ordine in cui compaiono sul sito. Solo i capi con un&apos;email
        possono entrare nel Tabù.
      </p>

      <details className="collapse collapse-arrow bg-base-200">
        <summary className="collapse-title font-bold">Aggiungi una persona</summary>
        <div className="collapse-content">
          <ActionForm action={saveStaffMember} submitLabel="Aggiungi">
            <StaffFields />
          </ActionForm>
        </div>
      </details>

      <ul className="space-y-2">
        {rows.map(row => (
          <li key={row.id}>
            <details className="collapse collapse-arrow bg-base-200">
              <summary className="collapse-title flex items-center gap-3">
                <StaffAvatar img={row.img} name={row.nome} size={40} />
                <span className="font-bold">{row.nome}</span>
                <span className="text-sm opacity-70">{row.staff}</span>
                {!row.coca && <span className="badge badge-sm">RS</span>}
                {row.email && <span className="badge badge-sm badge-primary">accesso</span>}
                {row.isAdmin && <span className="badge badge-sm badge-secondary">admin</span>}
              </summary>
              <div className="collapse-content space-y-6">
                <ActionForm action={saveStaffMember}>
                  <StaffFields row={row} />
                </ActionForm>
                <div>
                  <h3 className="font-bold mb-2">Foto</h3>
                  <PhotoUploader action={uploadStaffPhotoAdmin} fields={{ id: String(row.id) }} />
                </div>
                {row.id !== admin.id && (
                  <ActionForm
                    action={deleteStaffMember}
                    submitLabel="Elimina"
                    buttonClassName="btn btn-error btn-outline btn-sm"
                    confirm={`Eliminare ${row.nome}? Anche il suo progetto verrà cancellato.`}
                  >
                    <input type="hidden" name="id" value={row.id} />
                  </ActionForm>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  )
}
