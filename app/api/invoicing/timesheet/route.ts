import { authorizeInvoiceApi } from "@/lib/invoicing/api-auth"
import { jsonError, jsonOk, readJsonBody } from "@/lib/invoicing/api-response"
import { getTimesheetEntries } from "@/lib/invoicing/db"
import { createTimesheetEntries, createTimesheetEntry } from "@/lib/invoicing/service"
import { requirePositiveInt } from "@/lib/invoicing/validate"

/** Uninvoiced entries by default; pass ?includeInvoiced=true for the full log. */
export async function GET(request: Request) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    const params = new URL(request.url).searchParams
    const clientIdParam = params.get("clientId")
    const entries = await getTimesheetEntries({
      clientId: clientIdParam ? requirePositiveInt(clientIdParam, "clientId") : undefined,
      includeInvoiced: params.get("includeInvoiced") === "true",
    })
    return jsonOk({ entries })
  } catch (error) {
    return jsonError(error)
  }
}

/** Accepts a single entry, or `{ clientId, entries: [...] }` for a batch. */
export async function POST(request: Request) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    const body = await readJsonBody(request)
    if (body && typeof body === "object" && Array.isArray((body as { entries?: unknown }).entries)) {
      return jsonOk(await createTimesheetEntries(body), 201)
    }
    return jsonOk({ entry: await createTimesheetEntry(body) }, 201)
  } catch (error) {
    return jsonError(error)
  }
}
