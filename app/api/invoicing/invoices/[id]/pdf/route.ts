import { NextResponse } from "next/server"
import { authorizeInvoiceApi } from "@/lib/invoicing/api-auth"
import { jsonError, jsonOk } from "@/lib/invoicing/api-response"
import { getInvoicePdf } from "@/lib/invoicing/service"
import { requirePositiveInt } from "@/lib/invoicing/validate"

/**
 * Downloads an invoice's PDF. The stored pdf_url points at the admin file
 * route, which needs a browser session, so scripts fetch through here instead.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeInvoiceApi(request)
  if (denied) return denied.response

  try {
    const { id } = await params
    const result = await getInvoicePdf(requirePositiveInt(id, "id"))
    if (!result) return jsonOk({ error: "Invoice PDF not found" }, 404)

    return new NextResponse(new Uint8Array(result.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    return jsonError(error)
  }
}
