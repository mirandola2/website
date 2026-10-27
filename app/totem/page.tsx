import type { Metadata } from 'next'
import Hero from '@/components/Hero'
import { getTotem } from '@/lib/data'
import TotemTable from './TotemTable'

export const metadata: Metadata = {
  title: 'Nomi Totem',
  description: 'Archivio dei nomi totem delle guide e degli scout del Gruppo Scout Mirandola 2.',
}

export default async function TotemPage() {
  const totem = await getTotem()

  return (
    <>
      <Hero title="Nomi Totem" image="/img/misc/fuoco.jpg" />
      <TotemTable totem={totem}>
        <p className="my-8 text-justify">
          Il Totem è un nome, di solito di un animale (ma a volte anche di piante,
          alberi o agenti atmosferici), seguito da un aggettivo, che viene dato
          alle guide e agli scout per sottolineare una loro caratteristica.
          Normalmente il nome dell&apos;animale richiama una caratteristica fisica
          della persona, mentre l&apos;aggettivo una caratteristica della personalità.
          In passato, nel nostro gruppo, il totem veniva assegnato alle guide del
          primo anno (prima media) e agli scout dell&apos;ultimo anno (seconda
          superiore), successivamente è stato assegnato in terza media (dal 1991 per
          gli scout e dal 2006 per le guide). Oggi invece viene assegnato in prima superiore con una cerimonia chiamata
          &ldquo;totemizzazione&rdquo;. Durante questa cerimonia la guida o lo scout per
          ricevere il suo &ldquo;Totem&rdquo; dovrà superare delle prove che testimonieranno
          il suo valore.
        </p>
      </TotemTable>
    </>
  )
}
