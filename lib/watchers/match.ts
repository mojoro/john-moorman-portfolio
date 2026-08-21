import type { NormalizedJob, Sighting, WatcherConfig } from "./types"

/**
 * The exclude patterns veto a match. They are checked against the title as well
 * as the location blob so a pattern like "us only" catches it wherever the
 * board happened to put it.
 */
export function excludedBy(job: NormalizedJob, config: WatcherConfig): string | null {
  const haystack = `${job.title} | ${job.locationBlob}`.toLowerCase()
  for (const pattern of config.exclude) {
    const needle = pattern.trim().toLowerCase()
    if (needle && haystack.includes(needle)) return needle
  }
  return null
}

/**
 * Which rules a job satisfies, in the order they were checked. Empty means no
 * match. The reasons are stored so that a year from now it is obvious *why* a
 * role was flagged, and so the exclude list can be tuned against real data
 * rather than guesses.
 */
export function matchReasons(job: NormalizedJob, config: WatcherConfig): string[] {
  const reasons: string[] = []

  if (config.includeRemote) {
    if (job.isRemote) reasons.push("remote:flag")
    if (job.isRemoteWorkplace) reasons.push("remote:workplace")
    // The text check stands alone because the board frequently leaves both
    // structured remote fields null while writing "Remote (world)" in the
    // location. Eight of the fifteen live postings look exactly like that.
    if (!job.isRemote && !job.isRemoteWorkplace && job.locationBlob.includes("remote")) {
      reasons.push("remote:text")
    }
  }

  for (const city of config.cities) {
    const needle = city.trim().toLowerCase()
    if (needle && job.locationBlob.includes(needle)) reasons.push(`city:${needle}`)
  }

  return reasons
}

/** Null when the job does not match, or matched but was vetoed by an exclude. */
export function matchJob(job: NormalizedJob, config: WatcherConfig): Sighting | null {
  if (!job.isListed) return null

  const reasons = matchReasons(job, config)
  if (reasons.length === 0) return null
  if (excludedBy(job, config)) return null

  return {
    externalKey: job.externalKey,
    title: job.title,
    location: job.location,
    url: job.url,
    matchedReasons: reasons,
    payload: job.payload,
  }
}

export function matchJobs(jobs: NormalizedJob[], config: WatcherConfig): Sighting[] {
  const sightings: Sighting[] = []
  const seen = new Set<string>()

  for (const job of jobs) {
    const sighting = matchJob(job, config)
    // A board that repeats an external key would otherwise blow up the
    // multi-row upsert, which cannot hit the same conflict target twice.
    if (!sighting || seen.has(sighting.externalKey)) continue
    seen.add(sighting.externalKey)
    sightings.push(sighting)
  }

  return sightings
}

/** Splits this run's matches against what the watcher has already recorded. */
export function diffSightings(
  knownKeys: Iterable<string>,
  sightings: Sighting[]
): { fresh: Sighting[]; known: Sighting[] } {
  const seen = new Set(knownKeys)
  const fresh: Sighting[] = []
  const known: Sighting[] = []

  for (const sighting of sightings) {
    if (seen.has(sighting.externalKey)) known.push(sighting)
    else fresh.push(sighting)
  }

  return { fresh, known }
}
