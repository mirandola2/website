'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { DownloadSimpleIcon } from '@phosphor-icons/react'

// Chromium's install prompt event (not in the DOM typings)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
// iPadOS reports itself as a Mac with a touch screen
const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
// Neither changes while the page is open
const noSubscribe = () => () => {}

// "Installa l'app" in the footer. Chrome and Edge give an install prompt on request; Safari on iOS
// has none, the only way is the Share menu, so there it explains it. Hidden when already installed
// and where the browser can't install (desktop Safari and Firefox).
export default function InstallApp() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  // Server snapshot: nothing, so that the first render is the same on the server and in the browser
  const ios = useSyncExternalStore(noSubscribe, () => isIos() && !isStandalone(), () => false)
  const [help, setHelp] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setPrompt(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!prompt && !ios) return null

  async function install() {
    if (prompt) {
      await prompt.prompt()
      // The event can be used once
      setPrompt(null)
    } else {
      setHelp(h => !h)
    }
  }

  return (
    <div className="space-y-1">
      <button type="button" className="link link-hover inline-flex items-center gap-1 text-accent font-bold" onClick={install}>
        <DownloadSimpleIcon size={18} weight="bold" aria-hidden />
        Installa l&apos;app
      </button>
      {help && (
        <p className="text-sm max-w-xs">
          Tocca il pulsante Condividi del browser, poi «Aggiungi alla schermata Home».
        </p>
      )}
    </div>
  )
}
