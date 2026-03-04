import { getPosts } from "@/lib/content"
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
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Blog
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        Writing about things I&apos;ve built, lessons learned, and the
        occasional deep dive into a technical problem.
      </p>

      <div className="mt-12 space-y-10">
        {posts.map((post) => (
          <article key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group block"
            >
              <time className="font-mono text-xs text-text-muted">
                {new Date(post.frontmatter.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 className="mt-1 font-display text-xl font-semibold transition-colors group-hover:text-accent">
                {post.frontmatter.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {post.frontmatter.description}
              </p>
              {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.frontmatter.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-text-muted"
                    >
                      {tag}
                    </span>
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
