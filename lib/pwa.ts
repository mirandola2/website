// Shared by the pieces of the installable app that run in the page; the service worker itself is
// public/sw.js, which cannot import this: keep the names and the lists in step with it.

// Pages kept for offline use. The first group is public, the second is the Tabù (it is stored only
// for a logged-in leader, see PwaRegister).
export const OFFLINE_PUBLIC = ['/', '/morse/', '/totem/', '/codice-socio/']
export const OFFLINE_PRIVATE = ['/tabu/', '/tabu/progetti/']
export const isOfflinePath = (pathname: string) => OFFLINE_PUBLIC.includes(pathname) || OFFLINE_PRIVATE.includes(pathname)

// Name of the cache holding the Tabù pages (see VERSION in sw.js)
const PRIVATE_CACHE_PREFIX = 'private-'

// The stored Tabù pages are the leaders' projects: on sign out they must not stay on the device.
// A cache is shared between the page and the service worker, so the page can empty it directly.
export async function clearPrivateCache() {
  try {
    const names = await caches.keys()
    await Promise.all(names.filter(n => n.startsWith(PRIVATE_CACHE_PREFIX)).map(n => caches.delete(n)))
  } catch {
    // No Cache API (private window, http): nothing was stored
  }
}

// Asks the service worker to fetch and keep these pages
export async function storePages(urls: string[]) {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration('/')
  registration?.active?.postMessage({ type: 'store', urls })
}
