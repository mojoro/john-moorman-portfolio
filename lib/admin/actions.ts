"use server"

import { redirect } from "next/navigation"
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  isAuthenticated,
} from "@/lib/admin/auth"

export interface ActionResult {
  success: boolean
  error?: string
  redirectTo?: string
  importedCount?: number
  skippedCount?: number
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const password = formData.get("password") as string | null
  if (!password) return { success: false, error: "Password required." }

  if (!verifyPassword(password)) {
    return { success: false, error: "Invalid password." }
  }

  const token = createSessionToken()
  await setSessionCookie(token)
  redirect("/admin")
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie()
  redirect("/admin/login")
}

async function requireAuth(): Promise<ActionResult | null> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }
  return null
}

// ── Content ──

import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"
import { revalidatePath, revalidateTag } from "next/cache"

interface SaveContentInput {
  type: "blog" | "work"
  slug: string
  frontmatter: Record<string, unknown>
  content: string
}

export async function saveContent(input: SaveContentInput): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const filePath = path.join(process.cwd(), "content", input.type, `${input.slug}.mdx`)

  try {
    const mdxContent = matter.stringify(input.content, input.frontmatter)
    await fs.writeFile(filePath, mdxContent, "utf-8")
  } catch {
    return { success: false, error: "Failed to write file. Content editing is only available in development." }
  }

  revalidatePath(`/${input.type}/${input.slug}`)
  revalidatePath(`/${input.type}`)
  revalidatePath("/")

  return { success: true }
}

interface CreateContentInput {
  type: "blog" | "work"
  slug: string
  title: string
}

export async function createContent(input: CreateContentInput): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const slug = input.slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  if (!slug) return { success: false, error: "Invalid slug." }

  const filePath = path.join(process.cwd(), "content", input.type, `${slug}.mdx`)

  try {
    await fs.access(filePath)
    return { success: false, error: `A ${input.type} post with slug "${slug}" already exists.` }
  } catch {
    // File doesn't exist, good
  }

  const today = new Date().toISOString().slice(0, 10)
  const frontmatter: Record<string, unknown> = {
    title: input.title || "Untitled",
    date: today,
    description: "",
    tags: [],
    draft: true,
  }

  try {
    const mdxContent = matter.stringify("\nYour content here.\n", frontmatter)
    await fs.writeFile(filePath, mdxContent, "utf-8")
  } catch {
    return { success: false, error: "Failed to create file. Only available in development." }
  }

  revalidatePath(`/${input.type}`)
  return { success: true }
}

// ── Comments ──

import { commentsTag, deleteComment } from "@/lib/db"

export async function deleteCommentAction(id: number): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const slug = await deleteComment(id)
  if (slug) {
    revalidateTag(commentsTag(slug))
    revalidatePath(`/blog/${slug}`)
  }
  revalidatePath("/admin/comments")
  return { success: true }
}

// ── Chats ──

import { deleteChat } from "@/lib/db"
import {
  addTimesheetEntries,
  addTimesheetEntry,
  createInvoiceForEntries,
  deleteInvoiceRecord,
  getClients,
  getSelectedTimesheetEntries,
  recordVoidedInvoiceNumber,
  reserveInvoiceSequence,
  upsertClient,
} from "@/lib/invoicing/db"
import { deleteInvoicePdf, uploadInvoicePdf } from "@/lib/invoicing/blob"
import { buildInvoiceNumber, todayIso } from "@/lib/invoicing/invoice-number"
import { parseTimesheetCsv } from "@/lib/invoicing/csv"
import { parseHoursAmount } from "@/lib/invoicing/time"
import { buildInvoiceTotals, DEFAULT_VAT_RATE } from "@/lib/invoicing/grouping"
import { renderInvoicePdfBuffer } from "@/lib/invoicing/pdf"

export async function deleteChatAction(id: string): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  await deleteChat(id)
  revalidatePath("/admin/chats")
  return { success: true }
}

// ── Invoicing ──

function parseRequiredString(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? "").trim()
  if (!value) throw new Error(`${key} is required`)
  return value
}

function parseOptionalDate(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim()
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${key} must be YYYY-MM-DD`)
  return value
}

function parsePositiveNumber(formData: FormData, key: string): number {
  const value = Number(formData.get(key))
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${key} must be a positive number`)
  return value
}

