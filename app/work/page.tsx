import { getPosts, type Post } from "@/lib/content"
import { TagPill } from "@/components/tag-pill"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Work | John Moorman",
  description:
    "Case studies and technical deep dives into projects I've built.",
}

function statusBadge(status?: string) {
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

function ProjectCard({ post }: { post: Post }) {
  const status = post.frontmatter.status ?? "shipped"
  const isUpcoming = status === "upcoming"
  const challenge = post.frontmatter.challenge
  const thumbnail = post.frontmatter.thumbnail
  const stats = (post.frontmatter.stats ?? []).slice(0, 2)

  return (
    <Link
      key={post.slug}
      href={`/work/${post.slug}`}
      className={`group relative block overflow-hidden rounded-lg border transition-all ${
        isUpcoming
          ? "pointer-events-none border-dashed border-border/60 opacity-50"
          : "border-border hover:border-accent/40 hover:bg-bg-surface"
      }`}
    >
      <div className="flex flex-col items-stretch sm:flex-row">
        {thumbnail && !isUpcoming && (
          <div className="relative h-40 w-full overflow-hidden bg-bg-elevated sm:h-auto sm:w-56 sm:shrink-0">
            <Image
              src={thumbnail}
              alt=""
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, 224px"
            />
          </div>
        )}

        <div className="relative flex-1 p-6">
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
          {stats.length > 0 && (
            <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-xs text-text-muted">
              {stats.map((stat) => (
                <span key={stat.label} className="flex items-baseline gap-1.5">
                  <span className="tabular-nums text-accent/80">{stat.value}</span>
                  <span>{stat.label.toLowerCase()}</span>
                </span>
              ))}
            </div>
          )}
          {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.frontmatter.tags.map((tag) => (
                <TagPill key={tag}>{tag}</TagPill>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default async function WorkIndex() {
  const allPosts = await getPosts("work")
  const pinned = allPosts.find((p) => p.slug === "boa-automation")
  const rest = allPosts.filter((p) => p.slug !== "boa-automation")

  const challengePosts = allPosts.filter((p) => p.frontmatter.challenge === "10-in-10")
  const shipped = challengePosts.filter((p) => p.frontmatter.status === "shipped").length
  const inProgress = challengePosts.filter((p) => p.frontmatter.status === "in-progress").length

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
        Selected work with technical depth.
      </p>

      {pinned && (
        <div className="mt-10">
          <ProjectCard post={pinned} />
        </div>
      )}

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
        {rest.map((post) => (
          <ProjectCard key={post.slug} post={post} />
        ))}

        {allPosts.length === 0 && (
          <p className="text-text-muted">Case studies coming soon.</p>
        )}
      </div>
    </section>
  )
}
