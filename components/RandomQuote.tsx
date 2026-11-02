'use client'

import { useSyncExternalStore } from 'react'
import type { Quote } from '@/content/quotes'

// One random draw per page load. The static HTML is built once, so the pick must happen
// in the browser; the prerender keeps the space with an invisible placeholder.
const seed = Math.random()
const subscribe = () => () => {}

export default function RandomQuote({ quotes }: { quotes: Quote[] }) {
  const index = useSyncExternalStore(
    subscribe,
    () => Math.floor(seed * quotes.length),
    () => -1,
  )
  const quote = quotes[Math.max(index, 0)]

  return (
    <span className={index < 0 ? 'invisible' : undefined}>
      {quote.text}
      {quote.author && <> ({quote.author})</>}
    </span>
  )
}
