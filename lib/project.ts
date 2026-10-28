// The leader's yearly project ("Progetto del Capo"), same layout as the paper template: four
// areas, each with objectives, tools, an answer to the year's question and a 1–5 self-check at
// the start, middle and end of the year. Kept free of server-only imports (used by forms too).

export const PROJECT_SECTIONS = [
  {
    key: 'servizio',
    title: 'Io e il Servizio',
    subtitle: 'competenza metodologica, adeguatezza al mio ruolo di capo, relazione in staff, ragazzi e genitori',
  },
  { key: 'realta', title: 'Io e la Realtà', subtitle: 'responsabilità sociale e politica' },
  { key: 'associazione', title: 'Io e l’Associazione', subtitle: 'Co.Ca., Zona, eventi, formazione personale e permanente' },
  { key: 'fede', title: 'Io e la Fede', subtitle: 'la mia scelta cristiana' },
] as const

export const CHECKPOINTS = [
  { key: 'inizio', label: 'Inizio anno' },
  { key: 'meta', label: 'Metà anno' },
  { key: 'fine', label: 'Fine anno' },
] as const

export type SectionKey = (typeof PROJECT_SECTIONS)[number]['key']
export type CheckpointKey = (typeof CHECKPOINTS)[number]['key']

export type ProjectSection = {
  obiettivi: string
  strumenti: string
  // Answer to the year's question ("Che pozione userai?")
  risposta: string
} & Record<CheckpointKey, number> // 0 = not checked yet, 1–5

export type ProjectSections = Record<SectionKey, ProjectSection>

// The question changes every year: admins set it in /tabu/admin/anni
export const DEFAULT_QUESTION = 'Che pozione userai?'

export const MAX_TEXT = 3000
export const MAX_ANSWER = 200

const emptySection = (): ProjectSection => ({ obiettivi: '', strumenti: '', risposta: '', inizio: 0, meta: 0, fine: 0 })

// Fills whatever is missing (older rows, partial JSON) so readers always get every field
export function normalizeSections(raw: unknown): ProjectSections {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Partial<ProjectSection>>
  return Object.fromEntries(
    PROJECT_SECTIONS.map(({ key }) => [key, { ...emptySection(), ...source[key] }]),
  ) as ProjectSections
}

export function isSectionEmpty(s: ProjectSection) {
  return !s.obiettivi && !s.strumenti && !s.risposta && CHECKPOINTS.every(c => !s[c.key])
}
