const dateFormat = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' })

export const formatDate = (date: Date) => dateFormat.format(date)

export const firstName = (nome: string) => nome.split(' ')[0]
