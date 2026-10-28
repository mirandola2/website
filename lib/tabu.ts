import 'server-only'
import { and, asc, count, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { db } from './db'
import { media, scoutYear as scoutYearTable, staffMember, totem, yearProject } from '@/db/schema'
import { DEFAULT_QUESTION, normalizeSections } from './project'
import { scoutYearOf } from './scout-year'

// Tabù reads: not cached (the Tabù is dynamic and only a few dozen leaders use it). Callers must
// have checked requireLeader() first.

// Leaders who can log in (coca = 1 with an email), in the staff row order
const loginLeaders = and(eq(staffMember.coca, true), isNotNull(staffMember.email))

export async function getProject(staffMemberId: number, scoutYear: string) {
  const [project] = await db
    .select()
    .from(yearProject)
    .where(and(eq(yearProject.staffMemberId, staffMemberId), eq(yearProject.scoutYear, scoutYear)))
  return project ? { ...project, sections: normalizeSections(project.sections) } : null
}

export interface YearSetting {
  id: string
  question: string
  // Listed in the year selectors
  visible: boolean
  // Projects can still be written; inactive years are read-only
  active: boolean
}

// A year without a row: the current scout year is open by default, any other is hidden
function defaultYear(id: string): YearSetting {
  const current = id === scoutYearOf()
  return { id, question: DEFAULT_QUESTION, visible: current, active: current }
}

// Every configured year plus the current one, most recent first
export async function getYearSettings(): Promise<YearSetting[]> {
  const rows = await db.select().from(scoutYearTable)
  const byId = new Map<string, YearSetting>(rows.map(r => [r.id, r]))
  if (!byId.has(scoutYearOf())) byId.set(scoutYearOf(), defaultYear(scoutYearOf()))
  return [...byId.values()].sort((a, b) => b.id.localeCompare(a.id))
}

export async function getYearSetting(id: string): Promise<YearSetting> {
  const [row] = await db.select().from(scoutYearTable).where(eq(scoutYearTable.id, id))
  return row ?? defaultYear(id)
}

// The year to show when none is chosen: the current one if visible, else the latest visible one
export function defaultVisibleYear(years: YearSetting[]) {
  const visible = years.filter(y => y.visible)
  return (visible.find(y => y.id === scoutYearOf()) ?? visible[0])?.id ?? scoutYearOf()
}

// Resolves ?anno=…: only visible years can be opened
export async function resolveYear(requested: string | undefined) {
  const years = await getYearSettings()
  const visible = years.filter(y => y.visible)
  const year = visible.find(y => y.id === requested) ?? visible.find(y => y.id === defaultVisibleYear(years))
  return { year: year ?? defaultYear(scoutYearOf()), visible }
}

// Every leader with their project for the year (null when not written yet)
export async function getProjectsForYear(scoutYear: string) {
  const rows = await db
    .select({
      leaderId: staffMember.id,
      nome: staffMember.nome,
      img: staffMember.img,
      staff: staffMember.staff,
      sections: yearProject.sections,
      updatedAt: yearProject.updatedAt,
    })
    .from(staffMember)
    .leftJoin(yearProject, and(eq(yearProject.staffMemberId, staffMember.id), eq(yearProject.scoutYear, scoutYear)))
    .where(loginLeaders)
    .orderBy(asc(staffMember.id))
  return rows.map(({ sections, updatedAt, ...leader }) => ({
    ...leader,
    project: updatedAt ? { sections: normalizeSections(sections), updatedAt } : null,
  }))
}

export async function getDashboardStats(scoutYear: string) {
  const [[leaders], [filled], latest] = await Promise.all([
    db.select({ n: count() }).from(staffMember).where(loginLeaders),
    db.select({ n: count() }).from(yearProject).where(eq(yearProject.scoutYear, scoutYear)),
    db
      .select({ nome: staffMember.nome, img: staffMember.img, updatedAt: yearProject.updatedAt })
      .from(yearProject)
      .innerJoin(staffMember, eq(staffMember.id, yearProject.staffMemberId))
      .where(eq(yearProject.scoutYear, scoutYear))
      .orderBy(desc(yearProject.updatedAt))
      .limit(3),
  ])
  return { leaders: leaders.n, filled: filled.n, latest }
}

export async function getAdminCounts() {
  const [[staff], [mediaRows], [totemRows]] = await Promise.all([
    db
      .select({ n: count(), leaders: sql<number>`sum(${staffMember.email} IS NOT NULL)` })
      .from(staffMember),
    db.select({ n: count() }).from(media),
    db.select({ n: count() }).from(totem),
  ])
  return { staff: staff.n, withEmail: staff.leaders ?? 0, media: mediaRows.n, totem: totemRows.n }
}
