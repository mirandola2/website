import { isAreaEmpty, type ProjectAnswers, type ProjectTemplate } from '@/lib/project'
import ScoreBoxes from './ScoreBoxes'

interface ProjectViewProps {
  template: ProjectTemplate
  answers: ProjectAnswers
  // Il mio progetto: the same layout as the form (every area with its subtitle, every question,
  // "—" for the empty ones). Otherwise compact (Tutti i progetti): only what was written.
  detailed?: boolean
}

// A project, read-only: Tutti i progetti, and Il mio progetto when not editing
export default function ProjectView({ template, answers, detailed = false }: ProjectViewProps) {
  if (detailed) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {template.areas.map(area => (
          <section key={area.id} className="card bg-base-200">
            <div className="card-body gap-3">
              <div>
                <h2 className="card-title text-primary">{area.title}</h2>
                {area.subtitle && <p className="text-sm opacity-70">{area.subtitle}</p>}
              </div>
              {template.questions.map(q => {
                const value = answers[area.id][q.id]
                if (q.kind === 'score') return <ScoreBoxes key={q.id} label={q.label} value={Number(value)} />
                return (
                  <div key={q.id}>
                    <h3 className="text-sm font-bold mb-1">{q.label}</h3>
                    {value ? (
                      <p className="whitespace-pre-line rounded-field bg-base-100 px-3 py-2">{value}</p>
                    ) : (
                      <p className="opacity-50">—</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    )
  }

  const areas = template.areas.filter(area => !isAreaEmpty(answers[area.id]))
  if (!areas.length) return <p className="opacity-70">Il progetto è ancora vuoto.</p>

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {areas.map(area => (
        <section key={area.id} className="rounded-box bg-base-200 p-4 space-y-2">
          <h3 className="font-bold text-primary">{area.title}</h3>
          {template.questions.map(q => {
            const value = answers[area.id][q.id]
            if (q.kind === 'score') return <ScoreBoxes key={q.id} label={q.label} value={Number(value)} />
            return (
              value && (
                <div key={q.id}>
                  <h4 className="text-sm font-bold">{q.label}</h4>
                  <p className="whitespace-pre-line">{value}</p>
                </div>
              )
            )
          })}
        </section>
      ))}
    </div>
  )
}
