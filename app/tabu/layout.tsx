import type { Metadata } from 'next'
import { getLeader, getNavbarLeader } from '@/lib/dal'
import { hasOpenDraw } from '@/lib/draw'
import TabuNavbar from '@/components/tabu/TabuNavbar'

// The Tabù is the leaders' reserved area: never indexed (also excluded in robots.ts and sitemap.ts)
export const metadata: Metadata = {
  title: { default: 'Tabù', template: '%s ~ Tabù' },
  robots: { index: false, follow: false },
}

// Shared chrome only: layouts don't re-render on every navigation, so the auth check is in each
// page and server action (requireLeader / requireAdmin), not here.
export default async function TabuLayout({ children }: { children: React.ReactNode }) {
  const leader = await getNavbarLeader()
  // The Sorteggio link only for whoever takes part in an open one (admin actions revalidate this layout)
  const me = leader && (await getLeader())
  const draw = !!me && (await hasOpenDraw(me.memberCode))

  return (
    <>
      <TabuNavbar leader={leader} draw={draw} />
      <div className="container px-4 py-8 max-w-5xl">{children}</div>
    </>
  )
}
