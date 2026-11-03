'use client'

import { useSyncExternalStore } from 'react'
import { WifiSlashIcon } from '@phosphor-icons/react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

// Tells that the page may be a stored copy. The server snapshot is "online": nothing at first render.
export default function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  if (online) return null
  return (
    <div className="toast toast-bottom toast-center z-50 max-w-[calc(100vw-1rem)]" role="status">
      <div className="alert alert-warning shadow-lg">
        <WifiSlashIcon size={20} weight="bold" aria-hidden />
        <span>Sei offline: stai vedendo la versione salvata della pagina.</span>
      </div>
    </div>
  )
}
