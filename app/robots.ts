import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/tabu/', '/api/'] },
    sitemap: 'https://mirandola2.it/sitemap.xml',
  }
}
