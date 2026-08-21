import crypto from "node:crypto"
import { checkWatcherApiRateLimit } from "@/lib/ratelimit"

const MIN_TOKEN_LENGTH = 32

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (!header) return null
  const match = header.trim().match(/^Bearer[ ]+(.+)$/i)
  return match ? match[1].trim() : null
}

/** Compares digests so neither the token's length nor its prefix leaks via timing. */
export function tokenMatches(provided: string, expected: string): boolean {
  const providedDigest = crypto.createHash("sha256").update(provided).digest()
  const expectedDigest = crypto.createHash("sha256").update(expected).digest()
  return crypto.timingSafeEqual(providedDigest, expectedDigest)
}

function configuredToken(name: string): string | null {
  const token = process.env[name]
  if (!token || token.length < MIN_TOKEN_LENGTH) return null
  return token
}

export type AuthFailure = { response: Response }

/**
 * Mirrors the invoicing API's bearer pattern: with no WATCHER_INGEST_TOKEN
 * configured the route behaves as if it does not exist, and a token under 32
 * characters counts as unconfigured rather than trusted.
 *
 * Returns null when the caller is authorized, otherwise the response to return.
 * Callers must `if (denied) return denied.response` before touching any data.
 */
export async function authorizeIngestApi(request: Request): Promise<AuthFailure | null> {
  const expected = configuredToken("WATCHER_INGEST_TOKEN")
  if (!expected) {
    return { response: Response.json({ error: "Not found" }, { status: 404 }) }
  }

  const rate = await checkWatcherApiRateLimit(clientIp(request))
  if (!rate.allowed) {
    return { response: Response.json({ error: "Too many requests" }, { status: 429 }) }
  }

  const provided = bearerToken(request)
  if (!provided || !tokenMatches(provided, expected)) {
    return {
      response: Response.json({ error: "Unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } }),
    }
  }

  return null
}

/**
 * The cron route is invoked by Vercel, which sends `Authorization: Bearer
 * $CRON_SECRET`. An unset secret rejects everything rather than opening the
 * route up.
 */
export function authorizeCron(request: Request): AuthFailure | null {
  const expected = process.env.CRON_SECRET
  const provided = bearerToken(request)
  if (!expected || !provided || !tokenMatches(provided, expected)) {
    return {
      response: Response.json({ error: "Unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } }),
    }
  }
  return null
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}
