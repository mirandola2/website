import type { Metadata } from 'next'

// The Tabù is the leaders' reserved area: never indexed (also excluded in robots.ts and sitemap.ts)
export const metadata: Metadata = {
  title: { default: 'Tabù', template: '%s ~ Tabù' },
  robots: { index: false, follow: false },
}

export default function TabuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* No hero here: a band behind the (white) navbar keeps it readable, as in app/loading.tsx */}
      <div className="bg-primary h-16 xl:h-[71px]" />
      <div className="container px-4 pt-8 pb-8 max-w-5xl">{children}</div>
    </>
  )
}
