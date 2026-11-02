import type { MetadataRoute } from 'next'
import { getAllBlogPosts, getAllPages } from '@/lib/content'

const SITE_URL = 'https://mirandola2.it'

// Public pages only: /tabu and /api are left out (see also robots.ts)
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', '/blog', '/totem', ...getAllPages().map(p => p.path), ...getAllBlogPosts().map(p => p.path)]
  // trailingSlash: true in next.config.ts
  return paths.map(path => ({ url: SITE_URL + (path === '/' ? '/' : `${path}/`) }))
}
