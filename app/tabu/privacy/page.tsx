import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy' }

// Public on purpose (proxy.ts lets it through without a session): Google's OAuth consent screen
// links to it. It covers the Tabù only; the public site has its own policy (content/privacy-policy.mdx).
export default function TabuPrivacyPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Privacy del Tabù</h1>

      <div className="prose-container">
        <p>
          Questa informativa riguarda solo il <b>Tabù</b>, l’area riservata ai capi della Comunità Capi, e spiega quali dati
          personali tratta e perché. Per il resto del sito vale la{' '}
          <Link href="/privacy-policy/">Privacy Policy</Link> generale.
        </p>

        <h2>Titolare del trattamento</h2>
        <p>
          AGESCI Gruppo Mirandola 2, via Posta 55, Mirandola (MO). Per qualsiasi domanda sui tuoi dati scrivi a{' '}
          <a href="mailto:info@mirandola2.it">info@mirandola2.it</a>.
        </p>

        <h2>In breve</h2>
        <ul>
          <li>Possono accedere solo i capi della Comunità Capi la cui email è stata registrata dal Capo Gruppo.</li>
          <li>L’accesso avviene con il tuo account Google; non esiste una password del Tabù.</li>
          <li>Da Google riceviamo solo nome, indirizzo email e foto del profilo: nessun altro dato del tuo account.</li>
          <li>Non vendiamo né cediamo i dati a terzi e non li usiamo per pubblicità o profilazione.</li>
        </ul>

        <h2>Quali dati trattiamo</h2>

        <h3>Dati ricevuti da Google</h3>
        <p>
          Quando premi <i>Accedi con Google</i> chiediamo a Google soltanto i permessi di base (<code>openid</code>,{' '}
          <code>email</code> e <code>profile</code>) e riceviamo nome, indirizzo email, foto del profilo e i codici (token) che
          Google rilascia per quella sessione. Servono a una sola cosa: verificare che la tua email sia tra quelle abilitate e
          riconoscerti nelle visite successive. Non accediamo a Gmail, Drive, Calendar, Contatti o ad altri servizi del tuo
          account Google e la foto del profilo di Google non viene mostrata né usata.
        </p>
        <p>
          L’uso dei dati ricevuti da Google rispetta la{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
            Google API Services User Data Policy
          </a>
          , compresi i requisiti di <i>Limited Use</i>: li usiamo solo per consentirti l’accesso, non li trasferiamo ad altri
          se non per far funzionare il servizio, non li usiamo per pubblicità e nessuna persona li legge se non per esigenze di
          sicurezza o obblighi di legge.
        </p>

        <h3>Dati del tuo profilo di capo</h3>
        <p>
          Il Tabù tiene la scheda che il Capo Gruppo ha registrato per te: nome e cognome, nome di caccia, staff, ruolo, email
          di accesso e, se li hai inseriti, la descrizione e la foto. Nome, ruolo, descrizione e foto compaiono anche nelle
          pagine pubbliche dei capi e degli staff; l’email di accesso no.
        </p>

        <h3>Progetto del Capo</h3>
        <p>
          Le risposte che scrivi nel tuo Progetto del Capo sono salvate per ogni anno scout. Sono leggibili da tutti i capi
          della Comunità Capi (non dal pubblico) e modificabili solo da te. Gli amministratori possono vedere i progetti come
          ogni altro capo e gestire i modelli annuali.
        </p>

        <h3>Dati dei soci</h3>
        <p>
          Gli amministratori possono caricare l’elenco dei codici socio con nome e data di nascita, usato dalla ricerca del
          Codice Socio e dai compleanni nella pagina iniziale. I capi vedono solo il proprio codice socio; l’elenco non è
          consultabile nel Tabù.
        </p>

        <h3>Dati tecnici di sessione</h3>
        <p>
          Quando accedi salviamo una sessione con data di scadenza, indirizzo IP e tipo di browser, per mantenerti collegato e
          proteggere l’account. Sul tuo dispositivo viene salvato un cookie tecnico di accesso (
          <code>better-auth.session_token</code>), che scade dopo 7 giorni e si cancella con il pulsante <i>Esci</i>, e un
          cookie tecnico che serve solo a mostrare l’icona di accesso nel menu del sito. Non usiamo cookie di profilazione né
          di tracciamento.
        </p>

        <h2>Base giuridica</h2>
        <p>
          L’accesso e la gestione della scheda sono trattati per il legittimo interesse del Titolare a organizzare l’attività
          della Comunità Capi e a proteggere l’area riservata dagli accessi non autorizzati (art. 6.1.f GDPR). La foto e la
          descrizione sono facoltative: le pubblichiamo con il tuo consenso (art. 6.1.a), che puoi revocare in ogni momento
          dalla pagina <i>Profilo</i>.
        </p>

        <h2>Con chi condividiamo i dati</h2>
        <p>Il Tabù si appoggia a fornitori che trattano i dati solo per erogare il servizio:</p>
        <ul>
          <li>
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google
            </a>
            : autenticazione (<i>Accedi con Google</i>);
          </li>
          <li>
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              Vercel
            </a>
            : hosting, nella regione di Francoforte;
          </li>
          <li>
            <a href="https://turso.tech/privacy-policy" target="_blank" rel="noopener noreferrer">
              Turso
            </a>
            : database, a Francoforte;
          </li>
          <li>
            <a href="https://imagekit.io/privacy-policy" target="_blank" rel="noopener noreferrer">
              ImageKit
            </a>
            : archiviazione e distribuzione delle foto dei capi.
          </li>
        </ul>
        <p>
          Alcuni fornitori hanno sede negli Stati Uniti: il trasferimento avviene sulla base delle garanzie previste dal GDPR
          (decisioni di adeguatezza, come l’EU-U.S. Data Privacy Framework, o clausole contrattuali standard).
        </p>

        <h2>Per quanto tempo li conserviamo</h2>
        <p>
          I dati dell’account restano finché la tua email è abilitata. Quando smetti di far parte della Comunità Capi il Capo
          Gruppo disattiva il tuo accesso: da quel momento non puoi più entrare e la tua scheda non compare più sul sito. I
          Progetti del Capo già scritti sono conservati come archivio della Comunità Capi; puoi chiederne la cancellazione
          scrivendo al Titolare. Le sessioni scadono dopo 7 giorni senza accessi.
        </p>

        <h2>I tuoi diritti</h2>
        <p>
          Puoi chiedere in ogni momento l’accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione del trattamento o
          opporti al trattamento (artt. 15-22 GDPR) scrivendo a{' '}
          <a href="mailto:info@mirandola2.it">info@mirandola2.it</a>. Puoi inoltre revocare l’accesso che hai dato a questo sito
          dalle impostazioni del tuo account Google (<i>Sicurezza → Accesso di terze parti</i>) e proporre reclamo al{' '}
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
            Garante per la protezione dei dati personali
          </a>
          .
        </p>

        <h2>Modifiche</h2>
        <p>
          Se questa informativa cambia, la versione aggiornata sarà pubblicata su questa pagina. Vedi anche i{' '}
          <Link href="/tabu/termini/">Termini di servizio</Link> del Tabù.
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
