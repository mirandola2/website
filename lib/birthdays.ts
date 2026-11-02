// Upcoming birthdays, computed on the server. Kept free of server-only imports so the day math
// can be unit-tested (lib/birthdays.test.ts).

export interface UpcomingBirthday {
  name: string
  last_initial: string
  // Days until the birthday: 0 = today
  t_minus: number
}

const DAY_MS = 24 * 60 * 60 * 1000

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

// Today's date (YYYY-MM-DD) in Italy, whatever the server's timezone
export function romeToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

// Feb 29 birthdays are celebrated on Feb 28 in non-leap years
function birthdayInYear(year: number, month: number, day: number) {
  if (month === 2 && day === 29 && !isLeapYear(year)) day = 28
  return Date.UTC(year, month - 1, day)
}

// Days from `today` to the next occurrence of `birthday` (both YYYY-MM-DD)
export function daysUntilBirthday(birthday: string, today: string) {
  const [, month, day] = birthday.split('-').map(Number)
  const [year, todayMonth, todayDay] = today.split('-').map(Number)
  const start = Date.UTC(year, todayMonth - 1, todayDay)
  let next = birthdayInYear(year, month, day)
  if (next < start) next = birthdayInYear(year + 1, month, day)
  return Math.round((next - start) / DAY_MS)
}

// Only the first name and the initial of the next word leave the server, as with the old Worker
export function upcomingBirthdays(
  members: { fullName: string; birthday: string }[],
  today: string,
  days = 7,
): UpcomingBirthday[] {
  return members
    .map(m => ({ fullName: m.fullName.trim(), t_minus: daysUntilBirthday(m.birthday, today) }))
    .filter(m => m.t_minus <= days)
    .sort((a, b) => a.t_minus - b.t_minus || a.fullName.localeCompare(b.fullName))
    .map(({ fullName, t_minus }) => {
      const [name, rest = ''] = fullName.split(/ (.*)/)
      return { name, last_initial: rest.charAt(0), t_minus }
    })
}
