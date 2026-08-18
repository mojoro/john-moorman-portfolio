import { getAllTags, type TagSummary } from "@/lib/tags"
import { TagPill } from "@/components/tag-pill"
import Link from "next/link"
import type { Metadata } from "next"

/** At three or more appearances a tag has earned a card instead of a pill. */
const CARD_THRESHOLD = 3

const TITLE = "Tags · Topics across John Moorman's work and writing"
const DESCRIPTION =
  "Browse every technology, discipline, and tool that shows up in the case studies and the engineering blog, by how often it appears."

export const metadata: Metadata = {
  title: "Tags",
  description: DESCRIPTION,
  alternates: { canonical: "/tags/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/tags/",
    type: "website",
    images: [
      {
        url: `/og/?title=${encodeURIComponent("Tags")}&subtitle=${encodeURIComponent("Every topic on the site · John Moorman")}`,
        width: 1200,
        height: 630,
        alt: "Tags · John Moorman",
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

/** "7 work · 6 blog", dropping whichever side is empty. */
function split(tag: TagSummary): string {
  const parts: string[] = []
  if (tag.workCount > 0) parts.push(`${tag.workCount} work`)
  if (tag.blogCount > 0) parts.push(`${tag.blogCount} blog`)
  return parts.join(" · ")
}

export default async function TagIndex() {
  const tags = await getAllTags()
  const featured = tags.filter((tag) => tag.count >= CARD_THRESHOLD)
  const rest = tags.filter((tag) => tag.count < CARD_THRESHOLD)

  return (
    <section className="py-20">
      <Link
        href="/"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; Home
      </Link>
      <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Tags
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        {tags.length} topics run through the case studies and the blog. The
        heavier ones lead.
      </p>

      {tags.length === 0 && (
        <p className="mt-12 text-text-muted">
          Nothing is tagged yet. Check back soon.
        </p>
      )}

      {featured.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Most used
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tag) => (
              <Link
                key={tag.slug}
                href={`/tags/${tag.slug}/`}
                className="group rounded-lg border border-border bg-bg-surface p-4 shadow-card transition-colors hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <p className="font-display font-semibold text-text-primary transition-colors group-hover:text-accent">
                  {tag.name}
                </p>
                <p className="mt-1 font-mono text-xs text-text-muted">
                  {split(tag)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Everything else
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            One or two appearances each.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {rest.map((tag) => (
              <TagPill key={tag.slug} href={`/tags/${tag.slug}/`}>
                {tag.name}
                <span className="ml-1.5 opacity-60">{tag.count}</span>
              </TagPill>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
