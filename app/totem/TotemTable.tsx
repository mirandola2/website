'use client'

import { useState, useMemo, useDeferredValue } from 'react'

export interface TotemPerson {
  name: string
  totem: string
  location: string
  year: string
}

interface TotemGroup {
  key: string
  year: string
  location: string
  people: TotemPerson[]
}

export default function TotemTable({ totem, children }: { totem: TotemPerson[]; children: React.ReactNode }) {
  const [filter, setFilter] = useState('')
  const deferredFilter = useDeferredValue(filter)

  const groups = useMemo(() => {
    const query = deferredFilter.trim().toLowerCase()
    const result = new Map<string, TotemGroup>()
    for (const person of totem) {
      if (
        query &&
        !person.name.toLowerCase().includes(query) &&
        !person.totem.toLowerCase().includes(query)
      ) {
        continue
      }
      const key = person.location + person.year
      let group = result.get(key)
      if (!group) {
        group = { key, year: person.year, location: person.location, people: [] }
        result.set(key, group)
      }
      group.people.push(person)
    }
    return [...result.values()]
  }, [totem, deferredFilter])

  return (
    <div className="container flex flex-col justify-between content-start gap-4 px-4 md:flex-row-reverse md:gap-8">
      <div className="md:w-1/2">
        {children}

        <fieldset className="fieldset w-full md:sticky md:top-20 mb-8">
          <legend className="fieldset-legend text-sm">Filtra per nome o per totem</legend>
          <input
            type="search"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Inserisci una parte del nome o del totem"
            className="input input-secondary w-full"
          />
        </fieldset>
      </div>

      <div className="md:w-1/2">
        {groups.length > 0 ? (
          // One table per group: a sticky row is only constrained by its table (not by its
          // tbody), so with a single table the old headers would never scroll away.
          <div>
            {groups.map(group => (
              <table key={group.key} className="table table-fixed h-fit">
                <tbody>
                  <tr className="bg-neutral sticky top-16 xl:top-[71px] z-1 rounded-xl">
                    <th className="rounded-l-xl w-1/2">{group.location}</th>
                    <th className="rounded-r-xl">{group.year}</th>
                  </tr>
                  {group.people.map((person, i) => (
                    <tr key={person.name + i} className="hover:bg-base-200">
                      <td className="rounded-l-xl">{person.name}</td>
                      <td className="rounded-r-xl">{person.totem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        ) : (
          <p className="my-8 text-center opacity-70">Nessun risultato per &ldquo;{filter}&rdquo;.</p>
        )}
      </div>
    </div>
  )
}
