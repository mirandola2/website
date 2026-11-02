import { notFound } from 'next/navigation'
import { getAllPages, getPageByPath } from '@/lib/content'
import { imagekitUrl } from '@/lib/imagekit'
import Hero from '@/components/Hero'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string[] }>
}

// Only the pages found at build time: any other path is a static 404
export const dynamicParams = false

export async function generateStaticParams() {
  return getAllPages().map(page => ({
    slug: page.path.split('/').filter(Boolean),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = getPageByPath('/' + slug.join('/'))
  if (!page) return {}

  return {
    title: page.title,
    description: page.description,
    openGraph: page.img ? { images: [imagekitUrl(page.img, 'w-1200')] } : undefined,
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const page = getPageByPath('/' + slug.join('/'))
  if (!page) notFound()

  const { default: MDXContent } = await import(`@/content/${page.slug}.mdx`)

  return (
    <>
      <Hero title={page.title} image={page.img} />
      <div className="container mt-5">
        <div className="prose-container">
          <MDXContent />
        </div>
      </div>
    </>
  )
}
