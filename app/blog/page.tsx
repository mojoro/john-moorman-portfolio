import { getPosts } from "@/lib/content"
import { firstTagParam, getAllTags, postHasTag } from "@/lib/tags"
import { TagPill } from "@/components/tag-pill"
import { TagFilter } from "@/components/tag-filter"
import Link from "next/link"
import type { Metadata } from "next"


const TITLE = "Engineering Blog by John Moorman"
const DESCRIPTION =
  "Posts on AI-native development, automation, web engineering, and lessons from shipping production systems with Next.js, TypeScript, and the Anthropic API."

const BASE_METADATA: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/blog",
    type: "website",
    images: [
      {
        url: `/og/?title=${encodeURIComponent("Blog")}&subtitle=${encodeURIComponent("Engineering writing · John Moorman")}`,
        width: 1200,
        height: 630,
        alt: "Blog · John Moorman",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@John_Moorman",
    site: "@John_Moorman",
  },
}

interface Props {
  searchParams: Promise<{ tag?: string | string[] }>
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const active = firstTagParam((await searchParams).tag)
  // A filtered view is a slice of the tag archive; let the archive rank instead.
  if (!active) return BASE_METADATA
  return { ...BASE_METADATA, robots: { index: false, follow: true } }
}

export default async function BlogIndex({ searchParams }: Props) {
  const activeSlug = firstTagParam((await searchParams).tag)
  const [allPosts, allTags] = await Promise.all([getPosts("blog"), getAllTags()])

  const tags = allTags
    .filter((tag) => tag.blogCount > 0)
    .map((tag) => ({ name: tag.name, slug: tag.slug, count: tag.blogCount }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const posts = activeSlug
    ? allPosts.filter((post) => postHasTag(post, activeSlug))
    : allPosts
  const activeName = tags.find((tag) => tag.slug === activeSlug)?.name

  return (
    <section className="py-20">
      <Link
        href="/"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; Home
      </Link>
      <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Blog
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        Writing about things I&apos;ve built, lessons learned, and the
        occasional deep dive into a technical problem.
      </p>

      <TagFilter
        basePath="/blog/"
        tags={tags}
        activeSlug={activeSlug}
        label="Filter posts by tag"
      />

      <div className="mt-12 divide-y divide-accent/15">
        {posts.map((post) => (
          <article key={post.slug} className="py-8 first:pt-0 last:pb-0">
            <Link
              href={`/blog/${post.slug}`}
              className="group block"
            >
              <div className="flex items-center gap-3 font-mono text-xs text-text-muted">
                <time>
                  {new Date(post.frontmatter.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span className="text-border">·</span>
                <span>{Math.max(1, Math.round(post.content.trim().split(/\s+/).length / 238))} min read</span>
              </div>
              <h2 className="mt-1 font-display text-xl font-semibold transition-colors group-hover:text-accent">
                {post.frontmatter.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {post.frontmatter.description}
              </p>
              {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* Inert: the card is already a link, and anchors cannot nest. */}
                  {post.frontmatter.tags.map((tag) => (
                    <TagPill key={tag}>{tag}</TagPill>
                  ))}
                </div>
              )}
            </Link>
          </article>
        ))}

        {posts.length === 0 && activeSlug && (
          <p className="text-text-muted">
            Nothing tagged {activeName ?? activeSlug} yet.{" "}
            <Link
              href="/blog/"
              className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
            >
              Show every post
            </Link>
            .
          </p>
        )}

        {allPosts.length === 0 && (
          <p className="text-text-muted">No posts yet. Check back soon.</p>
        )}
      </div>
    </section>
  )
}
