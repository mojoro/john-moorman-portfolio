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

  const challengePosts = posts.filter((p) => p.frontmatter.challenge === "10-in-10")
  const shipped = challengePosts.filter((p) => p.frontmatter.status === "shipped").length
  const inProgress = challengePosts.filter((p) => p.frontmatter.status === "in-progress").length

  const statusBadge = (status?: string) => {
    switch (status) {
      case "in-progress":
        return (
          <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 font-mono text-[10px] text-yellow-400">
            In Progress
          </span>
        )
      case "upcoming":
        return (
          <span className="rounded-full bg-text-muted/10 px-2 py-0.5 font-mono text-[10px] text-text-muted">
            Upcoming
          </span>
        )
      default:
        return (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
            Shipped
          </span>
        )
    }
  }

  return (
    <section className="py-20">
      <Link
        href="/"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; Home
      </Link>
      <h1 className="mt-8 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Work
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        Selected projects with technical depth. Each one solved a real problem
        for a real business.
      </p>

      {/* 10-in-10 Challenge Banner */}
      <div className="mt-10 rounded-lg border border-accent/20 bg-accent/5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-accent/70">
              Challenge
            </span>
            <h2 className="mt-1 text-lg font-semibold text-text-primary">
              10 Projects in 10 Weeks
            </h2>
          </div>
          <span className="font-mono text-sm text-accent/80">
            {shipped + inProgress} of 10 &middot; {shipped} shipped
          </span>
        </div>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < shipped
                  ? "bg-accent/70"
                  : i < shipped + inProgress
                  ? "bg-yellow-400/50"
                  : "bg-text-muted/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Project List */}
      <div className="mt-10 space-y-6">
        {posts.map((post) => {
          const status = post.frontmatter.status ?? "shipped"
          const isUpcoming = status === "upcoming"
          const challenge = post.frontmatter.challenge

          return (
            <Link
              key={post.slug}
              href={`/work/${post.slug}`}
              className={`group relative block rounded-lg border p-6 transition-all ${
                isUpcoming
                  ? "pointer-events-none border-dashed border-border/60 opacity-50"
                  : "border-border hover:border-accent/40 hover:bg-bg-surface"
              }`}
            >
              {!isUpcoming && (
                <span className="absolute top-4 right-4 text-text-muted text-sm transition-all duration-300 group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  ↗
                </span>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {post.frontmatter.featured && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
                    Featured
                  </span>
                )}
                {challenge && (
                  <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 font-mono text-[10px] text-yellow-400">
                    10 in 10
                  </span>
                )}
                {statusBadge(status)}
              </div>
              <h2 className="mt-2 font-display text-xl font-semibold transition-colors group-hover:text-accent">
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
          )
        })}

        {posts.length === 0 && (
          <p className="text-text-muted">Case studies coming soon.</p>
        )}
      </div>
    </section>
  )
}
