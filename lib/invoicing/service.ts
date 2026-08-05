import {
  addTimesheetEntries,
  addTimesheetEntry,
  createInvoiceForEntries,
  deleteInvoiceRecord,
  getClients,
  getSelectedTimesheetEntries,
  invoiceNumberExists,
  MAX_INVOICE_SEQUENCE,
  nextInvoiceSequence,
  recordVoidedInvoiceNumber,
  upsertClient,
} from "./db"
import { deleteInvoicePdf, uploadInvoicePdf } from "./blob"
import { buildInvoiceNumber, todayIso } from "./invoice-number"
import { parseTimesheetCsv } from "./csv"
import { buildInvoiceTotals, DEFAULT_VAT_RATE } from "./grouping"
import { renderInvoicePdfBuffer } from "./pdf"
import {
  optionalDate,
  optionalString,
  requireDate,
  requireHours,
  requireInvoicePrefix,
  requirePositiveInt,
  requirePositiveIntArray,
  requirePositiveNumber,
  requireString,
  ValidationError,
} from "./validate"
import type { Client, Invoice, TimesheetEntry } from "./types"

/**
 * Business operations shared by the admin server actions and the JSON API, so
 * validation and the invoice-generation compensation logic exist in one place.
 */

export async function listClients(): Promise<Client[]> {
  return getClients()
}

export async function saveClient(input: unknown): Promise<Client> {
  const body = asRecord(input)
  return upsertClient({
    id: body.id === undefined || body.id === null || body.id === "" ? undefined : requirePositiveInt(body.id, "id"),
    name: requireString(body.name, "name"),
    invoicePrefix: requireInvoicePrefix(body.invoicePrefix),
    billTo: requireString(body.billTo, "billTo"),
    ustId: optionalString(body.ustId),
    hourlyRateEur: requirePositiveNumber(body.hourlyRateEur, "hourlyRateEur"),
  })
}

export async function createTimesheetEntry(input: unknown): Promise<TimesheetEntry> {
  const body = asRecord(input)
  const workDate = requireDate(body.workDate, "workDate")
  const workEndDate = optionalDate(body.workEndDate, "workEndDate")
  if (workEndDate && workEndDate < workDate) {
    throw new ValidationError("workEndDate must be on or after workDate")
  }

  return addTimesheetEntry({
    workDate,
    workEndDate,
    hours: requireHours(body.hours, "hours"),
    task: requireString(body.task, "task"),
    clientId: requirePositiveInt(body.clientId, "clientId"),
  })
}

export async function createTimesheetEntries(input: unknown): Promise<{ importedCount: number }> {
  const body = asRecord(input)
  const clientId = requirePositiveInt(body.clientId, "clientId")
  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    throw new ValidationError("entries must be a non-empty array")
  }

  const entries = body.entries.map((raw, index) => {
    const entry = asRecord(raw, `entries[${index}]`)
    const workDate = requireDate(entry.workDate, `entries[${index}].workDate`)
    const workEndDate = optionalDate(entry.workEndDate, `entries[${index}].workEndDate`)
    if (workEndDate && workEndDate < workDate) {
      throw new ValidationError(`entries[${index}].workEndDate must be on or after workDate`)
    }
    return {
      workDate,
      workEndDate,
      hours: requireHours(entry.hours, `entries[${index}].hours`),
      task: requireString(entry.task, `entries[${index}].task`),
    }
  })

  return { importedCount: await addTimesheetEntries(entries, clientId) }
}

export const MAX_CSV_BYTES = 1024 * 1024

export async function importTimesheetCsv(
  csvText: string,
  clientId: number
): Promise<{ importedCount: number; skippedCount: number }> {
  if (!csvText.trim()) throw new ValidationError("CSV content is empty.")

  const parsed = parseTimesheetCsv(csvText)
  const entriesToImport = parsed.entries.filter((entry) => entry.invoiced !== true)
  if (entriesToImport.length === 0) {
    throw new ValidationError("CSV only contains rows marked as already invoiced.")
  }

  const importedCount = await addTimesheetEntries(entriesToImport, clientId)
  return { importedCount, skippedCount: parsed.entries.length - entriesToImport.length }
}

