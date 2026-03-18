import { getPosts } from "@/lib/content"
import { TagPill } from "@/components/tag-pill"
import Link from "next/link"
import type { Metadata } from "next"


export const metadata: Metadata = {
  title: "Blog | John Moorman",
  description:
    "Technical writing on AI automation, web development, and engineering.",
}

export default async function BlogIndex() {
  const posts = await getPosts("blog")

  return (
    <section className="py-20">
      <Link
        href="/"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; Home
      </Link>
      <h1 className="mt-8 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Blog
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        Writing about things I&apos;ve built, lessons learned, and the
        occasional deep dive into a technical problem.
      </p>

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
                  {post.frontmatter.tags.map((tag) => (
                    <TagPill key={tag}>{tag}</TagPill>
                  ))}
                </div>
              )}
            </Link>
          </article>
        ))}

        {posts.length === 0 && (
          <p className="text-text-muted">No posts yet. Check back soon.</p>
        )}
      </div>
    </section>
  )
}
