import type { staffMember } from '@/db/schema'
import { isLcStaff } from '@/lib/staff'
import { Checkbox, Field, TextArea } from './Field'

type Row = typeof staffMember.$inferSelect

// Every staff_member field, for saveStaffMember (admin: /tabu/admin/staff and their own profile)
export default function StaffFields({ row }: { row?: Row }) {
  // The description is shown only on the L/C pages: other rows keep theirs without the field
  const showDesc = !row || isLcStaff(row.staff)

  return (
    <>
      {row && <input type="hidden" name="id" value={row.id} />}
      {/* Access flags first and highlighted: they decide who can enter the Tabù and manage it */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-box border border-base-300 bg-base-100 px-4 py-2 mb-2 font-bold">
        <Checkbox label="In Co.Ca. (capo)" name="coca" defaultChecked={row ? row.coca : true} />
        <Checkbox label="Admin" name="isAdmin" defaultChecked={row?.isAdmin} />
      </div>
      <div className="grid gap-x-4 md:grid-cols-2">
        <Field label="Nome e cognome" name="nome" defaultValue={row?.nome} required />
        <Field label="Nome di caccia (L/C)" name="nomeCaccia" defaultValue={row?.nomeCaccia} />
        <Field label="Staff" name="staff" defaultValue={row?.staff} required hint="L, C, E, G, N, CF, CC, CJ; doppi servizi: E|CJ" />
        <Field label="Ruolo" name="ruolo" defaultValue={row?.ruolo} hint="Uno per staff, con lo stesso ordine: Capo Reparto|Capo Gruppo" />
        <Field label="Email di accesso" name="email" type="email" defaultValue={row?.email} hint="Solo capi in Co.Ca.: l'account Google con cui entra nel Tabù" />
      </div>
      {showDesc ? (
        <TextArea label="Descrizione (pagine L/C)" name="desc" defaultValue={row?.desc} />
      ) : (
        <input type="hidden" name="desc" value={row?.desc ?? ''} />
      )}
    </>
  )
}
