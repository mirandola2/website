// Service worker of the installable app. What works offline is a short list of pages (below); every
// other page shows /offline/. Registered by components/PwaRegister.tsx, in production only.
//
// - Pages: network first. A copy is stored after each successful load and served when the network
//   fails (or is slower than NETWORK_TIMEOUT_MS, if there is a copy).
// - /_next/static/*: file names carry a content hash, so they are cache first. The scripts and styles
//   of every stored page are stored with it, otherwise Morse would open offline but not work.
// - Images from ImageKit (photos in the pages): cache first, bounded.
// - Pages of the Tabù are private: they live in their own cache, which the site empties on sign out
//   (lib/pwa.ts) and which is not served after PRIVATE_MAX_AGE_MS.
// - Everything else (API, server actions, analytics, other sites) is left to the network.
//
// Bump VERSION when the logic here changes: older caches are deleted on activation.

const VERSION = 'v1'
// Same names in lib/pwa.ts
const STATIC = `static-${VERSION}`
const PAGES = `pages-${VERSION}`
const PRIVATE = `private-${VERSION}`
const IMAGES = `images-${VERSION}`
const ALL_CACHES = [STATIC, PAGES, PRIVATE, IMAGES]

const OFFLINE_URL = '/offline/'
// Pages that are kept for offline use. The site has trailingSlash: true.
const PUBLIC_PATHS = ['/', '/morse/', '/totem/', '/codice-socio/']
const PRIVATE_PATHS = ['/tabu/', '/tabu/progetti/']

const NETWORK_TIMEOUT_MS = 5000
const PRIVATE_MAX_AGE_MS = 30 * 24 * 3600 * 1000
const MAX_STATIC = 200
const MAX_IMAGES = 150
const STORED_AT = 'x-sw-stored-at'

const isPrivatePath = pathname => pathname.startsWith('/tabu/')
const isOfflinePath = pathname => PUBLIC_PATHS.includes(pathname) || PRIVATE_PATHS.includes(pathname)
const cacheFor = pathname => (isPrivatePath(pathname) ? PRIVATE : PAGES)

self.addEventListener('install', event => {
  event.waitUntil(storePage(OFFLINE_URL, PAGES).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter(n => !ALL_CACHES.includes(n)).map(n => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

// From the page (components/PwaRegister.tsx): { type: 'store', urls: [...] } fetches and keeps
// those pages, to have them ready before the network goes away.
self.addEventListener('message', event => {
  const data = event.data
  if (data?.type !== 'store' || !Array.isArray(data.urls)) return
  event.waitUntil(
    Promise.all(
      data.urls.map(href => {
        const url = new URL(href, self.location.origin)
        if (url.origin !== self.location.origin || !isOfflinePath(url.pathname)) return null
        return storePage(url.pathname + url.search, cacheFor(url.pathname)).catch(() => {})
      }),
    ),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(handleNavigation(event, request, url))
  } else if (url.origin === self.location.origin && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/'))) {
    event.respondWith(cacheFirst(request, STATIC, MAX_STATIC))
  } else if (url.hostname === 'ik.imagekit.io' && request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGES, MAX_IMAGES, true))
  }
})

// --- Pages ---------------------------------------------------------------------------------------

async function handleNavigation(event, request, url) {
  const offline = isOfflinePath(url.pathname)
  const cacheName = cacheFor(url.pathname)

  const fromNetwork = fetch(request).then(response => {
    if (offline && isStorable(response)) event.waitUntil(keepPage(request.url, response.clone(), cacheName))
    return response
  })

  if (!offline) return fromNetwork.catch(offlinePage)

  const stored = await findPage(request.url, cacheName)
  if (!stored) return fromNetwork.catch(offlinePage)
  // A stored copy: the network gets a few seconds, then the copy wins ("lie-fi" is worse than offline)
  const timeout = new Promise(resolve => setTimeout(() => resolve(stored), NETWORK_TIMEOUT_MS))
  return Promise.race([fromNetwork, timeout]).catch(() => stored)
}

// A redirect (e.g. the Tabù sending a logged-out visitor to the login) must never be stored under
// the address that was asked for, nor an error page.
function isStorable(response) {
  return response.ok && !response.redirected && response.type === 'basic'
}

async function offlinePage() {
  return (await caches.match(OFFLINE_URL, { cacheName: PAGES })) || Response.error()
}

// The stored copy of a page, falling back to the same path without the query string (?anno=...)
async function findPage(href, cacheName) {
  const cache = await caches.open(cacheName)
  // Next marks its pages "Vary: rsc, ...": a stored page is the HTML one whatever those say
  const match = async key => cache.match(key, { ignoreVary: true })
  const response = (await match(href)) || (await match(href.split('?')[0]))
  if (!response) return null
  if (cacheName === PRIVATE) {
    const storedAt = Number(response.headers.get(STORED_AT))
    if (!storedAt || Date.now() - storedAt > PRIVATE_MAX_AGE_MS) return null
  }
  return response
}

async function keepPage(href, response, cacheName) {
  const html = await response.clone().text()
  const headers = new Headers(response.headers)
  headers.set(STORED_AT, String(Date.now()))
  const copy = new Response(html, { status: response.status, statusText: response.statusText, headers })
  const cache = await caches.open(cacheName)
  await cache.put(href, copy)
  await storeAssets(html)
}

async function storePage(href, cacheName) {
  const response = await fetch(href, { headers: { Accept: 'text/html' }, credentials: 'same-origin' })
  if (!isStorable(response)) return
  await keepPage(new URL(href, self.location.origin).href, response, cacheName)
}

// --- Static files --------------------------------------------------------------------------------

// The scripts, styles and fonts a page needs are named in its HTML (script tags and the data it
// carries for the client), so they can be stored without running the page. The fonts are named in
// the styles. File names are hashed, so the query string (?dpl=... on Vercel) is not part of the key.
async function storeAssets(html) {
  const urls = new Set(html.match(/\/_next\/static\/[^"'\\\s)<>]+\.(?:js|css|woff2)/g) || [])
  if (!urls.size) return
  const cache = await caches.open(STATIC)
  await Promise.all([...urls].map(path => storeAsset(cache, path)))
  await trim(STATIC, MAX_STATIC)
}

async function storeAsset(cache, path) {
  if (await cache.match(path, { ignoreSearch: true })) return
  try {
    const response = await fetch(path)
    if (!response.ok) return
    if (path.endsWith('.css')) {
      const fonts = new Set((await response.clone().text()).match(/media\/[^)"'\s]+\.woff2/g) || [])
      await Promise.all([...fonts].map(font => storeAsset(cache, `/_next/static/${font}`)))
    }
    await cache.put(path, response)
  } catch {
    // Stored later, when the page asks for it
  }
}

async function cacheFirst(request, cacheName, max, cors = false) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request.url, { ignoreSearch: cacheName === STATIC })
  if (hit) return hit
  try {
    // Images are asked without CORS by <img>, and the answer would be opaque: a copy of an opaque
    // response is counted by browsers as several MB. ImageKit allows CORS, so it is asked that way.
    const response = cors ? await fetch(request.url, { mode: 'cors' }).catch(() => fetch(request)) : await fetch(request)
    if (response.ok) {
      await cache.put(request.url, response.clone())
      await trim(cacheName, max)
    }
    return response
  } catch {
    return Response.error()
  }
}

// Oldest entries first (keys come in insertion order)
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map(key => cache.delete(key)))
}
