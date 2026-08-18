import Link from "next/link"

const BASE =
  "rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors"

interface TagPillProps {
  children: React.ReactNode
  /**
   * Where the pill links. Omit it inside a card that is itself a link: an
   * anchor cannot contain another anchor, so those pills stay inert and the
   * card's own href wins.
   */
  href?: string
  /** Filled treatment for the filter currently applied. */
  active?: boolean
}

export function TagPill({ children, href, active = false }: TagPillProps) {
  if (!href) {
    return (
      <span className={`${BASE} border-border text-text-muted`}>
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${BASE} focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border text-text-muted hover:border-accent/30 hover:bg-accent/10 hover:text-accent"
      }`}
    >
      {children}
    </Link>
  )
}
