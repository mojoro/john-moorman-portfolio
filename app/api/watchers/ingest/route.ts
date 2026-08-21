import { authorizeIngestApi } from "@/lib/watchers/api-auth"
import { recordRun, upsertSightings } from "@/lib/watchers/db"
import { ValidationError, parseIngestPayload } from "@/lib/watchers/validate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * External reporting endpoint: a bot that does its own scanning (the flight
 * scanner, eventually) posts its results here and they land in the same tables
 * the cron writes, so one admin page covers both.
 *
 * Sightings arrive already notified — the reporting bot owns its own alerting.
 * Writing them with `notified_at` unset would make this site's Telegram job
 * re-announce someone else's finds.
 */
export async function POST(request: Request) {
  const denied = await authorizeIngestApi(request)
  if (denied) return denied.response

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      throw new ValidationError("Request body must be valid JSON")
    }

    const { watcher, sightings, run } = parseIngestPayload(body)

    await upsertSightings(watcher, sightings, true)
    await recordRun(run)

    return Response.json(
      { watcher, accepted: sightings.length },
      { status: 201, headers: { "Cache-Control": "private, no-store" } }
    )
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : "Ingest failed."
    return Response.json({ error: message }, { status: 500 })
  }
}
