import type { Metadata } from 'next'
import { asc, isNull } from 'drizzle-orm'
import { DownloadSimpleIcon } from '@phosphor-icons/react/ssr'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { staffMember } from '@/db/schema'
import { isPlaceholderCode } from '@/lib/member-code'
import ActionForm from '@/components/tabu/ActionForm'
import PhotoUploader from '@/components/tabu/PhotoUploader'
import StaffAvatar from '@/components/tabu/StaffAvatar'
import StaffFields from '@/components/tabu/StaffFields'
import StaffList from '@/components/tabu/StaffList'
import { deleteStaffMember, resetCocaOrder, saveStaffMember, saveStaffOrder, uploadStaffPhotoAdmin } from '../actions'

export const metadata: Metadata = { title: 'Admin · Staff' }

export default async function AdminStaffPage() {
  const admin = await requireAdmin()
  // Removed rows stay in the database for their projects, but not in this list
  const rows = await db
    .select()
    .from(staffMember)
    .where(isNull(staffMember.deletedAt))
    .orderBy(asc(staffMember.position), asc(staffMember.memberCode))
  // Same order as the Coca page (components/mdx/Staff.tsx): the override first, then the main order
  const leaders = rows.filter(r => r.coca)
  const cocaCustom = leaders.some(r => r.order !== null)
  const cocaIds = leaders.toSorted((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)).map(r => r.memberCode)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-4xl text-primary">Staff</h1>
        <a href="/tabu/admin/export/staff/" download className="btn btn-outline btn-sm">
          <DownloadSimpleIcon size={16} weight="bold" aria-hidden />
          Esporta CSV
        </a>
      </div>
      <p className="opacity-70">
        Capi (in Co.Ca.) e RS in servizio, nell&apos;ordine in cui compaiono sul sito. Solo i capi con un&apos;email
        possono entrare nel Tabù. Ogni persona è identificata dal suo codice socio: chi non ce l&apos;ha ancora ha un
        codice provvisorio, da correggere appena lo si conosce (i suoi progetti lo seguono).
      </p>

      <details className="collapse collapse-arrow bg-base-200">
        <summary className="collapse-title font-bold">Aggiungi una persona</summary>
        <div className="collapse-content">
          <ActionForm action={saveStaffMember} submitLabel="Aggiungi">
            <StaffFields />
          </ActionForm>
        </div>
      </details>

      <StaffList
        rows={rows.map(row => ({
          id: row.memberCode,
          summary: (
            <>
              <StaffAvatar img={row.img} name={row.nome} size={40} />
              <span className="font-bold">{row.nome}</span>
              <span className="text-sm opacity-70">{row.staff}</span>
              {!row.coca && <span className="badge badge-sm">RS</span>}
              {isPlaceholderCode(row.memberCode) && <span className="badge badge-sm badge-warning">senza codice socio</span>}
              {row.email && <span className="badge badge-sm badge-primary">accesso</span>}
              {row.isAdmin && <span className="badge badge-sm badge-secondary">admin</span>}
            </>
          ),
          content: (
            <>
              <ActionForm action={saveStaffMember}>
                <StaffFields row={row} />
              </ActionForm>
              <div>
                <h3 className="font-bold mb-2">Foto</h3>
                <PhotoUploader action={uploadStaffPhotoAdmin} fields={{ id: row.memberCode }} />
              </div>
              {row.memberCode !== admin.memberCode && (
                <ActionForm
                  action={deleteStaffMember}
                  submitLabel="Elimina"
                  buttonClassName="btn btn-error btn-outline btn-sm"
                  confirm={`Eliminare ${row.nome}? Sparisce dal sito e non può più accedere; i suoi progetti restano.`}
                >
                  <input type="hidden" name="id" value={row.memberCode} />
                </ActionForm>
              )}
            </>
          ),
        }))}
        cocaIds={cocaIds}
        cocaCustom={cocaCustom}
        saveOrder={saveStaffOrder}
        resetCocaOrder={resetCocaOrder}
      />
    </div>
  )
}
