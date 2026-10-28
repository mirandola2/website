import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/dal'
import { getProjectYears, getYearQuestions } from '@/lib/tabu'
import { scoutYearOptions } from '@/lib/scout-year'
import { DEFAULT_QUESTION } from '@/lib/project'
import ActionForm from '@/components/tabu/ActionForm'
import { Field } from '@/components/tabu/Field'
import { saveYearQuestion } from '../actions'

export const metadata: Metadata = { title: 'Admin · Anni scout' }

export default async function AdminYearsPage() {
  await requireAdmin()
  const [questions, projectYears] = await Promise.all([getYearQuestions(), getProjectYears()])
  const years = scoutYearOptions([...projectYears, ...Object.keys(questions)])

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Anni scout</h1>
      <p className="opacity-70">
        La domanda che cambia ogni anno nel Progetto del Capo (una per ciascuna delle quattro aree). Se non è impostata
        si usa &ldquo;{DEFAULT_QUESTION}&rdquo;.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {years.map(year => (
          <section key={year} className="card bg-base-200">
            <ActionForm action={saveYearQuestion} className="card-body gap-1">
              <h2 className="card-title">{year}</h2>
              <input type="hidden" name="id" value={year} />
              <Field label="Domanda" name="question" defaultValue={questions[year] ?? DEFAULT_QUESTION} required />
            </ActionForm>
          </section>
        ))}
      </div>
    </div>
  )
}
