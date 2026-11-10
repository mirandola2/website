import 'server-only'
import { and, asc, count, desc, eq, isNotNull, isNull, or, sql } from 'drizzle-orm'
import { db } from './db'
import { link, media, member, scoutYear as scoutYearTable, staffMember, totem, yearProject } from '@/db/schema'
import { shortNames } from './format'
import { canReadProjects, normalizeAnswers, normalizeTemplate, type ProjectTemplate } from './project'
import { scoutYearOf } from './scout-year'

// Tabù reads: not cached (the Tabù is dynamic and only a few dozen leaders use it). Callers must
// have checked requireLeader() first.

// Leaders who can log in (coca = 1 with an email, not removed), in the staff main order
const loginLeaders = and(eq(staffMember.coca, true), isNotNull(staffMember.email), isNull(staffMember.deletedAt))

export const NO_YEAR = 'Nessun anno aperto per i Progetti del Capo: chiedi a un admin.'

export interface YearSetting {
  id: string
  template: ProjectTemplate
  // Listed in the year selectors
  visible: boolean
  // Projects can still be written; inactive years are read-only
  active: boolean
}

const toSetting = (row: typeof scoutYearTable.$inferSelect): YearSetting => ({ ...row, template: normalizeTemplate(row.template) })

// Every year added by the admins, most recent first
export async function getYearSettings(): Promise<YearSetting[]> {
  return (await db.select().from(scoutYearTable).orderBy(desc(scoutYearTable.id))).map(toSetting)
}

export async function getYearSetting(id: string): Promise<YearSetting | null> {
  const [row] = await db.select().from(scoutYearTable).where(eq(scoutYearTable.id, id))
  return row ? toSetting(row) : null
}

// Resolves ?anno=…: only visible years can be opened (and, with `allowed`, only those it accepts).
// Without one: the current year if visible, else the latest visible one; null when there is none.
export async function resolveYear(requested: string | undefined, allowed: (year: YearSetting) => boolean = () => true) {
  const visible = (await getYearSettings()).filter(y => y.visible && allowed(y))
  const year = visible.find(y => y.id === requested) ?? visible.find(y => y.id === scoutYearOf()) ?? visible[0] ?? null
  return { year, visible }
}

export async function getProject(memberCode: string, year: YearSetting) {
  const [project] = await db
    .select()
    .from(yearProject)
    .where(and(eq(yearProject.memberCode, memberCode), eq(yearProject.scoutYear, year.id)))
  return project ? { ...project, sections: normalizeAnswers(year.template, project.sections) } : null
}

// The years of the visible ones whose other projects the leader can read (lib/project.ts
// canReadProjects). Their own project years come from the index (member_code, scout_year).
export async function resolveReadableYear(requested: string | undefined, memberCode: string) {
  const own = await db.select({ year: yearProject.scoutYear }).from(yearProject).where(eq(yearProject.memberCode, memberCode))
  const ownYears = new Set(own.map(r => r.year))
  const current = scoutYearOf()
  return resolveYear(requested, y => canReadProjects(y, ownYears, current))
}

// Every leader with their project for the year (null when not written yet), plus the projects of
// whoever has since left the staff or lost their login: a written project is always listed.
// `shortName` tells apart leaders with the same first name.
export async function getProjectsForYear(year: YearSetting) {
  const rows = await db
    .select({
      memberCode: staffMember.memberCode,
      nome: staffMember.nome,
      img: staffMember.img,
      staff: staffMember.staff,
      sections: yearProject.sections,
      draft: yearProject.draft,
      updatedAt: yearProject.updatedAt,
    })
    .from(staffMember)
    .leftJoin(yearProject, and(eq(yearProject.memberCode, staffMember.memberCode), eq(yearProject.scoutYear, year.id)))
    .where(or(loginLeaders, isNotNull(yearProject.id)))
    .orderBy(asc(staffMember.position), asc(staffMember.memberCode))
  const names = shortNames(rows.map(r => r.nome))
  return rows.map(({ sections, draft, updatedAt, ...leader }, i) => ({
    ...leader,
    shortName: names[i],
    project: updatedAt ? { sections: normalizeAnswers(year.template, sections), draft: !!draft, updatedAt } : null,
  }))
}

// Projects written per year (admin: a year's template applies to all of them). Reads the index
// year_project_scout_year_idx, not the projects.
export async function countProjectsByYear() {
  const rows = await db.select({ year: yearProject.scoutYear, n: count() }).from(yearProject).groupBy(yearProject.scoutYear)
  return new Map(rows.map(r => [r.year, r.n]))
}

// Drafts ("Bozza") per year (admin: draft or publish them all at once)
export async function countDraftsByYear() {
  const rows = await db
    .select({ year: yearProject.scoutYear, n: count() })
    .from(yearProject)
    .where(eq(yearProject.draft, true))
    .groupBy(yearProject.scoutYear)
  return new Map(rows.map(r => [r.year, r.n]))
}

export async function getDashboardStats(scoutYear: string) {
  const [[leaders], [saved], latest] = await Promise.all([
    db.select({ n: count() }).from(staffMember).where(loginLeaders),
    // Out of the current leaders, like the total; drafts are not filled yet
    db
      .select({ n: count(), drafts: sql<number>`sum(${yearProject.draft})` })
      .from(yearProject)
      .innerJoin(staffMember, eq(staffMember.memberCode, yearProject.memberCode))
      .where(and(eq(yearProject.scoutYear, scoutYear), loginLeaders)),
    // The last 3 of the year straight from the index (scout_year, updated_at)
    db
      .select({ memberCode: staffMember.memberCode, nome: staffMember.nome, img: staffMember.img, updatedAt: yearProject.updatedAt })
      .from(yearProject)
      .innerJoin(staffMember, eq(staffMember.memberCode, yearProject.memberCode))
      .where(eq(yearProject.scoutYear, scoutYear))
      .orderBy(desc(yearProject.updatedAt))
      .limit(3),
  ])
  const drafting = saved.drafts ?? 0
  return { leaders: leaders.n, filled: saved.n - drafting, drafting, latest }
}

export async function getAdminCounts() {
  const [[staff], [mediaRows], [linkRows], [totemRows], [memberRows]] = await Promise.all([
    db
      .select({ n: count(), leaders: sql<number>`sum(${staffMember.email} IS NOT NULL)` })
      .from(staffMember)
      .where(isNull(staffMember.deletedAt)),
    db.select({ n: count() }).from(media),
    db.select({ n: count() }).from(link),
    db.select({ n: count() }).from(totem),
    // Placeholders of staff without a code are not members
    db.select({ n: count() }).from(member).where(isNotNull(member.birthday)),
  ])
  return { staff: staff.n, withEmail: staff.leaders ?? 0, media: mediaRows.n, links: linkRows.n, totem: totemRows.n, members: memberRows.n }
}
