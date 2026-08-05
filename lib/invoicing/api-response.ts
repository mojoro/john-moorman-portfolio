import { NextResponse } from "next/server"
import { ValidationError } from "./validate"

export function jsonOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } })
}

/**
 * Callers are already authenticated with the API token, so the underlying
 * message is surfaced rather than swallowed. Input problems are 400 so a script
 * can tell "I sent something wrong" from "the server broke".
 */
export function jsonError(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  const message = error instanceof Error ? error.message : "Request failed."
  return NextResponse.json({ error: message }, { status: 500 })
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new ValidationError("Request body must be valid JSON")
  }
}
