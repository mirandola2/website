// The leader's yearly project ("Progetto del Capo"). Every scout year has its own template, set by
// admins in /tabu/admin/progetti: a list of areas (one card each) and a list of questions, asked in
// every area. Answers are stored by area and question id, so renaming one keeps its answers.
// Kept free of server-only imports (used by forms too).

export const QUESTION_KINDS = [
  { value: 'long', label: 'Testo lungo' },
  { value: 'short', label: 'Testo breve' },
  { value: 'score', label: 'Verifica 1–5' },
] as const

export type QuestionKind = (typeof QUESTION_KINDS)[number]['value']

export interface TemplateArea {
  id: string
  title: string
  subtitle: string
}

export interface TemplateQuestion {
  id: string
  label: string
  kind: QuestionKind
}

export interface ProjectTemplate {
  areas: TemplateArea[]
  questions: TemplateQuestion[]
}

// Area id → question id → text, or 0–5 for score questions (0 = not checked yet)
export type ProjectAnswers = Record<string, Record<string, string | number>>

export const MAX_TEXT: Record<Exclude<QuestionKind, 'score'>, number> = { long: 3000, short: 200 }
export const MAX_AREAS = 10
export const MAX_QUESTIONS = 15

// The paper template: the starting point of a new year when there is no previous one. Its ids are
// the keys the answers had before templates were editable.
export const DEFAULT_TEMPLATE: ProjectTemplate = {
  areas: [
    {
      id: 'servizio',
      title: 'Io e il Servizio',
      subtitle: 'competenza metodologica, adeguatezza al mio ruolo di capo, relazione in staff, ragazzi e genitori',
    },
    { id: 'realta', title: 'Io e la Realtà', subtitle: 'responsabilità sociale e politica' },
    { id: 'associazione', title: 'Io e l’Associazione', subtitle: 'Co.Ca., Zona, eventi, formazione personale e permanente' },
    { id: 'fede', title: 'Io e la Fede', subtitle: 'la mia scelta cristiana' },
  ],
  questions: [
    { id: 'obiettivi', label: 'Obiettivi', kind: 'long' },
    { id: 'strumenti', label: 'Strumenti', kind: 'long' },
    { id: 'risposta', label: 'Che pozione userai?', kind: 'short' },
    { id: 'inizio', label: 'Verifica di inizio anno', kind: 'score' },
    { id: 'meta', label: 'Verifica di metà anno', kind: 'score' },
    { id: 'fine', label: 'Verifica di fine anno', kind: 'score' },
  ],
}

// Ids of new areas and questions: only need to be unique within the template
export const newTemplateId = () => Math.random().toString(36).slice(2, 10)

// The stored template; an empty or malformed one reads as the default
export function normalizeTemplate(raw: unknown): ProjectTemplate {
  const t = raw as Partial<ProjectTemplate> | null
  return Array.isArray(t?.areas) && t.areas.length && Array.isArray(t?.questions) && t.questions.length
    ? { areas: t.areas, questions: t.questions }
    : DEFAULT_TEMPLATE
}

// Keeps only the template's areas and questions, each with the type of its kind: what readers get,
// and what is written back to every project when the template changes
export function normalizeAnswers(template: ProjectTemplate, raw: unknown): ProjectAnswers {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Record<string, unknown> | undefined>
  return Object.fromEntries(
    template.areas.map(area => [
      area.id,
      Object.fromEntries(
        template.questions.map(q => {
          const value = source[area.id]?.[q.id]
          if (q.kind === 'score') return [q.id, typeof value === 'number' && value >= 0 && value <= 5 ? value : 0]
          return [q.id, typeof value === 'string' ? value : '']
        }),
      ),
    ]),
  )
}

export function isAreaEmpty(answers: Record<string, string | number>) {
  return Object.values(answers).every(v => !v)
}