function parsePositiveHours(formData: FormData, key: string): number {
  const value = parseHoursAmount(String(formData.get(key) ?? ""))
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${key} must be a positive number or hh:mm:ss`)
  return value
}

function parsePositiveInteger(value: FormDataEntryValue | null): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("Expected a positive integer")
  return parsed
}

export async function addTimesheetEntryAction(formData: FormData): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const workDate = parseRequiredString(formData, "workDate")
    const workEndDate = parseOptionalDate(formData, "workEndDate")
    if (workEndDate && workEndDate < workDate) throw new Error("workEndDate must be on or after workDate")

    await addTimesheetEntry({
      workDate,
      workEndDate,
      hours: parsePositiveHours(formData, "hours"),
      task: parseRequiredString(formData, "task"),
      clientId: parsePositiveInteger(formData.get("clientId")),
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to add timesheet entry." }
  }

  revalidatePath("/admin/timesheet")
  return { success: true }
}

export async function importTimesheetCsvAction(formData: FormData): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const clientId = parsePositiveInteger(formData.get("clientId"))
    const file = formData.get("csvFile")
    const pastedCsv = String(formData.get("csvText") ?? "").trim()
    let csvText = pastedCsv

    if (file instanceof File && file.size > 0) {
      if (file.size > 1024 * 1024) throw new Error("CSV file must be smaller than 1 MB.")
      csvText = await file.text()
    }

    if (!csvText.trim()) throw new Error("Choose a CSV file or paste CSV text to import.")

    const parsed = parseTimesheetCsv(csvText)
    const entriesToImport = parsed.entries.filter((entry) => entry.invoiced !== true)
    if (entriesToImport.length === 0) {
      throw new Error("CSV only contains rows marked as already invoiced.")
    }

    const importedCount = await addTimesheetEntries(entriesToImport, clientId)
    const skippedCount = parsed.entries.length - entriesToImport.length

    revalidatePath("/admin/timesheet")
    return { success: true, importedCount, skippedCount }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to import timesheet CSV." }
  }
}

function parseInvoicePrefix(formData: FormData): string {
  const prefix = parseRequiredString(formData, "invoicePrefix").toUpperCase()
  if (!/^[A-Z0-9_-]+$/.test(prefix)) {
    throw new Error("invoicePrefix may only contain letters, numbers, underscores, and hyphens")
  }
  return prefix
}

export async function saveClientAction(formData: FormData): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const idValue = formData.get("id")
    await upsertClient({
      id: idValue ? parsePositiveInteger(idValue) : undefined,
      name: parseRequiredString(formData, "name"),
      invoicePrefix: parseInvoicePrefix(formData),
      billTo: parseRequiredString(formData, "billTo"),
      ustId: String(formData.get("ustId") ?? "").trim() || null,
      hourlyRateEur: parsePositiveNumber(formData, "hourlyRateEur"),
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to save client." }
  }

  revalidatePath("/admin/clients")
  revalidatePath("/admin/timesheet")
  return { success: true }
}

export async function generateInvoiceAction(formData: FormData): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const entryIds = formData
    .getAll("entryId")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)

  if (entryIds.length === 0) return { success: false, error: "Select at least one uninvoiced entry." }

  let uploadedBlob: { url: string; pathname: string } | null = null
  let reservedInvoice: { invoiceNo: string; issuedDate: string; invoicePrefix: string } | null = null

  try {
    const entries = await getSelectedTimesheetEntries(entryIds)
    if (entries.length !== entryIds.length) throw new Error("Some selected entries no longer exist.")

    const totals = buildInvoiceTotals(entries, { isKleinunternehmer: true, vatRate: DEFAULT_VAT_RATE })
    const [firstEntry] = entries
    const [client] = (await getClients()).filter((candidate) => candidate.id === firstEntry.client_id)
    if (!client) throw new Error("Client not found.")

    const issuedDate = todayIso()
    const sequence = await reserveInvoiceSequence({ issuedDate, invoicePrefix: firstEntry.invoice_prefix })
    const invoiceNo = buildInvoiceNumber(firstEntry.invoice_prefix, issuedDate, sequence)
    reservedInvoice = { invoiceNo, issuedDate, invoicePrefix: firstEntry.invoice_prefix }
    const pdfBuffer = await renderInvoicePdfBuffer({
      invoiceNo,
      issuedDate,
      client,
      periodSummary: totals.periodSummary,
      lineItems: totals.lineItems,
      subtotal: totals.subtotal,
      vat: totals.vat,
      total: totals.total,
      isKleinunternehmer: true,
    })

    uploadedBlob = await uploadInvoicePdf({ invoiceNo, buffer: pdfBuffer })
    const invoice = await createInvoiceForEntries({
      invoiceNo,
      clientId: firstEntry.client_id,
      issuedDate,
      periodSummary: totals.periodSummary,
      totalHours: totals.totalHours,
      subtotalEur: totals.subtotal,
      vatRate: DEFAULT_VAT_RATE,
      vatEur: totals.vat,
      totalEur: totals.total,
      isKleinunternehmer: true,
      pdfUrl: uploadedBlob.url,
      pdfBlobPath: uploadedBlob.pathname,
      entryIds,
      expectedClient: {
        name: client.name,
        invoicePrefix: client.invoice_prefix,
        billTo: client.bill_to,
        ustId: client.ust_id,
        hourlyRateEur: client.hourly_rate_eur,
      },
    })
    reservedInvoice = null

    revalidatePath("/admin/timesheet")
    revalidatePath("/admin/invoices")
    return { success: true, redirectTo: `/admin/invoices#invoice-${invoice.id}` }
  } catch (error) {
    if (uploadedBlob) {
      try {
        await deleteInvoicePdf(uploadedBlob.pathname)
      } catch {
        // Blob cleanup is best-effort; the original failure should remain visible.
      }
    }
    if (reservedInvoice) {
      try {
        await recordVoidedInvoiceNumber({
          ...reservedInvoice,
          reason: error instanceof Error ? error.message : "Invoice generation failed after number reservation",
        })
      } catch {
        // Voiding is best-effort; keep the original generation error for the UI.
      }
    }
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate invoice." }
  }
}

