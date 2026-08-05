import { readFile } from "node:fs/promises"
import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin/auth"
import { readLocalInvoicePath, safeInvoiceFilename } from "@/lib/invoicing/blob"

// Serves locally generated invoice PDFs. These live outside public/ because they
// contain client billing PII, so every read goes through the admin session check.
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  if (!(await isAuthenticated())) {
    return new NextResponse("Not found", { status: 404 })
  }

  const { filename } = await params

  try {
    const file = await readFile(readLocalInvoicePath(filename))
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeInvoiceFilename(filename)}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}
