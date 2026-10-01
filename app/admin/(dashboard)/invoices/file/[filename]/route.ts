import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin/auth"
import { invoicePdfPathname, readInvoicePdf, safeInvoiceFilename } from "@/lib/invoicing/blob"

// Serves invoice PDFs from local storage in development and the private Blob
// store on Vercel. They contain client billing PII, so every read goes through
// the admin session check.
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  if (!(await isAuthenticated())) {
    return new NextResponse("Not found", { status: 404 })
  }

  const { filename } = await params
  const file = await readInvoicePdf(invoicePdfPathname(filename))
  if (!file) return new NextResponse("Not found", { status: 404 })

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeInvoiceFilename(filename)}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
