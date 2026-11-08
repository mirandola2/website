import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    // The Tabù policies stay crawlable (Google's OAuth verification fetches them); they are noindex anyway
    rules: { userAgent: '*', allow: ['/', '/tabu/privacy/', '/tabu/termini/'], disallow: ['/tabu/', '/api/', '/offline/', '/iban/'] },
    sitemap: 'https://mirandola2.it/sitemap.xml',
  }
}
