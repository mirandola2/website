const dateFormat = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' })

export const formatDate = (date: Date) => dateFormat.format(date)

// member.birthday 'YYYY-MM-DD' -> '14/03/2003'
export const formatBirthday = (birthday: string) => birthday.split('-').reverse().join('/')

export const firstName = (nome: string) => nome.split(' ')[0]

// How to call each leader in a list: the first name, plus the initial of the surname when another
// one has the same first name ("Luca M.", "Luca T."), or the full name when even that is the same
export function shortNames(names: string[]) {
  const count = (list: string[]) => list.reduce((m, n) => m.set(n, (m.get(n) ?? 0) + 1), new Map<string, number>())
  const first = names.map(firstName)
  const firstCount = count(first)
  const initial = names.map((n, i) => {
    const rest = n.slice(first[i].length).trim()
    return rest ? `${first[i]} ${rest[0]}.` : n
  })
  const initialCount = count(initial)
  return names.map((n, i) => (firstCount.get(first[i]) === 1 ? first[i] : initialCount.get(initial[i]) === 1 ? initial[i] : n))
}

// "1 capo su 5 ha compilato…" / "3 capi su 5 hanno compilato…"
export const filledSentence = (filled: number, total: number, year: string) =>
  `${filled} ${filled === 1 ? 'capo' : 'capi'} su ${total} ${filled === 1 ? 'ha' : 'hanno'} compilato il progetto ${year}.`

// Greetings shown as "<greeting> <name>!", so each one ends where the name goes
export const DAY_GREETINGS = [
  'Buongiorno',
  'Che sia un buon giorno,',
  'Buona giornata',
  'Buona Caccia',
  'Buon Volo',
  'Che splendida giornata',
  'Il sole splende dietro le nubi,',
  'Guida la tua Canoa,',
  'Grazie del tuo Servizio',
  '...il nostro dovere verso Dio e il nostro Paese,',
  'Buona Strada',
  'A Ciel Sereno',
  'Zaino in spalla,',
  'Estote Parati,',
  'Pronti a Servire,',
  'Eccoci',
  'Del nostro meglio',
  "Un altro giorno, un'altra Avventura,",
]
export const NIGHT_GREETINGS = [
  'Buona serata',
  'Ula, ula, ulaaa,',
  'Silenzio in tenda,',
  'Il campo dorme, ma non tu,',
  'Turno di guardia,',
  'È ora di riposarsi',
  'La luna è bella stasera,',
  'Quante stelle',
  'Hanno fischiato il silenzio,',
  'Le stelle sono alte nel Cielo,',
  'Shhh, la tenda accanto dorme,',
  'Il sacco a pelo ti aspetta,',
  "Ancora in piedi?! 'Notte,",
  'Buonanotte… o buongiorno,',
  'Vai a letto,',
  'Il Bosco dorme,',
  'È sera e stanchi siam,',
  'Il campo, calmo e silente,',
  'Scendi, notte, va via la paura,',
  'Che il risveglio sia pace ed un sorriso,'
]

// Random greeting by the time in Italy: day 6–22, night 22–6
export function greeting(now = new Date(), random = Math.random) {
  const hour = Number(new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Rome' }).format(now))
  const list = hour >= 6 && hour < 22 ? DAY_GREETINGS : NIGHT_GREETINGS
  return list[Math.floor(random() * list.length)]
}

// "Obiettivi 2024-25" -> "obiettivi-2024-25", "Città & Paese" -> "citta-paese". Staff slugs (admin
// and scripts/import-csv.mts) and heading ids (TableOfContents) must match, so there is one copy.
export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Full names as stored in member.full_name: trimmed, single spaces
export const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ')

// "MARIO ROSSI" / "mario rossi" -> "Mario Rossi"; also after hyphens and apostrophes ("anna-maria",
// "D'ANGELO" -> "Anna-Maria", "D'Angelo")
export const titleCase = (text: string) =>
  text.toLocaleLowerCase('it-IT').replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toLocaleUpperCase('it-IT'))
