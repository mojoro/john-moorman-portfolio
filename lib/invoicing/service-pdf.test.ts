import assert from "node:assert/strict"
import { after, before, describe, it, mock } from "node:test"
import { rmSync } from "node:fs"
import { join } from "node:path"

// Only the database is faked; PDFs go through blob.ts's real local storage.
const invoiceNo = `TEST-PDF-${process.pid}`
const invoices = new Map<number, { invoice_no: string; pdf_blob_path: string }>()

mock.module(require.resolve("./db"), {
  namedExports: {
    getInvoice: async (id: number) => invoices.get(id) ?? null,
  },
})

let service: typeof import("./service")

before(async () => {
  delete process.env.BLOB_READ_WRITE_TOKEN
  delete process.env.VERCEL_OIDC_TOKEN
  delete process.env.VERCEL
  service = await import("./service")
  const { uploadInvoicePdf } = await import("./blob")
  const stored = await uploadInvoicePdf({ invoiceNo, buffer: Buffer.from("%PDF-invoice") })
  invoices.set(1, { invoice_no: invoiceNo, pdf_blob_path: stored.pathname })
  invoices.set(2, { invoice_no: "TEST-GONE-260901-1", pdf_blob_path: "local/invoices/TEST-GONE-260901-1.pdf" })
})

after(() => {
  rmSync(join(process.cwd(), ".invoices", `${invoiceNo}.pdf`), { force: true })
})

describe("invoice PDF download", () => {
  it("returns the stored PDF with a filename built from the invoice number", async () => {
    const result = await service.getInvoicePdf(1)

    assert.equal(result?.filename, `${invoiceNo}.pdf`)
    assert.equal(result?.pdf.toString(), "%PDF-invoice")
  })

  it("returns null for an unknown invoice", async () => {
    assert.equal(await service.getInvoicePdf(99), null)
  })

  it("returns null when the invoice exists but its PDF is gone", async () => {
    assert.equal(await service.getInvoicePdf(2), null)
  })
})
