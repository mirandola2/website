import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LockKeyIcon } from '@phosphor-icons/react/ssr'
import { getLeader } from '@/lib/dal'
import GoogleSignIn from '@/components/tabu/GoogleSignIn'

export const metadata: Metadata = { title: 'Accedi' }

const errors: Record<string, string> = {
  not_a_leader:
    "L'account Google che hai scelto non è abilitato al Tabù. Possono accedere solo i capi della Co.Ca.: chiedi al Capo Gruppo di registrare la tua email.",
  access_denied: 'Accesso annullato.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getLeader()) redirect('/tabu/')
  const { error } = await searchParams

  return (
    <div className="card bg-base-200 max-w-md mx-auto">
      <div className="card-body gap-4">
        <h1 className="card-title font-display text-4xl text-primary">
          <LockKeyIcon size={32} weight="duotone" aria-hidden />
          Tabù
        </h1>
        <p>Area riservata ai Capi della Comunità Capi</p>
        {error && (
          <div role="alert" className="alert alert-error alert-soft">
            {errors[error] ?? 'Accesso non riuscito, riprova.'}
          </div>
        )}
        <GoogleSignIn />
      </div>
    </div>
  )
}
