import { fetchAshbyJobs } from "./ashby"
import { WATCHERS } from "./config"
import { neonWatcherStore } from "./db"
import { diffSightings, matchJobs } from "./match"
import { formatBaselineMessage, formatSightingsMessage, sendMessage } from "./telegram"
import type { NormalizedJob, WatcherConfig, WatcherRunResult, WatcherStore } from "./types"

export interface WatcherDeps {
  fetchJobs: (config: WatcherConfig) => Promise<NormalizedJob[]>
  store: WatcherStore
  notify: (text: string) => Promise<void>
}

export const defaultWatcherDeps: WatcherDeps = {
  fetchJobs: (config) => {
    if (config.source === "ashby") return fetchAshbyJobs(config)
    throw new Error(`Unknown watcher source "${config.source}"`)
  },
  store: neonWatcherStore,
  notify: sendMessage,
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * One watcher execution.
 *
 * The alert ledger is `notified_at`, not this function's control flow: pending
 * rows are re-read from the store rather than carried over from the diff, so a
 * send that failed on a previous run is retried here automatically. Nothing is
 * stamped as notified until the send resolves.
 *
 * A `watcher_runs` row is written on every path, including a failed fetch —
 * that row is the only evidence the cron is still alive.
 */
export async function runWatcher(
  config: WatcherConfig,
  deps: WatcherDeps = defaultWatcherDeps
): Promise<WatcherRunResult> {
  const result: WatcherRunResult = {
    watcher: config.id,
    ok: false,
    newCount: 0,
    matchedCount: 0,
    totalCount: 0,
    baseline: false,
    notifiedCount: 0,
    error: null,
  }

  try {
    const jobs = await deps.fetchJobs(config)
    result.totalCount = jobs.length

    const sightings = matchJobs(jobs, config)
    result.matchedCount = sightings.length

    const [knownKeys, hadSuccessfulRun] = await Promise.all([
      deps.store.listKnownKeys(config.id),
      deps.store.hasSuccessfulRun(config.id),
    ])

    result.newCount = diffSightings(knownKeys, sightings).fresh.length

    // Both conditions matter. Checking prior sightings alone would re-baseline
    // after a first run that legitimately matched nothing, silently swallowing
    // the next run's finds.
    result.baseline = knownKeys.length === 0 && !hadSuccessfulRun

    // Baseline rows are stamped notified at insert: they are history, not
    // alerts. If the one-line summary below fails, the run is marked not-ok but
    // the board is not replayed as fifteen "new" roles on the next run.
    await deps.store.upsertSightings(config.id, sightings, result.baseline)

    if (result.baseline) {
      await deps.notify(formatBaselineMessage(config.id, sightings.length))
      result.ok = true
      return result
    }

    const pending = await deps.store.listUnnotified(config.id)
    if (pending.length === 0) {
      result.ok = true
      return result
    }

    await deps.notify(formatSightingsMessage(config.id, pending))
    await deps.store.markNotified(pending.map((sighting) => sighting.id))

    result.notifiedCount = pending.length
    result.ok = true
    return result
  } catch (error) {
    result.ok = false
    result.error = errorMessage(error)
    return result
  } finally {
    try {
      await deps.store.recordRun(result)
    } catch (error) {
      // A watcher that worked should not report failure because the bookkeeping
      // write failed. Surfacing it in logs is the most this can do.
      console.error(`[watchers] failed to record run for ${config.id}:`, errorMessage(error))
    }
  }
}

export async function runAllWatchers(deps: WatcherDeps = defaultWatcherDeps): Promise<WatcherRunResult[]> {
  const results: WatcherRunResult[] = []
  // Sequential: one shared Telegram chat and a handful of watchers. Ordered
  // messages are worth more here than concurrency.
  for (const config of WATCHERS) {
    results.push(await runWatcher(config, deps))
  }
  return results
}