export interface GenerateInvoiceOptions {
  /** Force a specific sequence instead of taking the lowest free one. */
  sequence?: number
}

/**
 * Picks a number, renders the PDF, uploads it, then commits the DB row. If any
 * later step fails the uploaded blob is removed and the attempt is logged to
 * voided_invoice_numbers. The number itself is not consumed by a failure: it is
 * derived from the invoices table, so it stays available for the next attempt.
 */
export async function generateInvoice(
  entryIds: number[],
  options: GenerateInvoiceOptions = {}
): Promise<Invoice> {
  if (entryIds.length === 0) throw new ValidationError("Select at least one uninvoiced entry.")

  let uploadedBlob: { url: string; pathname: string } | null = null
  let reservedInvoice: { invoiceNo: string; periodStart: string; invoicePrefix: string } | null = null

  try {
    const entries = await getSelectedTimesheetEntries(entryIds)
    if (entries.length !== entryIds.length) throw new ValidationError("Some selected entries no longer exist.")

    const totals = buildInvoiceTotals(entries, { isKleinunternehmer: true, vatRate: DEFAULT_VAT_RATE })
    const [firstEntry] = entries
    const [client] = (await getClients()).filter((candidate) => candidate.id === firstEntry.client_id)
    if (!client) throw new ValidationError("Client not found.")

    const issuedDate = todayIso()
    const periodStart = entries.reduce(
      (earliest, entry) => (entry.work_date < earliest ? entry.work_date : earliest),
      firstEntry.work_date
    )
    const sequence =
      options.sequence ?? (await nextInvoiceSequence({ periodStart, invoicePrefix: firstEntry.invoice_prefix }))
    const invoiceNo = buildInvoiceNumber(firstEntry.invoice_prefix, periodStart, sequence)

    if (options.sequence !== undefined && (await invoiceNumberExists(invoiceNo))) {
      throw new ValidationError(
        `Invoice ${invoiceNo} already exists. Delete it first if you want to reuse that number.`
      )
    }
    reservedInvoice = { invoiceNo, periodStart, invoicePrefix: firstEntry.invoice_prefix }

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
    return invoice
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
        // Voiding is best-effort; keep the original generation error for the caller.
      }
    }
    throw error
  }
}

export interface RemoveInvoiceResult {
  invoice: Invoice
  /** False when the row went but the stored PDF could not be removed. */
  pdfDeleted: boolean
  numberReleased: string
}

/**
 * Deletes the invoice, releases its timesheet entries, and removes the PDF. The
 * invoice number becomes immediately available again because allocation reads
 * the invoices table, so regenerating reuses the same number.
 */
export async function removeInvoice(invoiceId: number): Promise<RemoveInvoiceResult> {
  const invoice = await deleteInvoiceRecord(invoiceId)

  let pdfDeleted = true
  try {
    await deleteInvoicePdf(invoice.pdf_blob_path)
  } catch {
    // The row is already gone, so surface this rather than failing the delete:
    // an orphaned PDF needs manual cleanup and should not be silent.
    pdfDeleted = false
  }

  return { invoice, pdfDeleted, numberReleased: invoice.invoice_no }
}

export function parseEntryIds(input: unknown): number[] {
  return requirePositiveIntArray(asRecord(input).entryIds, "entryIds")
}

export function parseGenerateOptions(input: unknown): GenerateInvoiceOptions {
  const { sequence } = asRecord(input)
  if (sequence === undefined || sequence === null) return {}

  const parsed = requirePositiveInt(sequence, "sequence")
  if (parsed > MAX_INVOICE_SEQUENCE) {
    throw new ValidationError(`sequence must be ${MAX_INVOICE_SEQUENCE} or lower`)
  }
  return { sequence: parsed }
}

function asRecord(value: unknown, field = "body"): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError(`${field} must be a JSON object`)
  }
  return value as Record<string, unknown>
}
