/** A watcher's entire configuration. Lives in code — there is no config UI. */
export interface WatcherConfig {
  id: string
  source: "ashby"
  /** Board slug in the source's URL, e.g. "featherlessai". */
  board: string
  /** Lowercase city substrings matched against the location blob. */
  cities: string[]
  includeRemote: boolean
  /**
   * Case-insensitive substrings checked against title + location blob. Any hit
   * vetoes the match outright, whatever else fired.
   */
  exclude: string[]
}

/**
 * A job posting flattened to the fields matching needs, so `match.ts` never has
 * to know which board a job came from.
 */
export interface NormalizedJob {
  /** Stable identity across retitles. The Ashby job URL ends in a UUID. */
  externalKey: string
  title: string
  location: string
  url: string
  isListed: boolean
  /** The source's explicit remote flag, if it set one. */
  isRemote: boolean
  /** True when the source typed the role as fully remote. */
  isRemoteWorkplace: boolean
  /** Every location-ish string the source gave us, lowercased and joined. */
  locationBlob: string
  payload: Record<string, unknown>
}

/** A job that passed matching, ready to be persisted. */
export interface Sighting {
  externalKey: string
  title: string
  location: string
  url: string
  matchedReasons: string[]
  payload: Record<string, unknown>
}

/** A sighting as it comes back out of the database. */
export interface StoredSighting extends Sighting {
  id: number
  watcher: string
  firstSeen: string
  lastSeen: string
  notifiedAt: string | null
}

export interface WatcherRunResult {
  watcher: string
  ok: boolean
  /** Sightings seen for the first time this run. */
  newCount: number
  matchedCount: number
  /** Every posting the board returned, matched or not. */
  totalCount: number
  /** True when this run seeded history instead of alerting. */
  baseline: boolean
  /** How many sightings were actually announced. */
  notifiedCount: number
  error: string | null
}

export interface WatcherRunRow {
  id: number
  watcher: string
  ranAt: string
  ok: boolean
  newCount: number
  matchedCount: number
  totalCount: number
  error: string | null
}

/** The persistence seam. `run.ts` talks to this, never to Neon directly. */
export interface WatcherStore {
  listKnownKeys(watcher: string): Promise<string[]>
  hasSuccessfulRun(watcher: string): Promise<boolean>
  upsertSightings(watcher: string, sightings: Sighting[], markNotified: boolean): Promise<void>
  listUnnotified(watcher: string): Promise<StoredSighting[]>
  markNotified(ids: number[]): Promise<void>
  recordRun(result: WatcherRunResult): Promise<void>
}
