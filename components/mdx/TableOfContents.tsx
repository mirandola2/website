'use client'

import { useState, useEffect, useRef } from 'react'
import { slugify } from '@/lib/format'

interface TocItem {
  id: string
  text: string
  children: TocItem[]
}

interface TableOfContentsProps {
  notaside?: boolean
  maxdepth?: number
}

// MDX headings have no ids: assign them here so both the TOC and in-page links
// (e.g. <Lnk href="#obiettivi-2024-25">) can jump to them.
function getTocFromDom(root: ParentNode): TocItem[] {
  const items: TocItem[] = []
  let current: TocItem | null = null

  root.querySelectorAll<HTMLHeadingElement>('h2, h3').forEach(h => {
    if (h.closest('[data-toc-ignore]')) return
    const text = h.textContent?.trim() || ''
    if (!text) return
    if (!h.id) h.id = slugify(text)
    const item: TocItem = { id: h.id, text, children: [] }

    if (h.tagName === 'H2') {
      items.push(item)
      current = item
    } else if (current) {
      current.children.push(item)
    } else {
      items.push(item)
    }
  })

  return items
}

export default function TableOfContents({ notaside = false, maxdepth = 2 }: TableOfContentsProps) {
  const ref = useRef<HTMLElement>(null)
  const [toc, setToc] = useState<TocItem[]>([])

  useEffect(() => {
    const root = ref.current?.closest('.prose-container') ?? document
    setToc(getTocFromDom(root))
    // Re-run the browser's scroll-to-hash now that the target ids exist.
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (hash) document.getElementById(hash)?.scrollIntoView()
  }, [])

  return (
    <nav
      ref={ref}
      data-toc-ignore
      aria-label="Indice"
      className={`not-prose card w-full bg-base-200 text-base-content my-5 ${
        !notaside ? 'md:float-right md:ml-5 md:w-96' : ''
      } ${toc.length === 0 ? 'hidden' : ''}`}
    >
      <div className="card-body">
        <h2 className="card-title text-primary">Indice</h2>
        <ul className="space-y-1">
          {toc.map(link => (
            <li key={link.id}>
              <a href={`#${link.id}`} className="link link-hover">{link.text}</a>
              {maxdepth > 2 && link.children.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {link.children.map(child => (
                    <li key={child.id} className="ml-4 text-sm">
                      <a href={`#${child.id}`} className="link link-hover">{child.text}</a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
