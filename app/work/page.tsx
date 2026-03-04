import { getPosts } from "@/lib/content"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Work | John Moorman",
  description:
    "Case studies and technical deep dives into projects I've built.",
}

export default async function WorkIndex() {
  const posts = await getPosts("work")

  return (
    <section className="py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Work
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        Selected projects with technical depth. Each one solved a real problem
        for a real business.
      </p>

      <div className="mt-12 space-y-8">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/work/${post.slug}`}
            className="group block rounded-lg border border-border p-6 transition-all hover:border-accent/40 hover:bg-bg-surface"
          >
            <h2 className="font-display text-xl font-semibold transition-colors group-hover:text-accent">
              {post.frontmatter.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {post.frontmatter.description}
            </p>
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
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
        ))}

        {posts.length === 0 && (
          <p className="text-text-muted">Case studies coming soon.</p>
        )}
      </div>
    </section>
  )
}
