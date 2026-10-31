import Papa from 'papaparse'
import { normalizeName } from './format'

// The CSV of member codes and birthdays uploaded in /tabu/admin/soci. Kept free of server-only
// imports so it can be unit-tested (lib/members-csv.test.ts).

export const MEMBERS_CSV_HEADER = ['codice_socio', 'nome_cognome', 'data_nascita'] as const
export const MEMBERS_CSV_EXAMPLE = '123456,MARIO ROSSI,31/12/2012'

const MAX_ROWS = 5000
const MAX_ERRORS = 5

export interface MemberRow {
  memberCode: string
  fullName: string
  // YYYY-MM-DD, as stored in member.birthday
  birthday: string
}

// GG/MM/AAAA (Italian Excel) or AAAA-MM-GG: null when it's not a real date
export function parseBirthday(value: string) {
  const it = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const [y, m, d] = it ? [it[3], it[2], it[1]].map(Number) : iso ? [iso[1], iso[2], iso[3]].map(Number) : []
  if (!y) return null
  const date = new Date(Date.UTC(y, m - 1, d))
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  return real && y >= 1900 && date.getTime() <= Date.now() ? date.toISOString().slice(0, 10) : null
}

// Every row, or the first errors (with their line number): one bad row and nothing is imported
export function parseMembersCsv(text: string): { ok: true; rows: MemberRow[] } | { ok: false; errors: string[] } {
  // Comma or semicolon (Excel in Italian), with or without the BOM Excel adds
  const { data, meta } = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: h => h.trim().toLowerCase(),
  })
  const missing = MEMBERS_CSV_HEADER.filter(h => !meta.fields?.includes(h))
  if (missing.length) return { ok: false, errors: [`Intestazione mancante: ${missing.join(', ')}. La prima riga deve essere ${MEMBERS_CSV_HEADER.join(',')}`] }
  if (!data.length) return { ok: false, errors: ['Il file non ha righe.'] }
  if (data.length > MAX_ROWS) return { ok: false, errors: [`Al massimo ${MAX_ROWS} righe.`] }

  const errors: string[] = []
  const rows: MemberRow[] = []
  const seen = new Set<string>()
  data.forEach((r, i) => {
    // Line 1 is the header
    const line = `Riga ${i + 2}:`
    const memberCode = (r.codice_socio ?? '').trim()
    const fullName = normalizeName(r.nome_cognome ?? '')
    const birthday = parseBirthday((r.data_nascita ?? '').trim())
    if (!/^\d{1,10}$/.test(memberCode)) errors.push(`${line} codice socio non valido.`)
    else if (seen.has(memberCode)) errors.push(`${line} codice socio ${memberCode} ripetuto.`)
    else if (!fullName || fullName.length > 100) errors.push(`${line} nome mancante o troppo lungo.`)
    else if (!birthday) errors.push(`${line} data di nascita non valida (GG/MM/AAAA).`)
    else rows.push({ memberCode, fullName, birthday })
    seen.add(memberCode)
  })
  if (errors.length) {
    const more = errors.length - MAX_ERRORS
    return { ok: false, errors: [...errors.slice(0, MAX_ERRORS), ...(more > 0 ? [`…e altri ${more} errori.`] : [])] }
  }
  return { ok: true, rows }
}
