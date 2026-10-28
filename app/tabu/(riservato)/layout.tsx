import { getLeader } from '@/lib/dal'
import StaffAvatar from '@/components/tabu/StaffAvatar'
import TabuNav from '@/components/tabu/TabuNav'

// Shared chrome only: layouts don't re-render on every navigation, so the auth check is in each
// page and server action (requireLeader / requireAdmin), not here.
export default async function ReservedLayout({ children }: { children: React.ReactNode }) {
  const leader = await getLeader()

  return (
    <>
      {leader && (
        <header className="mb-8 space-y-4">
          <div className="flex items-center gap-4">
            <StaffAvatar img={leader.img} name={leader.nome} size={64} />
            <div>
              <p className="font-display text-3xl text-primary leading-none">Tabù</p>
              <p className="opacity-70">{leader.nome}</p>
            </div>
          </div>
          <TabuNav isAdmin={leader.isAdmin} />
        </header>
      )}
      {children}
    </>
  )
}
