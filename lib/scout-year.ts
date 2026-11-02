// Scout years start in September: on 2026-10-27 the current one is '2026-27'.
// Kept free of server-only imports so client components can use it too.

export function scoutYearOf(date = new Date()) {
  const year = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1
  return formatScoutYear(year)
}

export function formatScoutYear(startYear: number) {
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}

// '2026-27' → 2026; null if malformed or inconsistent ('2026-29')
export function parseScoutYear(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return null
  const start = Number(value.slice(0, 4))
  return formatScoutYear(start) === value ? start : null
}
