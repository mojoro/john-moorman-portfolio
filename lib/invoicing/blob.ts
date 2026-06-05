import { del, put } from "@vercel/blob"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"

const LOCAL_INVOICE_DIR = join(process.cwd(), "public", "invoices")
const LOCAL_PATH_PREFIX = "local/invoices/"

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
  return { url: `/invoices/${filename}`, pathname: `${LOCAL_PATH_PREFIX}${filename}` }
}

async function deleteLocalInvoicePdf(pathname: string): Promise<void> {
  if (!pathname.startsWith(LOCAL_PATH_PREFIX)) return
  const filename = pathname.slice(LOCAL_PATH_PREFIX.length)
  await rm(join(LOCAL_INVOICE_DIR, safePdfFilename(filename.replace(/\.pdf$/i, ""))), { force: true })
}

export async function uploadInvoicePdf(input: { invoiceNo: string; buffer: Buffer }): Promise<{ url: string; pathname: string }> {
  if (shouldUseLocalStorage()) return uploadLocalInvoicePdf(input)

  const result = await put(`invoices/${input.invoiceNo}.pdf`, input.buffer, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: true,
  })

  return { url: result.url, pathname: result.pathname }
}

export async function deleteInvoicePdf(pathname: string): Promise<void> {
  if (pathname.startsWith(LOCAL_PATH_PREFIX)) {
    await deleteLocalInvoicePdf(pathname)
    return
  }

  await del(pathname)
}
