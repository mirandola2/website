import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/content'
import { imagekitUrl } from '@/lib/imagekit'
import BlogLayout from '@/components/BlogLayout'
import BlogFeed from '@/components/BlogFeed'
import CategoryBadge, { formatMonthYear } from '@/components/CategoryBadge'
import type { Metadata } from 'next'
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react/ssr'

interface Props {
  params: Promise<{ slug: string }>
}

// Only the pages found at build time: any other path is a static 404
export const dynamicParams = false

export async function generateStaticParams() {
  return getAllBlogPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    openGraph: post.img ? { images: [imagekitUrl(post.img, 'w-1200')] } : undefined,
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) notFound()

  const { default: MDXContent } = await import(`@/content/blog/${slug}.mdx`)
  const otherPosts = getAllBlogPosts()
    .filter(p => p.slug !== slug)
    .slice(0, 2)

  return (
    <BlogLayout belowNavbar>
      <article>
        {/* Mobile: image on top. Desktop: text on the left, image on the right. */}
        <header className="card bg-base-200 overflow-hidden md:flex-row">
          {post.img && (
            <figure className="relative aspect-video w-full shrink-0 rounded-none md:order-last md:aspect-auto md:w-2/5 md:min-h-72">
              <Image
                src={post.img}
                alt=""
                fill
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 40vw, 100vw"
                preload
                className="object-cover"
              />
            </figure>
          )}
          <div className="card-body gap-3 md:justify-center md:p-8">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link href="/blog" className="inline-flex items-center gap-1 font-bold text-secondary hover:underline">
                <ArrowLeftIcon size={16} weight="bold" aria-hidden />
                Tutte le notizie
              </Link>
              <span className="opacity-40">·</span>
              <time dateTime={post.date} className="opacity-70">{formatMonthYear(post.date, true)}</time>
              {post.category && <CategoryBadge category={post.category} />}
            </nav>
            <h1 className="font-display text-4xl md:text-5xl text-primary text-balance">{post.title}</h1>
            {post.description && <p className="text-lg md:text-xl">{post.description}</p>}
          </div>
        </header>

        <div className="prose-container prose-lg mt-8 px-1">
          <MDXContent />
        </div>
      </article>

      {otherPosts.length > 0 && (
        <section className="mt-12 border-t border-base-300 pt-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold text-primary">Altre notizie</h2>
            <Link href="/blog" className="btn btn-sm btn-outline btn-primary">
              Vedi tutte
              <ArrowRightIcon size={16} weight="bold" aria-hidden />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <BlogFeed posts={otherPosts} images={false} />
          </div>
        </section>
      )}
    </BlogLayout>
  )
}
