import type { Metadata } from 'next'
import { count, isNotNull } from 'drizzle-orm'
import { DownloadSimpleIcon } from '@phosphor-icons/react/ssr'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { member } from '@/db/schema'
import { MEMBERS_CSV_EXAMPLE, MEMBERS_CSV_HEADER } from '@/lib/members-csv'
import ActionForm from '@/components/tabu/ActionForm'
import { Checkbox } from '@/components/tabu/Field'
import { importMembers } from '../actions'

export const metadata: Metadata = { title: 'Admin · Codici socio' }

const header = MEMBERS_CSV_HEADER.join(',')
const template = `data:text/csv;charset=utf-8,${encodeURIComponent(`${header}\n${MEMBERS_CSV_EXAMPLE}\n`)}`

// Personal data: the page only shows how many members there are, never the rows
export default async function AdminSociPage() {
  await requireAdmin()
  const [{ n }] = await db.select({ n: count() }).from(member).where(isNotNull(member.birthday))

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Codici socio e compleanni</h1>
      <p className="opacity-70">
        Usati dalla ricerca del codice socio e dai compleanni in home. Ora ci sono {n} soci.
      </p>

      <section className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Formato del file</h2>
          <p>Un file CSV con questa intestazione nella prima riga, poi un socio per riga:</p>
          <pre className="bg-base-100 rounded-box p-3 text-sm overflow-x-auto">
            <code>
              {header}
              {'\n'}
              {MEMBERS_CSV_EXAMPLE}
            </code>
          </pre>
          <ul className="list-disc ps-5 text-sm space-y-1">
            <li>
              <b>codice_socio</b>: solo cifre
            </li>
            <li>
              <b>nome_cognome</b>: il nome completo, come lo si cerca nella pagina Codice socio
            </li>
            <li>
              <b>data_nascita</b>: GG/MM/AAAA (o AAAA-MM-GG)
            </li>
            <li>Separatore virgola o punto e virgola: va bene un CSV salvato da Excel</li>
          </ul>
          <a href={template} download="soci.csv" className="btn btn-outline btn-sm w-fit">
            <DownloadSimpleIcon size={16} weight="bold" aria-hidden />
            Scarica il modello
          </a>
        </div>
      </section>

      <section className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Carica il file</h2>
          <p className="text-sm opacity-70">
            Aggiunge i soci nuovi e aggiorna nome e data di chi ha già quel codice. Se una riga ha un errore non viene
            salvato niente.
          </p>
          <ActionForm action={importMembers} submitLabel="Importa" confirm="Importare il file?">
            <div className="flex flex-col items-start gap-3">
              <input type="file" name="file" accept=".csv,text/csv" required className="file-input w-full max-w-md" aria-label="File CSV" />
              <Checkbox name="replace" label="Sostituisci l’elenco intero: chi non è nel file viene cancellato (tranne capi e RS dello staff)" />
            </div>
          </ActionForm>
        </div>
      </section>
    </div>
  )
}
