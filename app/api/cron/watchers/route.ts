import { authorizeCron } from "@/lib/watchers/api-auth"
import { runAllWatchers } from "@/lib/watchers/run"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Invoked by the Vercel cron declared in vercel.json, which sends
 * `Authorization: Bearer $CRON_SECRET`.
 *
 * Individual watcher failures are captured into their result rather than
 * thrown, so one dead board cannot stop the others from running. The response
 * is 200 whenever the endpoint itself worked; check `ok` per watcher.
 */
export async function GET(request: Request) {
  const denied = authorizeCron(request)
  if (denied) return denied.response

  try {
    const results = await runAllWatchers()
    return Response.json(
      { ok: results.every((result) => result.ok), results },
      { headers: { "Cache-Control": "private, no-store" } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Watcher run failed."
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
