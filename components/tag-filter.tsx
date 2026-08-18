import Link from "next/link"
import { TagPill } from "@/components/tag-pill"

export interface FilterTag {
  name: string
  slug: string
  count: number
}

/** Enough to be useful, few enough that the row stays a row. */
const MAX_CHIPS = 10

/**
 * Server-rendered filter chips for an index page. Every chip is a plain link
 * to `?tag=`, so narrowing costs no client JavaScript.
 */
export function TagFilter({
  basePath,
  tags,
  activeSlug,
  label,
}: {
  /** Index route the chips filter, trailing slash included. */
  basePath: string
  tags: FilterTag[]
  activeSlug?: string
  label: string
}) {
  if (tags.length === 0) return null

  const shown = tags.slice(0, MAX_CHIPS)
  const active = tags.find((tag) => tag.slug === activeSlug)
  // A filter applied from elsewhere still gets a chip, even outside the top N.
  if (active && !shown.includes(active)) shown.push(active)

  return (
    <nav aria-label={label} className="mt-8 flex flex-wrap items-center gap-2">
      <TagPill href={basePath} active={!activeSlug}>
        All
      </TagPill>
      {shown.map((tag) => (
        <TagPill
          key={tag.slug}
          href={`${basePath}?tag=${tag.slug}`}
          active={tag.slug === activeSlug}
        >
          {tag.name}
          <span className="ml-1.5 opacity-60">{tag.count}</span>
        </TagPill>
      ))}
      <Link
        href="/tags/"
        className="ml-1 rounded font-mono text-[11px] text-text-muted transition-colors hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        All tags &rarr;
      </Link>
    </nav>
  )
}
