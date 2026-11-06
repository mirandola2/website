// Imports a past year's Progetti del Capo from a JSON transcription of the paper forms (README → Tabù).
//
//   npm run db:import-projects -- <file.json> [--dry-run] [--map <persona>=<slug>]... [--skip <persona>]... [--date YYYY-MM-DD]
//
// The JSON has `anno` ("2025-2026") and `persone`: one object per leader with `persona` (the staff slug), then one
// object per area keyed by the area title, each keyed by the question label. Scores are 1–5 or null (not checked).
// A person is matched only by exact slug among the leaders (coca = 1, not deleted): any other name stops the import
// until it is resolved with --map or --skip. Nothing is written while a name is unresolved, or with --dry-run.
// The year is created if missing (with the paper template, listed and read-only); an existing year is left as is.
// Projects are upserted on (staff member, year), like saveYearProject; updated_at is --date (default: Aug 31 of the
// year's end, no date being in the source).
import fs from 'fs'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from './db.mjs'
import { scoutYear, staffMember, yearProject } from '../db/schema'
import { DEFAULT_TEMPLATE, MAX_TEXT, normalizeAnswers, normalizeTemplate, type ProjectAnswers } from '../lib/project'

const args = process.argv.slice(2)
const flagValues = (name: string) => args.flatMap((a, i) => (a === name && args[i + 1] ? [args[i + 1]] : []))
const flagged = new Set(['--map', '--skip', '--date'].flatMap(f => flagValues(f)))
const file = args.find(a => !a.startsWith('--') && !flagged.has(a))
const dryRun = args.includes('--dry-run')
const maps = new Map(flagValues('--map').map(m => m.split('=') as [string, string]))
const skips = new Set(flagValues('--skip'))
if (!file) throw new Error('Usage: import-projects.mts <file.json> [--dry-run] [--map persona=slug] [--skip persona] [--date YYYY-MM-DD]')

// Keys of a person that are not areas
const META = new Set(['file', 'persona', 'nome', '_fonte'])
// Area titles use both ' and ’
const label = (s: string) => s.replace(/[’‘]/g, "'").trim().toLowerCase()
const excerpt = (s: string) => JSON.stringify(s.length > 30 ? `${s.slice(0, 30)}…` : s)

const source = JSON.parse(fs.readFileSync(file, 'utf-8')) as { anno: string; persone: Record<string, unknown>[] }
const yearMatch = /^(\d{4})-(\d{4})$/.exec(source.anno ?? '')
if (!yearMatch || Number(yearMatch[2]) !== Number(yearMatch[1]) + 1) throw new Error(`Invalid "anno": ${source.anno}`)
const yearId = `${yearMatch[1]}-${yearMatch[2].slice(2)}`
const date = flagValues('--date')[0] ?? `${yearMatch[2]}-08-31`
const updatedAt = new Date(`${date}T12:00:00Z`)
if (Number.isNaN(updatedAt.getTime())) throw new Error(`Invalid --date: ${date}`)

// --- Year and template ---

const [existingYear] = await db.select().from(scoutYear).where(eq(scoutYear.id, yearId))
const template = existingYear ? normalizeTemplate(existingYear.template) : DEFAULT_TEMPLATE
console.log(
  existingYear
    ? `Year ${yearId}: exists (visible=${existingYear.visible}, active=${existingYear.active}), its template is used and the row is not changed`
    : `Year ${yearId}: missing, will be created with the paper template (visible=true, active=false)`,
)
const areaByLabel = new Map(template.areas.map(a => [label(a.title), a]))
const questionByLabel = new Map(template.questions.map(q => [label(q.label), q]))

// --- Matching ---

const leaders = await db
  .select({ memberCode: staffMember.memberCode, slug: staffMember.slug, nome: staffMember.nome, nomeCaccia: staffMember.nomeCaccia })
  .from(staffMember)
  .where(and(eq(staffMember.coca, true), isNull(staffMember.deletedAt)))
const leaderBySlug = new Map(leaders.map(l => [l.slug, l]))

// Edit distance, only to suggest a slug: never used to match
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

const unresolved: string[] = []
const usedIds = new Map<string, string>()
const matched = source.persone.map(p => {
  const persona = String(p.persona ?? '')
  const mapped = maps.get(persona)
  const leader = skips.has(persona) ? undefined : leaderBySlug.get(mapped ?? persona)
  let status: string
  if (skips.has(persona)) status = 'skipped (--skip)'
  else if (leader) status = mapped ? `matched by --map` : 'exact slug'
  else {
    const near = leaders
      .map(l => ({ slug: l.slug, d: distance(persona, l.slug) }))
      .filter(c => c.d <= 3)
      .sort((x, y) => x.d - y.d)
    status = `UNMATCHED${mapped ? ` (--map to "${mapped}": not an active leader)` : ''}${near.length ? `, closest: ${near.map(c => `${c.slug} (distance ${c.d})`).join(', ')}` : ''}`
    unresolved.push(persona)
  }
  if (leader) {
    const other = usedIds.get(leader.memberCode)
    if (other) throw new Error(`"${persona}" and "${other}" both match staff ${leader.memberCode} (${leader.slug})`)
    usedIds.set(leader.memberCode, persona)
  }
  return { p, persona, leader, status }
})

