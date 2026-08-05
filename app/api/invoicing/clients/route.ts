import { authorizeInvoiceApi } from "@/lib/invoicing/api-auth"
import { jsonError, jsonOk, readJsonBody } from "@/lib/invoicing/api-response"
import { listClients, saveClient } from "@/lib/invoicing/service"

export async function GET(request: Request) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    return jsonOk({ clients: await listClients() })
  } catch (error) {
    return jsonError(error)
  }
}

/** Creates a client, or updates one when `id` is supplied. */
export async function POST(request: Request) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    const client = await saveClient(await readJsonBody(request))
    return jsonOk({ client }, 201)
  } catch (error) {
    return jsonError(error)
  }
}
