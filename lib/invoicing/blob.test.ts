import assert from "node:assert/strict"
import { after, describe, it } from "node:test"
import { existsSync, rmSync } from "node:fs"
import { join } from "node:path"
import { deleteInvoicePdf, uploadInvoicePdf } from "./blob"

const invoiceNo = `TEST-LOCAL-${process.pid}`
const localPath = join(process.cwd(), ".invoices", `${invoiceNo}.pdf`)

after(() => {
  rmSync(localPath, { force: true })
})

describe("invoice PDF storage", () => {
  it("falls back to private local storage in development without a Vercel Blob token", async () => {
    const originalToken = process.env.BLOB_READ_WRITE_TOKEN
    delete process.env.BLOB_READ_WRITE_TOKEN

    try {
      const result = await uploadInvoicePdf({ invoiceNo, buffer: Buffer.from("%PDF-test") })

      assert.equal(result.url, `/admin/invoices/file/${invoiceNo}.pdf`)
      assert.equal(result.pathname, `local/invoices/${invoiceNo}.pdf`)
      assert.equal(existsSync(localPath), true)

      await deleteInvoicePdf(result.pathname)
      assert.equal(existsSync(localPath), false)
    } finally {
      if (originalToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN
      else process.env.BLOB_READ_WRITE_TOKEN = originalToken
    }
  })
})
