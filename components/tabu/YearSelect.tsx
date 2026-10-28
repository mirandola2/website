'use client'

import { useRouter } from 'next/navigation'
import { confirmLeave } from '@/lib/unsaved-changes'

// Scout year dropdown (?anno=2026-27). Asks before leaving a form with unsaved changes.
export default function YearSelect({ years, current, basePath }: { years: string[]; current: string; basePath: string }) {
  const router = useRouter()

  return (
    <select
      aria-label="Anno scout"
      className="select select-primary w-auto"
      value={current}
      onChange={e => {
        const year = e.target.value
        if (confirmLeave()) router.push(`${basePath}?anno=${year}`)
        else e.target.value = current
      }}
    >
      {years.map(y => (
        <option key={y} value={y}>
          {y.replace('-', '/20')}
        </option>
      ))}
    </select>
  )
}
