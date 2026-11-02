import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon } from '@phosphor-icons/react/ssr'
import { requireAdmin } from '@/lib/dal'
import { countProjectsByYear, getYearSetting } from '@/lib/tabu'
import TemplateEditor from '@/components/tabu/TemplateEditor'
import { saveYearTemplate } from '../../actions'

export const metadata: Metadata = { title: 'Admin · Modello del Progetto del Capo' }

export default async function YearTemplatePage({ params }: { params: Promise<{ anno: string }> }) {
  await requireAdmin()
  const { anno } = await params
  const year = await getYearSetting(anno)
  if (!year) notFound()
  const projectCount = (await countProjectsByYear()).get(year.id) ?? 0

  return (
    <div className="space-y-6">
      <Link href="/tabu/admin/progetti/" className="btn btn-ghost btn-sm">
        <ArrowLeftIcon size={16} weight="bold" aria-hidden />
        Tutti gli anni
      </Link>
      <h1 className="font-display text-4xl text-primary">Modello {year.id}</h1>
      <p className="opacity-70">
        Le aree sono le schede del progetto; ogni area ha tutte le domande. Progetti già compilati per questo anno:{' '}
        {projectCount}.
      </p>
      <TemplateEditor yearId={year.id} template={year.template} projectCount={projectCount} action={saveYearTemplate} />
    </div>
  )
}
