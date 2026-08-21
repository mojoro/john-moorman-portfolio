import type { Sighting, WatcherRunResult } from "./types"

/** Thrown for caller-supplied input problems. Routes map this to 400, not 500. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

/**
 * Ingest payloads come from an external bot, so every bound here is deliberate:
 * an authenticated caller is still not a trusted one, and these rows are read
 * straight back out onto an admin page.
 */
const LIMITS = {
  watcherId: 64,
  sightings: 500,
  externalKey: 512,
  title: 300,
  location: 300,
  url: 2048,
  reasons: 20,
  reason: 64,
  payloadJson: 8000,
  error: 2000,
  count: 1_000_000,
} as const

const WATCHER_ID = /^[a-z0-9][a-z0-9_-]*$/i

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function requireString(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`)
  const text = value.trim()
  if (!text) throw new ValidationError(`${field} is required`)
  if (text.length > max) throw new ValidationError(`${field} must be at most ${max} characters`)
  return text
}

function optionalString(value: unknown, field: string, max: number): string {
  if (value === undefined || value === null) return ""
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`)
  const text = value.trim()
  if (text.length > max) throw new ValidationError(`${field} must be at most ${max} characters`)
  return text
}

/**
 * Only http(s). The admin page renders these as anchors, and a `javascript:` or
 * `data:` URL arriving through the ingest API must not become a link there.
 */
function optionalUrl(value: unknown, field: string): string {
  const text = optionalString(value, field, LIMITS.url)
  if (!text) return ""
  let parsed: URL
  try {
    parsed = new URL(text)
  } catch {
    throw new ValidationError(`${field} must be an absolute http(s) URL`)
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ValidationError(`${field} must be an absolute http(s) URL`)
  }
  return text
}

function optionalCount(value: unknown, field: string): number {
  if (value === undefined || value === null) return 0
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > LIMITS.count) {
    throw new ValidationError(`${field} must be an integer between 0 and ${LIMITS.count}`)
  }
  return parsed
}

export function parseWatcherId(value: unknown, field = "watcher"): string {
  const id = requireString(value, field, LIMITS.watcherId)
  if (!WATCHER_ID.test(id)) {
    throw new ValidationError(`${field} may only contain letters, numbers, underscores, and hyphens`)
  }
  return id
}

function parseReasons(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new ValidationError("matchedReasons must be an array of strings")
  if (value.length > LIMITS.reasons) {
    throw new ValidationError(`matchedReasons must contain at most ${LIMITS.reasons} entries`)
  }
  return value.map((entry) => requireString(entry, "matchedReasons[]", LIMITS.reason))
}

function parsePayload(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {}
  if (!isPlainObject(value)) throw new ValidationError("payload must be a JSON object")

  let json: string
  try {
    json = JSON.stringify(value)
  } catch {
    throw new ValidationError("payload must be JSON-serializable")
  }
  if (json.length > LIMITS.payloadJson) {
    throw new ValidationError(`payload must serialize to at most ${LIMITS.payloadJson} characters`)
  }
  return value
}

export function parseSighting(value: unknown): Sighting {
  if (!isPlainObject(value)) throw new ValidationError("each sighting must be an object")
  return {
    externalKey: requireString(value.externalKey, "externalKey", LIMITS.externalKey),
    title: requireString(value.title, "title", LIMITS.title),
    location: optionalString(value.location, "location", LIMITS.location),
    url: optionalUrl(value.url, "url"),
    matchedReasons: parseReasons(value.matchedReasons),
    payload: parsePayload(value.payload),
  }
}

export interface IngestPayload {
  watcher: string
  sightings: Sighting[]
  run: WatcherRunResult
}

export function parseIngestPayload(body: unknown): IngestPayload {
  if (!isPlainObject(body)) throw new ValidationError("Request body must be a JSON object")

  const watcher = parseWatcherId(body.watcher)

  const rawSightings = body.sightings ?? []
  if (!Array.isArray(rawSightings)) throw new ValidationError("sightings must be an array")
  if (rawSightings.length > LIMITS.sightings) {
    throw new ValidationError(`sightings must contain at most ${LIMITS.sightings} entries`)
  }

  const sightings = rawSightings.map(parseSighting)
  const keys = new Set(sightings.map((sighting) => sighting.externalKey))
  // A repeated key would make the upsert hit the same conflict target twice in
  // one statement, which Postgres rejects outright.
  if (keys.size !== sightings.length) {
    throw new ValidationError("sightings must not contain duplicate externalKey values")
  }

  const rawRun = body.run ?? {}
  if (!isPlainObject(rawRun)) throw new ValidationError("run must be an object")
  if (rawRun.ok !== undefined && typeof rawRun.ok !== "boolean") {
    throw new ValidationError("run.ok must be a boolean")
  }

  const error = optionalString(rawRun.error, "run.error", LIMITS.error)

  return {
    watcher,
    sightings,
    run: {
      watcher,
      ok: rawRun.ok !== undefined ? rawRun.ok : true,
      newCount: optionalCount(rawRun.newCount, "run.newCount"),
      matchedCount:
        rawRun.matchedCount === undefined ? sightings.length : optionalCount(rawRun.matchedCount, "run.matchedCount"),
      totalCount: optionalCount(rawRun.totalCount, "run.totalCount"),
      baseline: false,
      notifiedCount: 0,
      error: error || null,
    },
  }
}
