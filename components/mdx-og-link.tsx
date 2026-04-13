import { fetchOgData } from "@/lib/og"

interface OgLinkProps {
  url: string
}

export async function OgLink({ url }: OgLinkProps) {
  const og = await fetchOgData(url)

  if (!og || !og.title) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    )
  }

  const domain = new URL(url).hostname.replace(/^www\./, "")
  const isBanner =
    !!og.image &&
    og.imageWidth >= 600 &&
    og.imageHeight > 0 &&
    og.imageWidth / og.imageHeight >= 1.5

  const meta = (
    <div className="flex min-w-0 flex-col justify-center gap-1.5 p-4">
      <span className="font-mono text-xs text-text-muted">
        {og.siteName || domain}
      </span>
      <span className="line-clamp-2 font-display font-semibold text-text-primary transition-colors group-hover:text-accent">
        {og.title}
      </span>
      {og.description && (
        <span className="line-clamp-2 text-sm text-text-secondary">
          {og.description}
        </span>
      )}
    </div>
  )

  if (isBanner) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="og-link-card group my-6 block overflow-hidden rounded-lg border border-border bg-bg-surface transition-colors hover:border-accent/40"
      >
        <div
          className="w-full overflow-hidden"
          style={{
            aspectRatio: `${og.imageWidth} / ${og.imageHeight}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={og.image} alt="" className="h-full w-full object-cover" />
        </div>
        {meta}
      </a>
    )
  }

  if (og.image) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="og-link-card group my-6 flex flex-col overflow-hidden rounded-lg border border-border bg-bg-surface transition-colors hover:border-accent/40 sm:flex-row"
      >
        <div className="h-[160px] shrink-0 sm:h-auto sm:w-[200px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={og.image} alt="" className="h-full w-full object-cover" />
        </div>
        {meta}
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="og-link-card group my-6 block overflow-hidden rounded-lg border border-border bg-bg-surface transition-colors hover:border-accent/40"
    >
      {meta}
    </a>
  )
}
