import { getPosts, type Post } from "@/lib/content"
import { TagPill } from "@/components/tag-pill"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

const TITLE = "Work · Case Studies by John Moorman"
const DESCRIPTION =
  "Selected engineering case studies: a €74K/year automation suite for Berlin Opera Academy, an AI real-estate intelligence pipeline, an AI job-search SaaS, and a shelf of shipped personal projects."

export const metadata: Metadata = {
  title: "Work",
  description: DESCRIPTION,
  alternates: { canonical: "/work" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/work",
    type: "website",
    images: [
      {
        url: `/og/?title=${encodeURIComponent("Work")}&subtitle=${encodeURIComponent("Case studies · John Moorman")}`,
        width: 1200,
        height: 630,
        alt: "Work · John Moorman",
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

function statusBadge(status?: string) {
  switch (status) {
    case "in-progress":
      return (
        <span className="rounded-full bg-warning/10 px-2 py-0.5 font-mono text-[10px] text-warning">
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
  const thumbnail = post.frontmatter.thumbnail
  const stats = (post.frontmatter.stats ?? []).slice(0, 2)

  return (
    <Link
      key={post.slug}
      href={`/work/${post.slug}`}
      className={`group relative block overflow-hidden rounded-lg border transition-colors ${
        isUpcoming
          ? "pointer-events-none border-dashed border-border/60 opacity-50"
          : "border-border bg-bg-surface shadow-card hover:border-accent/40"
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
            <span className="absolute top-4 right-4 text-2xl leading-none text-text-muted transition-all duration-300 group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              ↗
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {post.frontmatter.featured && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
                Featured
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
                  <span className="tabular-nums text-accent">{stat.value}</span>
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
  const funPosts = allPosts.filter((p) => p.frontmatter.fun)

  // Live engagements lead, then the real-estate pipeline and BOA as the
  // flagship case studies, then the rest by date.
  const clientPosts = allPosts.filter((p) => !p.frontmatter.fun)
  const pinned = ["real-estate-pipeline", "boa-automation"]
  const inProgress = clientPosts.filter(
    (p) => p.frontmatter.status === "in-progress"
  )
  const flagships = pinned.flatMap((slug) =>
    clientPosts.filter((p) => p.slug === slug)
  )
  const remaining = clientPosts.filter(
    (p) =>
      p.frontmatter.status !== "in-progress" && !pinned.includes(p.slug)
  )
  const ordered = [...inProgress, ...flagships, ...remaining]

  return (
    <section className="py-20">
      <Link
        href="/"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; Home
      </Link>
      <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Work
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        Selected work with technical depth.
      </p>

      {/* Project List */}
      <div className="mt-10 space-y-6">
        {ordered.map((post) => (
          <ProjectCard key={post.slug} post={post} />
        ))}

        {allPosts.length === 0 && (
          <p className="text-text-muted">Case studies coming soon.</p>
        )}
      </div>

      {/* Fun projects */}
      {funPosts.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Fun, Open Source Projects
          </h2>
          <p className="mt-3 max-w-xl text-text-secondary">
            Things I built because I wanted them to exist. No client, no brief,
            every one of them shipped.
          </p>
          <div className="mt-10 space-y-6">
            {funPosts.map((post) => (
              <ProjectCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