export async function deleteInvoiceAction(invoiceId: number): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const invoice = await deleteInvoiceRecord(invoiceId)
    try {
      await deleteInvoicePdf(invoice.pdf_blob_path)
    } catch {
      // The DB delete already succeeded; leave Blob cleanup as best-effort.
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete invoice." }
  }

  revalidatePath("/admin/timesheet")
  revalidatePath("/admin/invoices")
  return { success: true }
}

// ── Chatbot Prompt ──

export async function savePrompt(content: string): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const filePath = path.join(process.cwd(), "lib", "chatbot-prompt.ts")

  try {
    const fileContent = `export const SYSTEM_PROMPT = ${JSON.stringify(content)}\n`
    await fs.writeFile(filePath, fileContent, "utf-8")
  } catch {
    return { success: false, error: "Failed to write file. Prompt editing is only available in development." }
  }

  revalidatePath("/api/chat")
  return { success: true }
}

// ── Palette ──

const VAR_DECL_RE = /(--([\w-]+):\s*)([^;]+)(;)/g
const LIGHT_BLOCK_RE = /\[data-theme="light"\]\s*\{([^}]+)\}/

export interface PaletteColors {
  dark: Record<string, string>
  light: Record<string, string>
}

export async function savePalette(colors: PaletteColors): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const cssPath = path.join(process.cwd(), "app", "globals.css")

  try {
    let css = await fs.readFile(cssPath, "utf-8")

    // Single pass over each block: match any `--var: value;` declaration and
    // replace from the new map. Avoids recompiling a regex per token.
    const replaceVars = (block: string, vars: Record<string, string>) =>
      block.replace(VAR_DECL_RE, (match, prefix: string, name: string, _val: string, suffix: string) => {
        const next = vars[name]
        return next ? `${prefix}${next}${suffix}` : match
      })

    // :root block — outside any [data-theme] block. Replace dark vars there.
    css = replaceVars(css, colors.dark)

    // [data-theme="light"] block.
    const lightBlock = css.match(LIGHT_BLOCK_RE)
    if (lightBlock) {
      const updatedBlock = replaceVars(lightBlock[1], colors.light)
      css = css.replace(lightBlock[1], updatedBlock)
    }

    await fs.writeFile(cssPath, css, "utf-8")
  } catch {
    return { success: false, error: "Failed to write file. Palette editing is only available in development." }
  }

  revalidatePath("/")
  return { success: true }
}
