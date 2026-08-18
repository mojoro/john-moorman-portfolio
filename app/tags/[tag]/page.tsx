import { getAllTags, getTagArchive, type ContentType } from "@/lib/tags"
import { type Post } from "@/lib/content"
import { TagPill } from "@/components/tag-pill"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ tag: string }>
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** "7 case studies and 6 posts" — omits whichever side is empty. */
function inventory(workCount: number, blogCount: number): string {
  const parts: string[] = []
  if (workCount > 0) parts.push(plural(workCount, "case study", "case studies"))
  if (blogCount > 0) parts.push(plural(blogCount, "post", "posts"))
  return parts.join(" and ")
}

/**
 * The vocabulary is fully known at build time, so every tag URL is prerendered
 * and anything else resolves to not-found without walking the content tree.
 */
export const dynamicParams = false

export async function generateStaticParams() {
  const tags = await getAllTags()
  return tags.map((tag) => ({ tag: tag.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: slug } = await params
  const archive = await getTagArchive(slug)
  if (!archive) return { title: "Tag Not Found", robots: { index: false } }

  const url = `/tags/${archive.slug}/`
  const description = `${inventory(archive.work.length, archive.blog.length)} tagged ${archive.name}, from John Moorman's engineering portfolio.`
  const ogImage = `/og/?title=${encodeURIComponent(archive.name)}&eyebrow=${encodeURIComponent("johnmoorman.com / tags")}&subtitle=${encodeURIComponent(inventory(archive.work.length, archive.blog.length))}`

  return {
    title: archive.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `Tagged ${archive.name} · John Moorman`,
      description,
      url,
      type: "website",
      images: [
        { url: ogImage, width: 1200, height: 630, alt: `Tagged ${archive.name}` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Tagged ${archive.name} · John Moorman`,
      description,
      images: [ogImage],
      creator: "@John_Moorman",
      site: "@John_Moorman",
    },
  }
}

function PostRow({ post, type }: { post: Post; type: ContentType }) {
  const tags = post.frontmatter.tags ?? []

  return (
    <article className="py-6 first:pt-0 last:pb-0">
      <Link href={`/${type}/${post.slug}/`} className="group block">
        <time
          dateTime={post.frontmatter.date}
          className="font-mono text-xs text-text-muted"
        >
          {new Date(post.frontmatter.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <h3 className="mt-1 font-display text-lg font-semibold transition-colors group-hover:text-accent">
          {post.frontmatter.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {post.frontmatter.description}
        </p>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Inert: this card is already a link, and anchors cannot nest. */}
            {tags.map((tag) => (
              <TagPill key={tag}>{tag}</TagPill>
            ))}
          </div>
        )}
      </Link>
    </article>
  )
}

function ArchiveSection({
  heading,
  posts,
  type,
}: {
  heading: string
  posts: Post[]
  type: ContentType
}) {
  if (posts.length === 0) return null

  return (
    <div className="mt-14">
      <h2 className="font-display text-xl font-semibold tracking-tight">
        {heading}
      </h2>
      <div className="mt-4 divide-y divide-accent/15">
        {posts.map((post) => (
          <PostRow key={post.slug} post={post} type={type} />
        ))}
      </div>
    </div>
  )
}

export default async function TagArchive({ params }: Props) {
  const { tag: slug } = await params
  const archive = await getTagArchive(slug)

  if (!archive) notFound()

  return (
    <section className="py-20">
      <Link
        href="/tags/"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; All tags
      </Link>

      <p className="mt-8 font-mono text-xs text-accent">Tagged</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {archive.name}
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        {inventory(archive.work.length, archive.blog.length)} carrying this tag.
      </p>

      <ArchiveSection heading="Case studies" posts={archive.work} type="work" />
      <ArchiveSection heading="Writing" posts={archive.blog} type="blog" />
    </section>
  )
}
