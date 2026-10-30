# Frontend Sito Mirandola 2 ⚜️

> ℹ️ _Il ruolo di questo file è duplice: in primis funge da documentazione per coloro che hanno creato sviluppato il sito ma hanno altresì scarsissima memoria. In secondo luogo vuole essere, anche e soprattutto, una sorta di guida per chi a prescindere dalle proprie competenze vorrebbe_ capirci qualcosa _ed è curioso di cosa tiene in piedi il “frontend” del sito del Mirandola 2. Per questa duplice natura - e nell'ottica del principio scout del Trapasso Nozioni - si è cercato di usare un linguaggio chiaro e spiegare cose che per alcuni possono essere ovvie pur sapendo che d'altra parte per forza di cose questo non potrà bastare a capire tutto tutto. Sicuramente è meglio di niente; se vorrete leggerlo, buona caccia!_

Il frontend è la parte di un sito web che è visibile dall'utente. Nel nostro caso è stata costruita usando Next.js e Tailwind. Quest'ultimo è un framework CSS utilizzato insieme alla libreria Daisy UI per semplificare la parte di design del sito. Next.js è invece un framework JavaScript (in questo progetto scritto in TypeScript) che permette di costruire siti, anche statici, utilizzando **React**. Le icone del sito vengono dalla libreria [Phosphor Icons](https://phosphoricons.com/).

Le pagine pubbliche sono statiche: vengono precompilate in pagine HTML, CSS e JavaScript al momento della build, senza bisogno di generare i contenuti a ogni richiesta dell’utente. A differenza dei siti tradizionali dinamici, che generano le pagine in tempo reale, questo permette una performance più elevata. I dati che cambiano (capi, totem, foto e video, materiali e link, compleanni) si trovano invece in un piccolo database (vedi [Database](#database-)): quando vengono modificati, Next.js rigenera solo le pagine interessate, senza bisogno di una nuova build.

Fino ad ottobre 2026, il sito era fatto con Nuxt, un framework basato su Vue. 

In questa repository è presente e qui documentato il frontend, mentre il [Middleware 📤 si può trovare qui](https://github.com/mirandola2/middleware).

#### Indice
- [Introduzione](#frontend-sito-mirandola-2-)
   * [Local development 🪄](#local-development-)
   * [Content update ✏️](#content-update-)
      + [MDX syntax](#mdx-syntax)
         - [Cards & card](#cards--card)
         - [Table of contents](#table-of-contents)
         - [Figures](#figures)
            * [Caroselli](#caroselli)
            * [Immagini nel testo](#immagini-nel-testo)
         - [Quoted](#quoted)
         - [Staff](#staff)
         - [Button Link](#button-link)
         - [Altri componenti](#altri-componenti)
      + [Front Matter](#front-matter)
      + [Menu](#menu)
   * [Database 🗄️](#database-)
   * [Tabù 🔒](#tabù-)
   * [Immagini 🖼️](#immagini-)
   * [Analytics 📊](#analytics-)
   * [Hosting ☁️](#hosting-)


## Local development 🪄

Per far partire il local server (su [http://localhost:3000](http://localhost:3000)):

```sh
npm install
cp .env.example .env.local   # poi compilare i valori (vedi sotto)
npm run db:migrate           # crea le tabelle in local.db
npm run dev
```

In locale il database è un semplice file SQLite, `local.db` (escluso da git: contiene dati personali). Per riempirlo vedi [Database](#database-).

Per provare la build di produzione (pagine statiche, cache e revalidazione come online):

```sh
npm run build
npm start
```

I test (per ora la logica dei compleanni) si lanciano con `npm test`.

Pushando le modifiche su Github, il sito verrà automaticamente aggiornato.

## Content update ✏️

> __Premessa__: Questo paragrafo vuole essere d'aiuto per chiunque voglia modificare il sito senza avere particolari rudimenti su [Next.js](https://nextjs.org/) o React. Logicamente non si è potuto inserire tutto lo scibile sull'argomento; perciò si rimanda il lettore alla documentazione ufficiale nel caso si volessero fare modifiche più profonde al sito.

I contenuti del sito sono renderizzati a partire da file presenti in due fonti:

- la cartella `content` ospita le pagine in formato [MDX](https://mdxjs.com/), ovvero [Markdown](https://markdownguide.org/cheat-sheet/) a cui si possono aggiungere componenti. Ogni file `.mdx` diventa automaticamente una pagina con lo stesso percorso (es. `content/eg/brownsea.mdx` → `/eg/brownsea`, `content/lc/index.mdx` → `/lc`). I file che iniziano per `_` non diventano pagine: sono file particolari con funzioni specifiche (contenuti della home e file `.csv`).
- la cartella `app` ospita le pagine scritte direttamente in React (la home, il blog, l'archivio totem) oltre che il template standard delle pagine al punto precedente (`app/[...slug]/page.tsx`). I componenti usati da queste pagine si trovano nella cartella `components`.

I contenuti nella carta __"In primo piano"__ presente nella home sono invece modificabili dal file `content/_home.mdx`.

I singoli articoli della sezione blog sono anch'essi pagine MDX, presenti nella cartella `content/blog`.

Essendo il Markdown un linguaggio estremamente comodo, si è preferito usare il più possibile la cartella `content`, lasciando nei file React solamente ciò che era troppo complesso per essere scritto in Markdown.

Si noti infine che le immagini **non** si trovano nella cartella `public`, ma su ImageKit (vedi [Immagini](#immagini-)). Si è cercato di caricare solo le immagini principali, compresse il più possibile, tenendo sempre a mente il fatto che la maggioranza di esse nonché i file esterni, è meglio caricarli su altri cloud (Google Photos, One Drive, Google Drive etc.). Quando vengono linkate le immagini nelle varie pagine, il percorso è relativo alla cartella radice di ImageKit (es. `/img/misc/img.jpg`).

### MDX syntax

Le pagine nella cartella `content` sono in formato MDX, ovvero un markdown "potenziato" che permette di inserire componenti React con una sintassi simile all'HTML (più info nella [documentazione ufficiale](https://mdxjs.com/docs/what-is-mdx/)).

```mdx
<Componente parametro="valore">
contenuto
</Componente>

<ComponenteSenzaContenuto parametro="valore" />
```

Attenzione: i parametri testuali vanno tra virgolette (`title="Titolo"`), quelli numerici o booleani tra graffe (`float={0}`); un parametro booleano scritto da solo vale `true` (`big`). Inoltre, a differenza del Markdown semplice, caratteri come `<` e `{` nel testo vanno evitati o scritti come `&lt;` e `&#123;`.

I componenti si trovano nella cartella `/components/mdx` e vengono registrati nel file `mdx-components.tsx` (un nuovo componente va aggiunto lì per poterlo usare nelle pagine). Attualmente sono i seguenti.

#### Cards & card

Due componenti da usare insieme, permettono di visualizzare tante _carte_ testuali in modalità galleria. Come si può vedere nell'esempio, il blocco `Cards` contiene le singole `Card`.

```mdx
<Cards>
<Card title="La Legge" color="lc" big>
Il lupetto pensa agli altri come a se stesso.  
Il lupetto vive con gioia e lealtà insieme al branco.
</Card>

<Card title="Il Motto" color="lc">
Del Nostro Meglio
</Card>
</Cards>
```

I parametri di `Card` sono:  

- `title`: stringa, opzionale, sarà visualizzato come il titolo della carta
- `color`: stringa, opzionale (`lc` | `eg` | `rs` | `cc` | `primary` | `base`), rappresenta il colore della carta. Altrimenti sarà di colore neutro (`base`).
- `big`: boolean, opzionale. Se vero, la carta sarà grande il doppio su certi schermi

#### Table of contents

```mdx
<TableOfContents />
```

Fa apparire un indice della pagina nella parte destra della pagina sui dispositivi non mobili, al centro altrimenti. Per far sì che sia a larghezza intera su tutti i dispositivi, è necessario il parametro opzionale `notaside`. Il parametro opzionale `maxdepth` (default `2`) indica fino a quale livello di titoli mostrare.

#### Figures

```mdx
<Fig src="/img/misc/img.jpg" desc="La descrizione dell'immagine" float={1} alt="Immagine di esempio" />
```

Mostra un'immagine formattata usando la grafica del sito; cliccandola si apre a schermo intero. I parametri sono:

- `src` string | string[], obbligatorio: percorso dell'immagine su ImageKit, oppure URL esterno
- `desc` string | string[], opzionale: descrizione che appare sotto all'immagine
- `alt` string, opzionale: testo alternativo per migliorare l'accessibilità ([cos'è?](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/alt))
- `float` number, opzionale: regola come apparirà l'immagine: `0` la farà apparire centrata e a larghezza ampia, `1` la farà diventare float a sinistra, `2` (default) float a destra.

##### Caroselli

Le proprietà `src` e `desc` possono anche avere più immagini, in modo da creare un carosello. La sintassi deve essere la seguente: 

```mdx
<Fig src={'["/path0.jpg", "/path1.jpg"]'} desc={'["Caption Img 0", "Caption Img 1"]'} />
```

##### Immagini nel testo

Le immagini in Markdown semplice (`![testo alternativo](/img/misc/img.jpg)`) passano anch'esse da ImageKit. Per un link testuale che apre un'immagine a schermo intero si può invece usare `ImageLink`:

```mdx
presso il <ImageLink src="img/misc/box-luca.jpg">Box Luca</ImageLink>
```

#### Quoted

```mdx
<Quoted>
...e quando Hathi, l'elefante selvaggio che vive cento anni e più, vide affiorare una lunga e sottile cresta di Roccia Azzurrina, proprio nel bel mezzo della corrente, capì che quella era la roccia della pace ed immediatamente alzò la proboscide e proclamò la "tregua dell'acqua".  
</Quoted>
```

Il blocco `Quoted` permette di creare una citazione.

#### Staff

```mdx
<Staff staff="L" />
```

Parametri:  

- `staff`: stringa, indica quale staff mostrare [L | C | E | G | N | CF | CC | CJ | *] (rispettivamente, lupetti, coccinelle, esploratori, guide, noviziato, clan-fuoco, coca (altri incarichi), capi gruppo, tutti). 
- `coca`: booleano, opzionale. Se vero, mostra solo i capi in CoCa, con nome e cognome.
- `selector`: booleano, opzionale. Se vero, mostra dei pulsanti per passare da una staff all'altra.

Il blocco mostra tutti i capi di una certa staff. I capi sono letti dalla tabella `staff_member` del database (vedi [Database](#database-)).


#### Button Link

Mostra il testo di un link all'interno di un bottone, con un'icona opzionale.

```mdx
<Lnk href="https://example.com" icon="checklist">
Testo del Bottone
</Lnk>
```

- `href`: stringa, obbligatorio: il link
- `icon`: stringa, opzionale. Le icone disponibili sono `newspaper`, `movie`, `checklist`, `other_admission`, `center_focus_strong`, `open_in_new` ed `east` (i nomi sono quelli storici di Material Symbols, ora mappati su icone Phosphor). Per aggiungerne una nuova, basta aggiungere una voce al dizionario `icons` in `components/mdx/Lnk.tsx`.
- `self`: booleano, opzionale. I link esterni si aprono in una nuova scheda; con `self` si aprono nella stessa.

#### Altri componenti

Componenti più specifici, usati ciascuno in una sola pagina e senza parametri (se non indicato):

- `<GroupSize />`: mostra i numeri del gruppo (pagina _Il Gruppo_); i numeri sono scritti direttamente in `components/mdx/GroupSize.tsx`
- `<LnkYearGrid />`: griglia per anno di foto e video, letti dalla tabella `media` del database (pagina _Foto e Video_)
- `<LinkList />`: materiali e link raggruppati per categoria, con un filtro per categoria, letti dalla tabella `link` del database (pagina _Materiali e link_)
- `<CodiceSocio lastupdate="2022-23" />`: ricerca del codice socio (pagina _Ricerca Codice Socio_). La ricerca avviene sul server (`app/actions/member.ts`) e funziona solo se il cookie `psk` contiene lo sha256 del "Token Magico", confrontato con `MEMBER_PSK_SHA256`
- `<Morse />`: traduttore Morse
- `<Alci />`: generatore di alci, con esportazione in PDF
- `<MyDiv>`: semplice contenitore, utile per raggruppare contenuti

### Front Matter

Nei blog post come nelle pagine MDX, esiste una sezione chiamata front matter, scritta in YAML, utile a inserire proprietà e metadati. ([documentazione ufficiale](https://mdxjs.com/guides/frontmatter/)).

Per quanto riguarda le pagine, il front-matter supportato è il seguente.

```md
---
title: "Titolo della pagina"
image: /path/img.jpg # immagine di copertina, usata anche nelle anteprime social
description: "Descrizione per i motori di ricerca" # opzionale
---
```

Per i singoli post presenti nella cartella `content/blog`, invece:  

```md
---
title: "Titolo"
img: '/path/cover.jpg'
category: 'cc' # lc | eg | rs | cc
date: 2023-10-15
description: "Breve descrizione mostrata nell'anteprima del post"
---
```

### Menu

Il menu è gestito nel file `components/navigation.ts`, e in particolare nella lista `menuItems`. Ogni voce ha un'etichetta (`label`) e un link (`href`) oppure una lista di sotto-voci (`children`).

Esempio:

```ts
export const menuItems: MenuItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Chi Siamo',
    children: [
      { label: "L'Associazione", href: '/associazione' },
      { label: 'Il Gruppo', href: '/gruppo' },
    ],
  },
]
```

Nello stesso file, la lista `utilityItems` contiene gli strumenti (codice socio, Morse, alci, totem) mostrati nel menu rapido dell'header.

## Database 🗄️

I dati che cambiano nel tempo sono in un database SQLite ospitato gratuitamente su [Turso](https://turso.tech) (in locale, il file `local.db`), letto con [Drizzle ORM](https://orm.drizzle.team). Lo schema è in `db/schema.ts`, le migrazioni in `db/migrations/`.

| Tabella | Contenuto | Usata da |
|---|---|---|
| `totem` | nomi totem | pagina `/totem` |
| `member` | codici socio, nomi e date di nascita (dati personali!) | `CodiceSocio`, `/api/birthdays` (solo nome e iniziale) |
| `staff_member` | capi (`coca = 1`) e RS in servizio (`coca = 0`) | `<Staff />` |
| `media` | link alle raccolte di foto e video | `<LnkYearGrid />` |
| `link` | materiali e link, con categoria e tipo (icona) | `<LinkList />` (pagina `/materiale`) |
| `year_project` | Progetto del Capo di ogni capo, per anno: le risposte, per area e domanda del modello dell'anno | Tabù |
| `scout_year` | anni del Progetto del Capo, aggiunti dagli admin: modello (aree × domande), visibile, attivo | Tabù |
| `user`, `session`, `account`, `verification` | accessi al Tabù (gestite da Better Auth) | Tabù |

Le letture delle pagine pubbliche sono in `lib/data.ts` e sono in cache: le pagine restano statiche e vengono rigenerate solo quando una modifica chiama `revalidateTag`.

Comandi utili:

```sh
npm run db:generate                      # dopo aver modificato db/schema.ts: crea una nuova migrazione
npm run db:migrate                       # applica le migrazioni al database di TURSO_DATABASE_URL
npm run db:studio                        # interfaccia web per guardare e modificare i dati
npm run db:import-d1 -- d1.sql           # importa totem e codici socio da un export del vecchio Worker
npm run db:import-csv -- staff           # importa/aggiorna i capi da content/_capi.csv
npm run db:import-csv -- media           # sostituisce i link foto/video con content/_media.csv
npm run db:set-leader -- <slug> <email> [--admin]   # email di accesso al Tabù di un capo
```

L'export del vecchio database Cloudflare D1 si ottiene, dalla cartella del Worker, con `npx wrangler d1 export people --remote --output=d1.sql`.

Note sui capi (`staff_member`):

- Il nome mostrato dipende dalla pagina: nelle pagine con `coca` si vedono nome e cognome; nelle pagine L/C (`staff == {L, C}`) solo il `nomeCaccia`, ovvero il personaggio interpretato dai capi in LC (non il nome Totem), in modo da mantenere i capi anonimi ai bambini; nelle altre pagine solo il nome di battesimo.
- Se nel campo `ruolo` è presente una `|`, il contenuto antecedente verrà mostrato quando `staff == *`, il contenuto successivo negli altri casi. 
- Separare i doppi incarichi con un `|` nel campo `staff`. I valori possibili sono gli stessi riportati in precedenza.
- Il campo `img` è il nome della foto del capo nella cartella `/img/staff` su ImageKit (se il percorso della foto è `/img/staff/capo.jpg`, il campo deve essere `capo.jpg`); le foto caricate dal Tabù salvano invece il percorso completo.
- Il campo `position` è l'ordine principale, usato in tutte le pagine dello staff: si cambia trascinando le righe in *Admin → Staff → Cambia l'ordine* (l'import CSV lo prende dall'ordine delle righe).
- Il campo `order` è facoltativo e vale solo per la pagina Co.Ca.: i capi che lo hanno compaiono prima, in ordine crescente, gli altri seguono l'ordine principale. Si imposta dalla scheda *Pagina Co.Ca.* dello stesso pannello, che può anche riportarlo all'ordine principale.
- Solo i capi (`coca = 1`) possono avere un'email: il database rifiuta un'email su una riga RS.

Le citazioni (`<Quote type="..." />`) non cambiano mai e sono in `content/quotes.ts`.

## Tabù 🔒

Il Tabù (`/tabu`, nel menu *Strumenti*) è l'area riservata ai capi: ognuno compila il proprio Progetto del Capo (leggibile da tutti i capi, modificabile solo da chi l'ha scritto, dopo aver premuto *Modifica* se è già salvato), vede il proprio codice socio e cambia la propria foto (e la descrizione, per i capi L/C). In *Admin → Progetti del Capo* si aggiungono gli anni e si sceglie quali sono visibili e quali ancora modificabili (attivi). Ogni anno ha il suo modello: le aree (le schede del progetto, all'inizio le quattro del modello cartaceo) e le domande, uguali in ogni area, di tipo testo lungo, testo breve o verifica 1–5; un anno nuovo copia il modello di un anno esistente. Il modello si cambia da *Modello → Modifica il modello* e la modifica vale anche per i progetti già compilati: le risposte seguono la propria area e domanda anche se rinominate, quelle delle aree e domande tolte vengono cancellate. Gli admin gestiscono anche staff (email di accesso comprese), link di foto e video, materiali e link e totem: le modifiche compaiono sul sito pubblico in pochi secondi, senza nuovo deploy.

- **Accesso**: con Google ([Better Auth](https://www.better-auth.com), `lib/auth.ts`). Possono entrare solo le email presenti su una riga di `staff_member` con `coca = 1`; gli RS in servizio non possono avere un'email. Il primo admin si crea con `npm run db:set-leader -- <slug> <email> --admin`, poi le email si gestiscono da *Admin → Staff*.
- **Controlli**: `proxy.ts` rimanda al login chi non ha il cookie di sessione, ma il controllo vero è in `lib/dal.ts` (`requireLeader()` / `requireAdmin()`), chiamato da ogni pagina e ogni server action.
- **Foto**: il browser ritaglia la foto in un quadrato 256×256 (massimo 100 KB); il server la carica su ImageKit (cartella `IMAGEKIT_STAFF_FOLDER`: `/dev/staff/` in locale, `/img/staff/` online) e cancella la precedente solo se era stata caricata dal sito.
- **Google**: nel client OAuth della Google Cloud console vanno autorizzati i redirect `http://localhost:3000/api/auth/callback/google` e `https://mirandola2.it/api/auth/callback/google`.
- **In locale senza Google**: `npm run db:dev-login -- <email>` apre una sessione per un capo e stampa il cookie da impostare nel browser (solo con un database `file:`).

## Immagini 🖼️

Gestire le immagini è complicato sia per una questione di privacy sia per una questione di storage. L'attuale soluzione prevede che tutte le immagini di archivio siano caricate esternamente, in particolare sul OneDrive fornito al gruppo dall'associazione (i link alle raccolte si trovano nella tabella `media` del database); tranne per ciò che riguarda le poche immagini presenti sul sito come immagini di copertina o simili, che per una questione di latenza si è preferito procedere diversamente. Queste sono caricate sul sito [ImageKit.io](https://imagekit.io), un servizio di CDN che permette di ottimizzare le immagini e renderle più veloci da caricare. 

Grazie al loader personalizzato di `next/image` (`lib/imagekit-loader.ts`) è sufficiente inserire il percorso *relativo* dell'immagine (es. `/img/misc/img.jpg`) e sarà ImageKit a ridimensionarla e ottimizzarla in base allo schermo. Se serve costruire a mano l'indirizzo di un'immagine, va usata la funzione `imagekitUrl` in `lib/imagekit.ts`.

## Analytics 📊
Le statistiche del sito sono gestite da [Vercel Web Analytics](https://vercel.com/docs/analytics) (pacchetto `@vercel/analytics`), che non usa cookie. Il componente `<Analytics />` è incluso in `app/layout.tsx` e i dati sono consultabili nella scheda *Analytics* del progetto su Vercel (va attivata dalla dashboard). Funziona solo sui deploy ospitati su Vercel.

## Hosting ☁️

Il sito è ospitato gratuitamente su [Vercel](https://vercel.com) (piano Hobby) e il database su Turso (piano gratuito). Il dominio è `mirandola2.it`. Sitemap e `robots.txt` sono generati da `app/sitemap.ts` e `app/robots.ts`.

Su Vercel vanno impostate le stesse variabili d'ambiente di `.env.example` (database, `MEMBER_PSK_SHA256`, Better Auth, Google, ImageKit), con `BETTER_AUTH_URL=https://mirandola2.it` e `IMAGEKIT_STAFF_FOLDER=/img/staff/`. Le pagine pubbliche sono statiche; girano come funzioni solo le API (`/api/...`), il Tabù e la rigenerazione delle pagine dopo una modifica ai dati.
