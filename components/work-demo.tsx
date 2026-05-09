import Image from "next/image"

export interface WorkDemoStat {
  value: string
  label: string
}

export interface WorkDemoProps {
  hero?: string
  heroAlt?: string
  heroType?: "image" | "video"
  heroAspect?: string
  caption?: string
  stats?: WorkDemoStat[]
  live?: string
  liveLabel?: string
  github?: string
  blog?: string
  note?: string
  status?: "shipped" | "in-progress"
}

function inferHeroType(src: string): "image" | "video" {
  const ext = src.split(".").pop()?.toLowerCase() ?? ""
  if (["mp4", "webm", "mov", "ogv"].includes(ext)) return "video"
  return "image"
}

function StatusBadge({ status }: { status: "shipped" | "in-progress" }) {
  if (status === "in-progress") {
    return (
      <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 font-mono text-[10px] text-yellow-400">
        In Progress
      </span>
    )
  }
  return (
    <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
      Shipped
    </span>
  )
}

function ActionButton({
  href,
  children,
  primary,
  external = true,
}: {
  href: string
  children: React.ReactNode
  primary?: boolean
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={
        primary
          ? "inline-flex items-center gap-1.5 rounded border border-accent px-4 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/10"
          : "inline-flex items-center gap-1.5 rounded border border-border px-4 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-accent"
      }
    >
      {children}
    </a>
  )
}

export function WorkDemo({
  hero,
  heroAlt = "",
  heroType,
  heroAspect,
  caption,
  stats,
  live,
  liveLabel = "Live site",
  github,
  blog,
  note,
  status,
}: WorkDemoProps) {
  const inferredType = hero ? heroType ?? inferHeroType(hero) : undefined
  const aspectStyle = heroAspect ? { aspectRatio: heroAspect } : undefined

  const hasActions = live || github || blog
  const hasMeta = stats && stats.length > 0

  return (
    <section
      className="my-8 overflow-hidden rounded-lg border border-border bg-bg-surface"
      aria-label="Project demo"
    >
      {hero && inferredType === "image" && (
        <div
          className="relative w-full bg-bg-elevated"
          style={aspectStyle}
        >
          <Image
            src={hero}
            alt={heroAlt}
            width={1200}
            height={675}
            className="h-auto w-full"
            quality={95}
            sizes="(max-width: 768px) 100vw, 900px"
            priority
          />
        </div>
      )}

      {hero && inferredType === "video" && (
        <div className="w-full bg-bg-elevated" style={aspectStyle}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={hero}
            autoPlay
            muted
            loop
            playsInline
            className="h-auto w-full"
            aria-label={heroAlt}
          />
        </div>
      )}

      <div className="px-5 py-4 sm:px-6 sm:py-5">
        {(status || caption) && (
          <div className="flex flex-wrap items-center gap-3">
            {status && <StatusBadge status={status} />}
            {caption && (
              <p className="text-sm text-text-secondary">{caption}</p>
            )}
          </div>
        )}

        {hasMeta && (
          <div
            className={`flex flex-wrap gap-x-8 gap-y-3 ${
              status || caption ? "mt-4" : ""
            }`}
          >
            {stats!.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-bold text-accent">
                  {stat.value}
                </p>
                <p className="font-mono text-xs text-text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {hasActions && (
          <div
            className={`flex flex-wrap gap-2 ${
              status || caption || hasMeta ? "mt-5" : ""
            }`}
          >
            {live && (
              <ActionButton href={live} primary>
                {liveLabel} ↗
              </ActionButton>
            )}
            {github && (
              <ActionButton href={github}>GitHub ↗</ActionButton>
            )}
            {blog && (
              <ActionButton href={blog} external={false}>
                Write-up →
              </ActionButton>
            )}
          </div>
        )}

        {note && (
          <p className="mt-4 border-t border-border pt-4 font-mono text-xs text-text-muted">
            {note}
          </p>
        )}
      </div>
    </section>
  )
}

export interface LiveEmbedProps {
  src: string
  title: string
  height?: number
  note?: string
}

export function LiveEmbed({ src, title, height = 720, note }: LiveEmbedProps) {
  return (
    <section className="my-8" aria-label="Live demo">
      <div className="overflow-hidden rounded-lg border border-border bg-bg-surface">
        <div className="flex items-center justify-between border-b border-border bg-bg-elevated px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-text-muted/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-text-muted/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-text-muted/30" />
            <span className="ml-3 font-mono text-xs text-text-muted">{title}</span>
          </div>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-accent transition-colors hover:underline"
          >
            Open ↗
          </a>
        </div>
        <iframe
          src={src}
          title={title}
          loading="lazy"
          className="block w-full border-0"
          style={{ height: `${height}px` }}
        />
      </div>
      {note && (
        <p className="mt-2 text-center font-mono text-xs text-text-muted">
          {note}
        </p>
      )}
    </section>
  )
}
