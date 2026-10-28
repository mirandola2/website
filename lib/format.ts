const dateFormat = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' })

export const formatDate = (date: Date) => dateFormat.format(date)

export const firstName = (nome: string) => nome.split(' ')[0]

// "1 capo su 5 ha compilato…" / "3 capi su 5 hanno compilato…"
export const filledSentence = (filled: number, total: number, year: string) =>
  `${filled} ${filled === 1 ? 'capo' : 'capi'} su ${total} ${filled === 1 ? 'ha' : 'hanno'} compilato il progetto ${year}.`
