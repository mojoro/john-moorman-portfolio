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
  status?: "shipped" | "in-progress" | "upcoming"
}

function inferHeroType(src: string): "image" | "video" {
  const ext = src.split(".").pop()?.toLowerCase() ?? ""
  if (["mp4", "webm", "mov", "ogv"].includes(ext)) return "video"
  return "image"
}

function StatusChip({ status }: { status: "in-progress" | "upcoming" }) {
  const styles =
    status === "in-progress"
      ? "bg-warning/15 text-warning ring-1 ring-warning/30"
      : "bg-text-muted/20 text-text-muted ring-1 ring-text-muted/20"
  const label = status === "in-progress" ? "In progress" : "Upcoming"
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur-sm ${styles}`}
    >
      {label}
    </span>
  )
}

interface DemoButtonProps {
  href: string
  variant: "primary" | "secondary"
  external?: boolean
  children: React.ReactNode
}

function DemoButton({ href, variant, external = true, children }: DemoButtonProps) {
  const base =
    "inline-flex h-9 items-center gap-1.5 rounded-md border px-4 font-mono text-xs no-underline transition-[background-color,border-color,color,scale] active:scale-[0.97]"
  const variantClass =
    variant === "primary"
      ? "border-accent/50 bg-accent/10 text-accent hover:border-accent hover:bg-accent/20"
      : "border-border bg-transparent text-text-secondary hover:border-accent/50 hover:text-accent"
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`${base} ${variantClass}`}
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
  const showStatus = status === "in-progress" || status === "upcoming"
  const hasActions = !!(live || github || blog)
  const hasStats = !!stats && Array.isArray(stats) && stats.length > 0

  return (
    <section className="work-demo my-8" aria-label="Project demo">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-surface shadow-card">
        {hero && (
          <div className="relative w-full bg-bg-elevated" style={aspectStyle}>
            {inferredType === "image" ? (
              <Image
                src={hero}
                alt={heroAlt}
                width={1200}
                height={675}
                className="block h-auto w-full"
                quality={95}
                sizes="(max-width: 768px) 100vw, 900px"
                priority
              />
            ) : (
              /* eslint-disable-next-line jsx-a11y/media-has-caption */
              <video
                src={hero}
                autoPlay
                muted
                loop
                playsInline
                className="block h-auto w-full"
                aria-label={heroAlt}
              />
            )}
            {showStatus && (
              <div className="absolute right-3 top-3">
                <StatusChip status={status as "in-progress" | "upcoming"} />
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 px-5 py-4 sm:px-6 sm:py-5">
          {!hero && showStatus && (
            <StatusChip status={status as "in-progress" | "upcoming"} />
          )}

          {caption && (
            <p className="text-pretty text-sm leading-relaxed text-text-secondary">
              {caption}
            </p>
          )}

          {hasStats && (
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 font-mono text-sm">
              {stats!.map((stat) => (
                <span key={stat.label} className="flex items-baseline gap-1.5">
                  <span className="font-semibold tabular-nums text-accent">
                    {stat.value}
                  </span>
                  <span className="text-text-muted">
                    {stat.label.toLowerCase()}
                  </span>
                </span>
              ))}
            </div>
          )}

          {hasActions && (
            <div className="flex flex-wrap items-center gap-2">
              {live && (
                <DemoButton href={live} variant="primary">
                  {liveLabel} <span aria-hidden="true">↗</span>
                </DemoButton>
              )}
              {github && (
                <DemoButton href={github} variant="secondary">
                  GitHub <span aria-hidden="true">↗</span>
                </DemoButton>
              )}
              {blog && (
                <DemoButton href={blog} variant="secondary" external={false}>
                  Write-up <span aria-hidden="true">→</span>
                </DemoButton>
              )}
            </div>
          )}

          {note && (
            <p className="text-pretty text-xs italic leading-relaxed text-text-muted">
              {note}
            </p>
          )}
        </div>
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
    <section className="work-demo my-8" aria-label="Live demo">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border bg-bg-elevated px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-text-muted/30" />
            <span className="size-2.5 rounded-full bg-text-muted/30" />
            <span className="size-2.5 rounded-full bg-text-muted/30" />
            <span className="ml-3 font-mono text-xs text-text-secondary">{title}</span>
          </div>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-accent no-underline transition-colors hover:underline"
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
