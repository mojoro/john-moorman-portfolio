import Link from "next/link"

const BASE =
  "rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors"

const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"

/**
 * Lifts the pill above a stretched card link and, below `md`, stops it taking
 * pointer events at all so a tap lands on the card underneath. Touch targets
 * this small are not worth the mis-taps; a pointer can hit them precisely.
 */
const OVER_CARD = "relative z-10 pointer-events-none md:pointer-events-auto"

interface TagPillProps {
  children: React.ReactNode
  /** Where the pill links. Omit to render an inert badge. */
  href?: string
  /** Filled treatment for the filter currently applied. */
  active?: boolean
  /**
   * Set on a pill that sits inside a card whose own link is stretched across
   * the card. The card link must be a pseudo-element overlay, never an
   * ancestor: an anchor inside an anchor is invalid HTML.
   */
  overCardLink?: boolean
}

export function TagPill({
  children,
  href,
  active = false,
  overCardLink = false,
}: TagPillProps) {
  if (!href) {
    return (
      <span className={`${BASE} border-border text-text-muted`}>
        {children}
      </span>
    )
  }

  const state = active
    ? "border-accent/50 bg-accent/10 text-accent"
    : "border-border text-text-muted hover:border-accent/30 hover:bg-accent/10 hover:text-accent"

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      // Tags are secondary navigation, and an index page carries dozens of
      // pills. Viewport prefetching them floods the network with archives
      // nobody asked for; false still warms the route on hover.
      prefetch={false}
      className={`${BASE} ${FOCUS} ${overCardLink ? OVER_CARD : ""} ${state}`}
    >
      {children}
    </Link>
  )
}
