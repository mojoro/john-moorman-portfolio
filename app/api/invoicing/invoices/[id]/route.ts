import { authorizeInvoiceApi } from "@/lib/invoicing/api-auth"
import { jsonError, jsonOk } from "@/lib/invoicing/api-response"
import { getInvoice } from "@/lib/invoicing/db"
import { removeInvoice } from "@/lib/invoicing/service"
import { requirePositiveInt } from "@/lib/invoicing/validate"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    const { id } = await params
    const invoice = await getInvoice(requirePositiveInt(id, "id"))
    if (!invoice) return jsonOk({ error: "Invoice not found" }, 404)
    return jsonOk({ invoice })
  } catch (error) {
    return jsonError(error)
  }
}

/**
 * Deletes the invoice, releases its timesheet entries, removes the PDF, and
 * frees the invoice number so a regenerated invoice can reuse it.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    const { id } = await params
    return jsonOk(await removeInvoice(requirePositiveInt(id, "id")))
  } catch (error) {
    return jsonError(error)
  }
}
