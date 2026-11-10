'use client'

import { useState } from 'react'
import { WarningIcon } from '@phosphor-icons/react'

const WARNING = 'Questa opzione non è reversibile.'

// Admin, per active year: draft ("1") or publish ("0") every saved project, applied by the year's
// "Salva" (saveYearSettings, field "drafts"). At most one of the two, with a warning while checked.
export default function BulkDraftChecks() {
  const [value, setValue] = useState<'' | '0' | '1'>('')

  function check(next: '0' | '1', checked: boolean) {
    setValue(checked ? next : '')
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap gap-4">
        {(
          [
            ['1', 'Rendi tutti i PdC bozze'],
            ['0', 'Rendi definitivi tutti i PdC'],
          ] as const
        ).map(([v, label]) => (
          <label key={v} className="label cursor-pointer gap-2">
            <input
              type="checkbox"
              checked={value === v}
              onChange={e => check(v, e.target.checked)}
              className="checkbox checkbox-sm checkbox-warning"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {value && <input type="hidden" name="drafts" value={value} />}
      {value && (
        <p role="alert" className="flex items-center gap-1 text-sm text-warning-content bg-warning/30 rounded-field px-2 py-1">
          <WarningIcon size={16} weight="bold" aria-hidden />
          {WARNING} Premi Salva per confermare.
        </p>
      )}
    </div>
  )
}
