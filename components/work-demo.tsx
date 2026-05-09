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
      ? "bg-yellow-400/15 text-yellow-300 ring-1 ring-yellow-400/30"
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
    <section className="my-8" aria-label="Project demo">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-surface">
        {hero && (
          <div className="relative w-full bg-bg-elevated" style={aspectStyle}>
            {inferredType === "image" ? (
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
            ) : (
              /* eslint-disable-next-line jsx-a11y/media-has-caption */
              <video
                src={hero}
                autoPlay
                muted
                loop
                playsInline
                className="h-auto w-full"
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

        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          {!hero && showStatus && (
            <StatusChip status={status as "in-progress" | "upcoming"} />
          )}

          {caption && (
            <p
              className="text-pretty text-[15px] leading-relaxed text-text-secondary"
            >
              {caption}
            </p>
          )}

          {hasStats && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-9">
              {stats!.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <p className="font-display text-2xl font-bold tabular-nums leading-none text-accent">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {hasActions && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
              {live && (
                <a
                  href={live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-accent/50 bg-accent/10 px-3.5 py-2 font-mono text-xs text-accent transition-[background-color,border-color,scale] hover:border-accent hover:bg-accent/15 active:scale-[0.96]"
                >
                  {liveLabel}
                  <span aria-hidden="true" className="text-[10px]">
                    ↗
                  </span>
                </a>
              )}
              {github && (
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-2 font-mono text-xs text-text-secondary transition-colors hover:text-accent"
                >
                  GitHub
                  <span aria-hidden="true" className="text-[10px]">
                    ↗
                  </span>
                </a>
              )}
              {blog && (
                <a
                  href={blog}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-2 font-mono text-xs text-text-secondary transition-colors hover:text-accent"
                >
                  Write-up
                  <span aria-hidden="true" className="text-[10px]">
                    →
                  </span>
                </a>
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
    <section className="my-8" aria-label="Live demo">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-surface">
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
