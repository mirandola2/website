import 'server-only'
import { and, asc, count, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { db } from './db'
import { media, scoutYear as scoutYearTable, staffMember, totem, yearProject } from '@/db/schema'
import { DEFAULT_QUESTION, normalizeSections } from './project'

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

// The year's variable question of the template ("Che pozione userai?")
export async function getYearQuestion(scoutYear: string) {
  const [row] = await db.select().from(scoutYearTable).where(eq(scoutYearTable.id, scoutYear))
  return row?.question ?? DEFAULT_QUESTION
}

export async function getYearQuestions() {
  const rows = await db.select().from(scoutYearTable)
  return Object.fromEntries(rows.map(r => [r.id, r.question]))
}

export async function getProjectYears() {
  const rows = await db.selectDistinct({ scoutYear: yearProject.scoutYear }).from(yearProject)
  return rows.map(r => r.scoutYear)
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
