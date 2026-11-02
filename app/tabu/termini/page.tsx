import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Termini di servizio' }

// Public on purpose (proxy.ts lets it through without a session): Google's OAuth consent screen
// links to it.
export default function TabuTermsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Termini di servizio del Tabù</h1>

      <div className="prose-container">
        <p>
          Il <b>Tabù</b> è l’area riservata del sito di AGESCI Gruppo Mirandola 2 (<code>mirandola2.it</code>) a disposizione
          dei capi della Comunità Capi. Accedendo al Tabù accetti queste condizioni; se non le accetti, non usare il servizio.
        </p>

        <h2>1. Chi può usarlo</h2>
        <p>
          Il Tabù è riservato ai capi della Comunità Capi del Gruppo. Puoi accedere solo con l’account Google corrispondente
          all’email che il Capo Gruppo ha registrato per te. Se l’email non è abilitata l’accesso viene rifiutato; non è
          possibile registrarsi da soli.
        </p>

        <h2>2. Il tuo account</h2>
        <ul>
          <li>L’accesso è personale: non condividerlo e non usare l’account di un altro capo.</li>
          <li>Sei responsabile di ciò che viene fatto con il tuo account Google finché sei collegato.</li>
          <li>Esci dal Tabù (<i>Esci</i>) quando usi un dispositivo che non è tuo.</li>
          <li>Se sospetti un accesso non autorizzato avvisa subito il Capo Gruppo.</li>
        </ul>

        <h2>3. Cosa puoi fare</h2>
        <p>
          Nel Tabù puoi scrivere il tuo Progetto del Capo, leggere quelli degli altri capi, consultare il tuo codice socio e
          aggiornare foto e descrizione. Gli amministratori possono inoltre gestire staff, accessi, materiali, link, totem, foto
          e video del sito.
        </p>

        <h2>4. Regole d’uso</h2>
        <ul>
          <li>Usa il Tabù solo per le attività del Gruppo e della Comunità Capi.</li>
          <li>
            I Progetti degli altri capi e i dati dei soci sono riservati: non copiarli, non diffonderli fuori dalla Comunità
            Capi e non usarli per altri scopi.
          </li>
          <li>
            Inserisci solo contenuti tuoi o che hai il diritto di usare; per la foto scegli un’immagine in cui sei tu e che sei
            contento di vedere sul sito pubblico.
          </li>
          <li>Non scrivere nel Tabù dati personali di minori o dati di salute, né contenuti offensivi, illeciti o non pertinenti.</li>
          <li>
            Non cercare di aggirare i controlli di accesso, di leggere dati ai quali non hai diritto o di compromettere il
            funzionamento del servizio.
          </li>
        </ul>

        <h2>5. I tuoi contenuti</h2>
        <p>
          I testi, la foto e la descrizione che inserisci restano tuoi. Ci autorizzi a conservarli e a mostrarli nel modo
          descritto nell’<Link href="/tabu/privacy/">informativa sulla privacy</Link>: il Progetto del Capo a tutti i capi, la
          foto e la descrizione nelle pagine pubbliche dei capi e degli staff. Puoi modificare o togliere la foto e la
          descrizione in ogni momento dalla pagina <i>Profilo</i>.
        </p>

        <h2>6. Sospensione e fine dell’accesso</h2>
        <p>
          L’accesso dura finché fai parte della Comunità Capi. Il Capo Gruppo può disattivarlo quando lasci il servizio o se le
          regole di questi termini non vengono rispettate. Puoi smettere di usare il Tabù in ogni momento e revocare l’accesso
          di questo sito dal tuo account Google.
        </p>

        <h2>7. Disponibilità del servizio</h2>
        <p>
          Il Tabù è un servizio gratuito, gestito da volontari. Lo mettiamo a disposizione così com’è, senza garanzia di
          funzionamento continuo o assenza di errori: può essere sospeso o modificato per manutenzione o aggiornamenti. Ti
          consigliamo di tenere una copia di ciò che scrivi. Nei limiti consentiti dalla legge, il Gruppo non risponde di danni
          derivanti da interruzioni o perdite di dati del servizio, salvo dolo o colpa grave.
        </p>

        <h2>8. Privacy</h2>
        <p>
          Il trattamento dei dati personali è descritto nell’<Link href="/tabu/privacy/">informativa sulla privacy del Tabù</Link>
          , che fa parte di questi termini.
        </p>

        <h2>9. Modifiche</h2>
        <p>
          Possiamo aggiornare questi termini, ad esempio quando il Tabù cambia. La versione in vigore è sempre quella pubblicata
          su questa pagina; se continui a usare il Tabù dopo una modifica la accetti.
        </p>

        <h2>10. Legge applicabile e contatti</h2>
        <p>
          Questi termini sono regolati dalla legge italiana. Per domande o segnalazioni scrivi a{' '}
          <a href="mailto:info@mirandola2.it">info@mirandola2.it</a> o, per problemi tecnici, a{' '}
          <a href="mailto:web@mirandola2.it">web@mirandola2.it</a>.
        </p>

        <p>
          <b>Ultima modifica: 3 novembre 2026</b>
        </p>
      </div>

      <Link href="/tabu/login/" className="btn btn-ghost">
        ← Torna all’accesso
      </Link>
    </div>
  )
}
