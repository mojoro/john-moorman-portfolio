import { RunWatcherButton } from "./run-watcher-button"
import { requireAdminPage } from "@/lib/admin/require-admin-page"
import { WATCHERS } from "@/lib/watchers/config"
import { getRecentSightings, getWatcherOverviews, type WatcherOverview } from "@/lib/watchers/db"

export const runtime = "nodejs"

/**
 * A cron that stops firing produces no error anywhere — it just goes quiet. The
 * daily schedule plus a missed run or two puts the threshold here; anything
 * tighter would cry wolf over Hobby-plan cron drift.
 */
const STALE_AFTER_HOURS = 36
const RECENT_SIGHTING_LIMIT = 40

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000
}

function formatAge(iso: string): string {
  const hours = hoursSince(iso)
  if (!Number.isFinite(hours)) return "unknown"
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`
  if (hours < 48) return `${Math.round(hours)}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function formatStamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

interface Staleness {
  stale: boolean
  message: string | null
}

function staleness(overview: WatcherOverview): Staleness {
  if (!overview.lastSuccessfulRun) {
    return { stale: true, message: "No successful run on record. The cron has never completed." }
  }
  const age = hoursSince(overview.lastSuccessfulRun.ranAt)
  if (age > STALE_AFTER_HOURS) {
    return {
      stale: true,
      message: `Last successful run was ${formatAge(overview.lastSuccessfulRun.ranAt)} — over the ${STALE_AFTER_HOURS}h threshold. The cron may be dead.`,
    }
  }
  return { stale: false, message: null }
}

export default async function WatchersPage() {
  await requireAdminPage()

  const configuredIds = WATCHERS.map((watcher) => watcher.id)
  const [overviews, sightings] = await Promise.all([
    getWatcherOverviews(configuredIds),
    getRecentSightings(RECENT_SIGHTING_LIMIT),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Watchers</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Job-board polling. Runs daily at 08:00 UTC and alerts over Telegram. Read-only: watcher
          configuration lives in <code className="font-mono text-xs text-text-muted">lib/watchers/config.ts</code>.
        </p>
      </div>

      {overviews.length === 0 ? (
        <p className="font-mono text-xs text-text-muted">No watchers configured.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {overviews.map((overview) => {
            const { stale, message } = staleness(overview)
            const lastRun = overview.lastRun

            return (
              <div
                key={overview.watcher}
                className={`rounded-lg border bg-bg-surface p-5 ${stale ? "border-warning/40" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-text-primary">{overview.watcher}</h2>
                    <p className="mt-0.5 font-mono text-xs text-text-muted">
                      {overview.configured ? "configured" : "ingest only"}
                    </p>
                  </div>
                  {overview.configured && <RunWatcherButton watcherId={overview.watcher} />}
                </div>

                {stale && message && (
                  <p className="mt-4 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 font-mono text-xs text-warning">
                    ⚠ {message}
                  </p>
                )}

                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
                  <div>
                    <dt className="font-mono text-xs text-text-muted">Sightings</dt>
                    <dd className="mt-0.5 font-mono text-sm text-text-primary">{overview.sightingCount}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs text-text-muted">Un-alerted</dt>
                    <dd
                      className={`mt-0.5 font-mono text-sm ${overview.pendingCount > 0 ? "text-warning" : "text-text-primary"}`}
                    >
                      {overview.pendingCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs text-text-muted">Last run</dt>
                    <dd className="mt-0.5 font-mono text-sm text-text-primary">
                      {lastRun ? formatAge(lastRun.ranAt) : "never"}
                    </dd>
                  </div>
                </dl>

                {lastRun && (
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs">
                      <span className={lastRun.ok ? "text-accent" : "text-danger"}>
                        {lastRun.ok ? "● ok" : "● failed"}
                      </span>
                      <span className="text-border">·</span>
                      <span className="text-text-muted">{formatStamp(lastRun.ranAt)}</span>
                      <span className="text-border">·</span>
                      <span className="text-text-secondary">
                        {lastRun.newCount} new / {lastRun.matchedCount} matched / {lastRun.totalCount} listed
                      </span>
                    </div>
                    {lastRun.error && (
                      <p className="mt-2 rounded-md border border-danger/25 bg-danger/10 px-3 py-2 font-mono text-xs break-words text-danger">
                        {lastRun.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-text-primary">
          Recent sightings{" "}
          <span className="font-mono text-sm font-normal text-text-muted">({sightings.length})</span>
        </h2>

        <div className="overflow-x-auto rounded-lg border border-border bg-bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-elevated/40 font-mono text-xs text-text-muted">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Watcher</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Matched</th>
                <th className="px-4 py-3">First seen</th>
                <th className="px-4 py-3">Alerted</th>
              </tr>
            </thead>
            <tbody>
              {sightings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-mono text-xs text-text-muted">
                    Nothing recorded yet. The first run only writes a baseline.
                  </td>
                </tr>
              ) : (
                sightings.map((sighting) => (
                  <tr key={sighting.id} className="border-t border-border transition-colors hover:bg-bg-elevated/25">
                    <td className="px-4 py-3 text-text-primary">
                      {sighting.url ? (
                        <a
                          href={sighting.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent/80"
                        >
                          {sighting.title} ↗
                        </a>
                      ) : (
                        sighting.title
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{sighting.watcher}</td>
                    <td className="px-4 py-3 text-text-secondary">{sighting.location || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sighting.matchedReasons.length === 0 ? (
                          <span className="font-mono text-xs text-text-muted">—</span>
                        ) : (
                          sighting.matchedReasons.map((reason) => (
                            <span
                              key={reason}
                              className="rounded-full bg-bg-elevated px-2 py-0.5 font-mono text-[10px] text-text-secondary"
                            >
                              {reason}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-text-muted">
                      {formatAge(sighting.firstSeen)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {sighting.notifiedAt ? (
                        <span className="text-text-muted">{formatAge(sighting.notifiedAt)}</span>
                      ) : (
                        <span className="text-warning">pending</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
