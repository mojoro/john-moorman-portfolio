import assert from "node:assert/strict"
import { before, beforeEach, describe, it, mock } from "node:test"

// Exercises the Vercel Blob branch without network access. Needs node's
// --experimental-test-module-mocks flag, which the test:invoicing script passes.
const calls: { put: unknown[][]; get: unknown[][] } = { put: [], get: [] }
let storedBlob: string | null = null

// tsx compiles this repo's .ts to CommonJS, so blob.ts requires the package's
// CJS entry. Mock that exact file; the bare specifier would resolve to the ESM one.
mock.module(require.resolve("@vercel/blob"), {
  namedExports: {
    put: async (pathname: string, body: Buffer, options: unknown) => {
      calls.put.push([pathname, body, options])
      return { url: `https://store.private.blob.vercel-storage.com/${pathname}`, pathname }
    },
    get: async (pathname: string, options: unknown) => {
      calls.get.push([pathname, options])
      if (!storedBlob) return null
      return { statusCode: 200, stream: new Blob([storedBlob]).stream() }
    },
    del: async () => {},
  },
})

let blob: typeof import("./blob")

before(async () => {
  process.env.VERCEL = "1"
  blob = await import("./blob")
})

beforeEach(() => {
  calls.put = []
  calls.get = []
  storedBlob = null
})

describe("invoice PDF storage on Vercel", () => {
  it("uploads to a fixed private pathname and returns the admin-gated URL", async () => {
    const result = await blob.uploadInvoicePdf({ invoiceNo: "ACME-260901-1", buffer: Buffer.from("%PDF-test") })

    assert.equal(calls.put.length, 1)
    const [pathname, , options] = calls.put[0]
    assert.equal(pathname, "invoices/ACME-260901-1.pdf")
    assert.deepEqual(options, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    assert.equal(result.url, "/admin/invoices/file/ACME-260901-1.pdf")
    assert.equal(result.pathname, "invoices/ACME-260901-1.pdf")
  })

  it("reads a private blob uncached and returns its bytes", async () => {
    storedBlob = "%PDF-stored"

    const pdf = await blob.readInvoicePdf("invoices/ACME-260901-1.pdf")

    assert.deepEqual(calls.get, [["invoices/ACME-260901-1.pdf", { access: "private", useCache: false }]])
    assert.equal(pdf?.toString(), "%PDF-stored")
  })

  it("returns null when the blob does not exist", async () => {
    assert.equal(await blob.readInvoicePdf("invoices/MISSING-260901-1.pdf"), null)
  })

  it("maps a served filename to the blob pathname", () => {
    assert.equal(blob.invoicePdfPathname("ACME-260901-1.pdf"), "invoices/ACME-260901-1.pdf")
  })
})
