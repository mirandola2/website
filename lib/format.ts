const dateFormat = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' })

export const formatDate = (date: Date) => dateFormat.format(date)

export const firstName = (nome: string) => nome.split(' ')[0]

// "1 capo su 5 ha compilato…" / "3 capi su 5 hanno compilato…"
export const filledSentence = (filled: number, total: number, year: string) =>
  `${filled} ${filled === 1 ? 'capo' : 'capi'} su ${total} ${filled === 1 ? 'ha' : 'hanno'} compilato il progetto ${year}.`

// Greeting by the time in Italy: Buon giorno 6–18, Buona sera 18–22, Buona notte 22–6
export function greeting(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Rome' }).format(now))
  if (hour >= 6 && hour < 18) return 'Buon giorno'
  if (hour >= 18 && hour < 22) return 'Buona sera'
  return 'Buona notte'
}
