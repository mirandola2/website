import Link from 'next/link'

// Scout year switcher: plain links (?anno=2026-27), so it works without JavaScript
export default function YearPicker({ years, current, basePath }: { years: string[]; current: string; basePath: string }) {
  return (
    <div className="join flex-wrap" role="group" aria-label="Anno scout">
      {years.map(y => (
        <Link
          key={y}
          href={`${basePath}?anno=${y}`}
          aria-current={y === current ? 'true' : undefined}
          className={`join-item btn btn-sm ${y === current ? 'btn-primary' : ''}`}
        >
          {y}
        </Link>
      ))}
    </div>
  )
}
