import { authorizeInvoiceApi } from "@/lib/invoicing/api-auth"
import { jsonError, jsonOk, readJsonBody } from "@/lib/invoicing/api-response"
import { getInvoices } from "@/lib/invoicing/db"
import { generateInvoice, parseEntryIds, parseGenerateOptions } from "@/lib/invoicing/service"

export async function GET(request: Request) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    return jsonOk({ invoices: await getInvoices() })
  } catch (error) {
    return jsonError(error)
  }
}

/**
 * Renders and stores an invoice for `{ entryIds: [...] }`, all from one client.
 * Takes the lowest free number for the period unless `sequence` forces one.
 */
export async function POST(request: Request) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    const body = await readJsonBody(request)
    const invoice = await generateInvoice(parseEntryIds(body), parseGenerateOptions(body))
    return jsonOk({ invoice }, 201)
  } catch (error) {
    return jsonError(error)
  }
}
