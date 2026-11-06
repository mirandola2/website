import { IdentificationCardIcon } from '@phosphor-icons/react/ssr'
import { isPlaceholderCode } from '@/lib/member-code'

// Dashboard card: the code is the key of the leader's own staff row, so it needs no query
export default function MyMemberCode({ memberCode }: { memberCode: string }) {
  return (
    <section className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">
          <IdentificationCardIcon size={24} weight="duotone" aria-hidden />
          Il mio codice socio
        </h2>
        {isPlaceholderCode(memberCode) ? (
          <p>Il tuo profilo non ha ancora un codice socio: chiedi a un admin di aggiungerlo.</p>
        ) : (
          <p className="font-mono text-3xl font-bold">{memberCode}</p>
        )}
      </div>
    </section>
  )
}