console.log(`\nMatching (${source.persone.length} people in ${file}, ${leaders.length} active leaders):`)
for (const m of matched)
  console.log(
    `  ${m.persona.padEnd(24)} "${String(m.p.nome ?? '')}"`.padEnd(52) +
      (m.leader ? `→ ${m.leader.memberCode.padEnd(10)} ${m.leader.slug.padEnd(24)} ${m.leader.nome}${m.leader.nomeCaccia ? ` (${m.leader.nomeCaccia})` : ''}  [${m.status}]` : `→ ${m.status}`),
  )
for (const m of matched) if (typeof m.p._fonte === 'string') console.log(`  note on ${m.persona}: ${m.p._fonte}`)

// --- Answers ---

const issues: string[] = []
const projects = matched.flatMap(({ p, persona, leader }) => {
  if (!leader) return []
  const raw: ProjectAnswers = {}
  for (const [areaKey, areaValue] of Object.entries(p)) {
    if (META.has(areaKey)) continue
    const area = areaByLabel.get(label(areaKey))
    if (!area || !areaValue || typeof areaValue !== 'object') {
      issues.push(`${persona}: dropped unknown area "${areaKey}"`)
      continue
    }
    raw[area.id] = {}
    for (const [qKey, value] of Object.entries(areaValue as Record<string, unknown>)) {
      const q = questionByLabel.get(label(qKey))
      const where = `${persona} / ${area.id}.${q?.id ?? qKey}`
      if (!q) {
        issues.push(`${where}: dropped unknown question "${qKey}"`)
        continue
      }
      if (value === null) continue
      if (q.kind === 'score') {
        if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5) raw[area.id][q.id] = value
        else issues.push(`${where}: dropped score ${JSON.stringify(value)} (not an integer 0–5)`)
        continue
      }
      if (typeof value !== 'string') {
        issues.push(`${where}: dropped non-text value ${JSON.stringify(value)}`)
        continue
      }
      // Same cleaning as the form (lib/validation.ts `text`)
      let text = value.trim().replace(/\r\n?/g, '\n')
      const max = MAX_TEXT[q.kind]
      if (text.length > max) {
        issues.push(`${where}: truncated ${text.length} → ${max} chars, ends ${excerpt(text.slice(max - 30, max))}`)
        text = text.slice(0, max)
      }
      raw[area.id][q.id] = text
    }
  }
  const sections = normalizeAnswers(template, raw)
  for (const area of template.areas) if (!raw[area.id]) issues.push(`${persona}: area "${area.title}" missing in the source (left empty)`)
  return [{ persona, leader, sections }]
})

const existing = new Set(
  (await db.select({ code: yearProject.memberCode }).from(yearProject).where(eq(yearProject.scoutYear, yearId))).map(r => r.code),
)

console.log(`\nProjects (${yearId}, updated_at ${updatedAt.toISOString()}):`)
for (const { persona, leader, sections } of projects) {
  const values = Object.values(sections).flatMap(a => Object.entries(a))
  const texts = values.filter(([, v]) => typeof v === 'string' && v).length
  const scores = values.filter(([, v]) => typeof v === 'number' && v).length
  console.log(`  ${existing.has(leader.memberCode) ? 'update' : 'insert'}  ${persona.padEnd(24)} ${texts} texts, ${scores} scores filled`)
}
console.log(issues.length ? `\nTruncated or dropped:\n${issues.map(i => `  ${i}`).join('\n')}` : '\nTruncated or dropped: none')

if (unresolved.length) {
  console.log(`\nNot imported: unresolved ${unresolved.join(', ')}. Use --map <persona>=<slug> or --skip <persona>.`)
  process.exit(1)
}
if (dryRun) {
  console.log(`\nDry run: nothing written (${projects.length} projects would be upserted).`)
  process.exit(0)
}

await db.transaction(async tx => {
  if (!existingYear) await tx.insert(scoutYear).values({ id: yearId, template, visible: true, active: false })
  for (const { leader, sections } of projects) {
    await tx
      .insert(yearProject)
      .values({ memberCode: leader.memberCode, scoutYear: yearId, sections, updatedAt })
      .onConflictDoUpdate({
        target: [yearProject.memberCode, yearProject.scoutYear],
        set: { sections, updatedAt },
      })
  }
})
console.log(`\nUpserted ${projects.length} projects for ${yearId}${existingYear ? '' : ' (year created)'}.`)
