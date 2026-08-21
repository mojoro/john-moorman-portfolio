import { neon } from "@neondatabase/serverless"
import type { Sighting, StoredSighting, WatcherRunResult, WatcherRunRow, WatcherStore } from "./types"

// neon() returns a tagged-template SQL client over HTTP, matching lib/db.ts and
// lib/invoicing/db.ts. Nothing here opens a raw socket.
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }
  return neon(process.env.DATABASE_URL)
}

/** Postgres caps a statement at 65535 parameters; this stays far under it. */
const UPSERT_BATCH_SIZE = 200

interface SightingRow {
  id: number
  watcher: string
  external_key: string
  title: string
  location: string
  url: string
  matched_reasons: string[] | null
  payload: Record<string, unknown> | null
  first_seen: string | Date
  last_seen: string | Date
  notified_at: string | Date | null
}

function normalizeSighting(row: SightingRow): StoredSighting {
  return {
    id: Number(row.id),
    watcher: row.watcher,
    externalKey: row.external_key,
    title: row.title,
    location: row.location,
    url: row.url,
    matchedReasons: row.matched_reasons ?? [],
    payload: row.payload ?? {},
    firstSeen: String(row.first_seen),
    lastSeen: String(row.last_seen),
    notifiedAt: row.notified_at === null ? null : String(row.notified_at),
  }
}

const SIGHTING_COLUMNS = `id, watcher, external_key, title, location, url,
  matched_reasons, payload, first_seen, last_seen, notified_at`

export async function listKnownKeys(watcher: string): Promise<string[]> {
  const sql = getDb()
  const rows = await sql`SELECT external_key FROM watcher_sightings WHERE watcher = ${watcher}`
  return (rows as { external_key: string }[]).map((row) => row.external_key)
}

export async function hasSuccessfulRun(watcher: string): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`SELECT 1 FROM watcher_runs WHERE watcher = ${watcher} AND ok LIMIT 1`
  return rows.length > 0
}

/**
 * Inserts unseen sightings and refreshes `last_seen` on the rest.
 *
 * `notified_at` is deliberately absent from the DO UPDATE list. Re-seeing a job
 * must never reopen an alert that was already sent, and must never close one
 * that is still owed.
 */
