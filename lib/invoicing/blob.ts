import { del, get, put } from "@vercel/blob"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"

// These PDFs carry client billing PII, so neither store is publicly readable.
// Locally they sit outside public/; on Vercel they go to a private Blob store.
// Either way they are only served through the admin-gated route at
// /admin/invoices/file/[filename] or the bearer-gated invoicing API.
const LOCAL_INVOICE_DIR = join(process.cwd(), ".invoices")
const LOCAL_PATH_PREFIX = "local/invoices/"
const BLOB_PATH_PREFIX = "invoices/"
const ADMIN_FILE_URL_PREFIX = "/admin/invoices/file/"

function hasBlobCredentials(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_OIDC_TOKEN)
}

function shouldUseLocalStorage(): boolean {
  return !hasBlobCredentials() && process.env.VERCEL !== "1"
}

function safePdfFilename(invoiceNo: string): string {
  return `${invoiceNo.replace(/[^A-Z0-9_-]/gi, "-")}.pdf`
}

async function uploadLocalInvoicePdf(input: { invoiceNo: string; buffer: Buffer }): Promise<{ url: string; pathname: string }> {
  const filename = safePdfFilename(input.invoiceNo)
  await mkdir(LOCAL_INVOICE_DIR, { recursive: true })
  await writeFile(join(LOCAL_INVOICE_DIR, filename), input.buffer)
  return { url: `${ADMIN_FILE_URL_PREFIX}${filename}`, pathname: `${LOCAL_PATH_PREFIX}${filename}` }
}

export function safeInvoiceFilename(filename: string): string {
  return safePdfFilename(filename.replace(/\.pdf$/i, ""))
}

/** Where this environment stores the PDF served under `filename`. */
export function invoicePdfPathname(filename: string): string {
  const prefix = shouldUseLocalStorage() ? LOCAL_PATH_PREFIX : BLOB_PATH_PREFIX
  return `${prefix}${safeInvoiceFilename(filename)}`
}

async function deleteLocalInvoicePdf(pathname: string): Promise<void> {
  if (!pathname.startsWith(LOCAL_PATH_PREFIX)) return
  const filename = pathname.slice(LOCAL_PATH_PREFIX.length)
  await rm(join(LOCAL_INVOICE_DIR, safeInvoiceFilename(filename)), { force: true })
}

export async function uploadInvoicePdf(input: { invoiceNo: string; buffer: Buffer }): Promise<{ url: string; pathname: string }> {
  if (shouldUseLocalStorage()) return uploadLocalInvoicePdf(input)

  // A fixed pathname lets the admin route find the blob from the filename alone.
  // Overwriting is safe: a number is only reused once its invoice row is gone,
  // so anything still at this path is an orphan from a failed cleanup.
  const filename = safePdfFilename(input.invoiceNo)
  const result = await put(`${BLOB_PATH_PREFIX}${filename}`, input.buffer, {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  })

  return { url: `${ADMIN_FILE_URL_PREFIX}${filename}`, pathname: result.pathname }
}

/** Returns the stored PDF, or null when nothing is stored at `pathname`. */
export async function readInvoicePdf(pathname: string): Promise<Buffer | null> {
  if (pathname.startsWith(LOCAL_PATH_PREFIX)) {
    const filename = safeInvoiceFilename(pathname.slice(LOCAL_PATH_PREFIX.length))
    try {
      return await readFile(join(LOCAL_INVOICE_DIR, filename))
    } catch {
      return null
    }
  }

  // Skip the CDN copy: it can lag a regenerated invoice that reused this number.
  const result = await get(pathname, { access: "private", useCache: false })
  if (!result || result.statusCode !== 200) return null
  return Buffer.from(await new Response(result.stream).arrayBuffer())
}

export async function deleteInvoicePdf(pathname: string): Promise<void> {
  if (pathname.startsWith(LOCAL_PATH_PREFIX)) {
    await deleteLocalInvoicePdf(pathname)
    return
  }

  await del(pathname)
}
