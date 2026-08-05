import { authorizeInvoiceApi } from "@/lib/invoicing/api-auth"
import { jsonError, jsonOk, readJsonBody } from "@/lib/invoicing/api-response"
import { getInvoices } from "@/lib/invoicing/db"
import { generateInvoice, parseEntryIds } from "@/lib/invoicing/service"

export async function GET(request: Request) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    return jsonOk({ invoices: await getInvoices() })
  } catch (error) {
    return jsonError(error)
  }
}

/** Renders and stores an invoice for `{ entryIds: [...] }`, all from one client. */
export async function POST(request: Request) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    const entryIds = parseEntryIds(await readJsonBody(request))
    return jsonOk({ invoice: await generateInvoice(entryIds) }, 201)
  } catch (error) {
    return jsonError(error)
  }
}
