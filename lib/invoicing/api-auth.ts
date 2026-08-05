import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { checkInvoiceApiRateLimit } from "@/lib/ratelimit"

const MIN_TOKEN_LENGTH = 32

/**
 * The invoicing API is opt-in: with no INVOICE_API_TOKEN configured the routes
 * behave as if they do not exist. A token shorter than 32 characters is treated
 * as unconfigured rather than trusted, so a weak value cannot quietly guard
 * client billing data.
 */
function configuredToken(): string | null {
  const token = process.env.INVOICE_API_TOKEN
  if (!token || token.length < MIN_TOKEN_LENGTH) return null
  return token
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (!header) return null
  const match = header.trim().match(/^Bearer[ ]+(.+)$/i)
  return match ? match[1].trim() : null
}

/** Compares digests so neither the token's length nor its prefix leaks via timing. */
function matches(provided: string, expected: string): boolean {
  const providedDigest = crypto.createHash("sha256").update(provided).digest()
  const expectedDigest = crypto.createHash("sha256").update(expected).digest()
  return crypto.timingSafeEqual(providedDigest, expectedDigest)
}

export type AuthFailure = { response: NextResponse }

/**
 * Returns null when the caller is authorized, otherwise the response to return.
 * Callers must `if (denied) return denied.response` before touching any data.
 */
export async function authorizeInvoiceApi(request: Request): Promise<AuthFailure | null> {
  const expected = configuredToken()
  if (!expected) {
    return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) }
  }

  const rate = await checkInvoiceApiRateLimit(clientIp(request))
  if (!rate.allowed) {
    return { response: NextResponse.json({ error: "Too many requests" }, { status: 429 }) }
  }

  const provided = bearerToken(request)
  if (!provided || !matches(provided, expected)) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      ),
    }
  }

  return null
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}
