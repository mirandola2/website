import fs from 'fs'
import path from 'path'
import { parse as parseYaml } from 'yaml'

const contentDir = path.join(process.cwd(), 'content')
const blogDir = path.join(contentDir, 'blog')

export interface PageDoc {
  slug: string
  path: string
  title: string
  date: string
  description?: string
  img?: string
  category?: string
}

export type BlogPost = PageDoc

// The build calls these helpers once per generated page (params, metadata and
// render), so cache the parsed content for the whole build. In dev, always re-read to
// pick up edits without restarting the server.
const shouldCache = process.env.NODE_ENV === 'production'

function cached<T>(fn: () => T): () => T {
  let value: T | undefined
  return () => {
    if (!shouldCache) return fn()
    if (value === undefined) value = fn()
    return value
  }
}

// YAML between the leading `---` fences. Dates stay plain strings (e.g. "2025-05-01").
function readFrontmatter(filePath: string) {
  const match = fs.readFileSync(filePath, 'utf-8').match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
  return (match && parseYaml(match[1])) || {}
}

export const getAllPages = cached((): PageDoc[] =>
  walkDir(contentDir)
    .filter(f => {
      if (!f.endsWith('.mdx')) return false
      const rel = path.relative(contentDir, f)
      return !rel.startsWith('blog' + path.sep) && !rel.startsWith('_')
    })
    .map(file => {
      const data = readFrontmatter(file)
      const slug = path.relative(contentDir, file).replace(/\.mdx$/, '').replace(/\\/g, '/')
      const routePath = '/' + slug.replace(/(^|\/)index$/, '')
      return {
        slug,
        path: routePath,
        title: data.title || slug,
        date: data.date || '',
        description: data.description,
        img: data.image,
        category: data.category,
      }
    }),
)

export function getPageByPath(pagePath: string): PageDoc | null {
  const normalized = pagePath.replace(/\/$/, '') || '/'
  return getAllPages().find(p => p.path === normalized) || null
}

export const getAllBlogPosts = cached((): BlogPost[] => {
  if (!fs.existsSync(blogDir)) return []
  return fs
    .readdirSync(blogDir)
    .filter(f => f.endsWith('.mdx'))
    .map(file => {
      const data = readFrontmatter(path.join(blogDir, file))
      const slug = file.replace(/\.mdx$/, '')
      return {
        slug,
        path: '/blog/' + slug,
        title: data.title || slug,
        date: data.date || '',
        description: data.description || '',
        img: data.img,
        category: data.category,
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return getAllBlogPosts().find(p => p.slug === slug) || null
}

function walkDir(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walkDir(full) : [full]
  })
}
