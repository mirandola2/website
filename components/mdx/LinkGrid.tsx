'use client'

import { useState } from 'react'
import type { LinkType } from '@/lib/links'
import LinkTypeIcon from './LinkTypeIcon'

interface LinkEntry {
  category: string
  type: LinkType
  name: string
  url: string
}

// Rows grouped by category, with a button per category to show only that one
export default function LinkGrid({ links }: { links: LinkEntry[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const categories = [...new Set(links.map(l => l.category))].sort((a, b) => a.localeCompare(b, 'it'))
  const shown = selected ? [selected] : categories

  if (!links.length) return <p>Nessun materiale per ora.</p>

  return (
    <div className="not-prose space-y-4">
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtra per categoria">
          {[null, ...categories].map(c => (
            <button
              key={c ?? '*'}
              type="button"
              aria-pressed={selected === c}
              onClick={() => setSelected(c)}
              className={`btn btn-sm btn-primary ${selected === c ? '' : 'btn-outline'}`}
            >
              {c ?? 'Tutti'}
            </button>
          ))}
        </div>
      )}
      {shown.map(category => (
        <section key={category} className="bg-base-200 p-6 rounded-box">
          <h2 className="text-2xl font-bold text-primary mb-4">{category}</h2>
          <ul className="grid md:grid-cols-2 gap-3">
            {links
              .filter(l => l.category === category)
              .map(l => (
                <li key={l.url + l.name}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card card-sm bg-base-100 h-full shadow-sm hover:shadow-lg transition-shadow group"
                  >
                    <span className="card-body flex-row items-center gap-3">
                      <span className="text-secondary shrink-0">
                        <LinkTypeIcon type={l.type} size={24} />
                      </span>
                      <span className="font-medium group-hover:text-secondary group-hover:underline">{l.name}</span>
                    </span>
                  </a>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