export async function upsertSightings(
  watcher: string,
  sightings: Sighting[],
  markNotified: boolean
): Promise<void> {
  if (sightings.length === 0) return
  const sql = getDb()

  for (let offset = 0; offset < sightings.length; offset += UPSERT_BATCH_SIZE) {
    const batch = sightings.slice(offset, offset + UPSERT_BATCH_SIZE)
    const params: unknown[] = []
    const placeholders = batch.map((sighting) => {
      const base = params.length
      params.push(
        watcher,
        sighting.externalKey,
        sighting.title,
        sighting.location,
        sighting.url,
        sighting.matchedReasons,
        JSON.stringify(sighting.payload ?? {})
      )
      return (
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, ` +
        `$${base + 6}::text[], $${base + 7}::jsonb, ${markNotified ? "NOW()" : "NULL"})`
      )
    })

    await sql.query(
      `
        INSERT INTO watcher_sightings
          (watcher, external_key, title, location, url, matched_reasons, payload, notified_at)
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (watcher, external_key) DO UPDATE SET
          title           = EXCLUDED.title,
          location        = EXCLUDED.location,
          url             = EXCLUDED.url,
          matched_reasons = EXCLUDED.matched_reasons,
          payload         = EXCLUDED.payload,
          last_seen       = NOW()
      `,
      params
    )
  }
}

export async function listUnnotified(watcher: string): Promise<StoredSighting[]> {
  const sql = getDb()
  const rows = await sql.query(
    `SELECT ${SIGHTING_COLUMNS} FROM watcher_sightings
     WHERE watcher = $1 AND notified_at IS NULL
     ORDER BY first_seen ASC, id ASC`,
    [watcher]
  )
  return (rows as SightingRow[]).map(normalizeSighting)
}

export async function markNotified(ids: number[]): Promise<void> {
  if (ids.length === 0) return
  const sql = getDb()
  await sql.query(`UPDATE watcher_sightings SET notified_at = NOW() WHERE id = ANY($1::int[])`, [ids])
}

export async function recordRun(result: WatcherRunResult): Promise<void> {
  const sql = getDb()
  await sql`
    INSERT INTO watcher_runs (watcher, ok, new_count, matched_count, total_count, error)
    VALUES (
      ${result.watcher},
      ${result.ok},
      ${result.newCount},
      ${result.matchedCount},
      ${result.totalCount},
      ${result.error}
    )
  `
}

/** The Neon-backed store handed to `runWatcher` in production. */
export const neonWatcherStore: WatcherStore = {
  listKnownKeys,
  hasSuccessfulRun,
  upsertSightings,
  listUnnotified,
  markNotified,
  recordRun,
}

// ── Admin read models ──

interface RunRow {
  id: number
  watcher: string
  ran_at: string | Date
  ok: boolean
  new_count: number
  matched_count: number
  total_count: number
  error: string | null
}

function normalizeRun(row: RunRow): WatcherRunRow {
  return {
    id: Number(row.id),
    watcher: row.watcher,
    ranAt: String(row.ran_at),
    ok: row.ok,
    newCount: Number(row.new_count),
    matchedCount: Number(row.matched_count),
    totalCount: Number(row.total_count),
    error: row.error,
  }
}

export interface WatcherOverview {
  watcher: string
  /** Configured in `WATCHERS`, as opposed to arriving only via the ingest API. */
  configured: boolean
  lastRun: WatcherRunRow | null
  lastSuccessfulRun: WatcherRunRow | null
  sightingCount: number
  pendingCount: number
}

/**
 * Every watcher id that has any history, whether or not it is in `WATCHERS`.
 * An ingest-only watcher (the external flight scanner) has no config entry but
 * still needs to show up on the dashboard.
 */
export async function listWatcherIds(): Promise<string[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql`
    SELECT watcher FROM watcher_runs
    UNION
    SELECT watcher FROM watcher_sightings
    ORDER BY watcher ASC
  `
  return (rows as { watcher: string }[]).map((row) => row.watcher)
}

export async function getWatcherOverviews(configuredIds: readonly string[]): Promise<WatcherOverview[]> {
  if (!process.env.DATABASE_URL) {
    return configuredIds.map((watcher) => ({
      watcher,
      configured: true,
      lastRun: null,
      lastSuccessfulRun: null,
      sightingCount: 0,
      pendingCount: 0,
    }))
  }

  const sql = getDb()
  const configured = new Set(configuredIds)
  const ids = Array.from(new Set([...configuredIds, ...(await listWatcherIds())]))
  if (ids.length === 0) return []

  // DISTINCT ON gives the newest run per watcher in one pass; the second query
  // does the same restricted to successful runs, which is what staleness is
  // measured against.
  const [lastRuns, lastOkRuns, counts] = await Promise.all([
    sql.query(
      `SELECT DISTINCT ON (watcher) id, watcher, ran_at, ok, new_count, matched_count, total_count, error
       FROM watcher_runs WHERE watcher = ANY($1::text[])
       ORDER BY watcher, ran_at DESC, id DESC`,
      [ids]
    ),
    sql.query(
      `SELECT DISTINCT ON (watcher) id, watcher, ran_at, ok, new_count, matched_count, total_count, error
       FROM watcher_runs WHERE watcher = ANY($1::text[]) AND ok
       ORDER BY watcher, ran_at DESC, id DESC`,
      [ids]
    ),
    sql.query(
      `SELECT watcher,
              COUNT(*)::int AS sighting_count,
              COUNT(*) FILTER (WHERE notified_at IS NULL)::int AS pending_count
       FROM watcher_sightings WHERE watcher = ANY($1::text[])
       GROUP BY watcher`,
      [ids]
    ),
  ])

  const lastByWatcher = new Map((lastRuns as RunRow[]).map((row) => [row.watcher, normalizeRun(row)]))
  const lastOkByWatcher = new Map((lastOkRuns as RunRow[]).map((row) => [row.watcher, normalizeRun(row)]))
  const countsByWatcher = new Map(
    (counts as { watcher: string; sighting_count: number; pending_count: number }[]).map((row) => [
      row.watcher,
      { sightings: Number(row.sighting_count), pending: Number(row.pending_count) },
    ])
  )

  return ids
    .map((watcher) => ({
      watcher,
      configured: configured.has(watcher),
      lastRun: lastByWatcher.get(watcher) ?? null,
      lastSuccessfulRun: lastOkByWatcher.get(watcher) ?? null,
      sightingCount: countsByWatcher.get(watcher)?.sightings ?? 0,
      pendingCount: countsByWatcher.get(watcher)?.pending ?? 0,
    }))
    .sort((a, b) => Number(b.configured) - Number(a.configured) || a.watcher.localeCompare(b.watcher))
}

export async function getRecentSightings(limit: number): Promise<StoredSighting[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql.query(
    `SELECT ${SIGHTING_COLUMNS} FROM watcher_sightings ORDER BY first_seen DESC, id DESC LIMIT $1`,
    [limit]
  )
  return (rows as SightingRow[]).map(normalizeSighting)
}

export async function getRecentRuns(limit: number): Promise<WatcherRunRow[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql.query(
    `SELECT id, watcher, ran_at, ok, new_count, matched_count, total_count, error
     FROM watcher_runs ORDER BY ran_at DESC, id DESC LIMIT $1`,
    [limit]
  )
  return (rows as RunRow[]).map(normalizeRun)
}
