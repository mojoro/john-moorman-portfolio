import { authorizeInvoiceApi } from "@/lib/invoicing/api-auth"
import { jsonError, jsonOk } from "@/lib/invoicing/api-response"
import { removeTimesheetEntry } from "@/lib/invoicing/service"
import { requirePositiveInt } from "@/lib/invoicing/validate"

/**
 * Deletes an uninvoiced entry. An entry already attached to an invoice is a 400
 * rather than a silent no-op: delete the invoice first, which releases its
 * entries, then delete the entry.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    const { id } = await params
    await removeTimesheetEntry(requirePositiveInt(id, "id"))
    return jsonOk({ deleted: true })
  } catch (error) {
    return jsonError(error)
  }
}
