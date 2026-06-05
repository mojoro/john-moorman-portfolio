import type { InvoiceTotals, SelectedTimesheetEntry } from "./types"

export const DEFAULT_VAT_RATE = 0.19
export const KLEINUNTERNEHMER_NOTICE = "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export function formatHours(value: number): string {
  return round2(value).toFixed(2)
}

export function formatPeriod(isoDates: string[]): string {
  const uniqueSortedDates = [...new Set(isoDates)].sort()

  if (uniqueSortedDates.length === 0) return ""
  if (uniqueSortedDates.length === 1) return uniqueSortedDates[0]
  if (uniqueSortedDates.length <= 4) return uniqueSortedDates.join(", ")

  return `${uniqueSortedDates[0]} … ${uniqueSortedDates[uniqueSortedDates.length - 1]} (${uniqueSortedDates.length} days)`
}

function entryDateLabel(entry: Pick<SelectedTimesheetEntry, "work_date" | "work_end_date">): string {
  if (!entry.work_end_date || entry.work_end_date === entry.work_date) return entry.work_date
  return `${entry.work_date} - ${entry.work_end_date}`
}

export function buildInvoiceTotals(
  entries: SelectedTimesheetEntry[],
  options: { isKleinunternehmer?: boolean; vatRate?: number } = {}
): InvoiceTotals {
  if (entries.length === 0) {
    throw new Error("At least one timesheet entry is required")
  }

  const clientIds = new Set(entries.map((entry) => entry.client_id))
  if (clientIds.size !== 1) {
    throw new Error("Selection spans multiple clients")
  }

  const invoicedCount = entries.filter((entry) => entry.invoice_id !== null).length
  if (invoicedCount > 0) {
    throw new Error(`${invoicedCount} row(s) in the selection are already invoiced`)
  }

  const [firstEntry] = entries
  const rate = firstEntry.hourly_rate_eur
  const description = `Artistic Administration - ${firstEntry.client_name}`
  const hoursByDateLabel = new Map<string, number>()

  for (const entry of entries) {
    const dateLabel = entryDateLabel(entry)
    hoursByDateLabel.set(dateLabel, round2((hoursByDateLabel.get(dateLabel) ?? 0) + entry.hours))
  }

  const sortedDateLabels = [...hoursByDateLabel.entries()].sort(([a], [b]) => a.localeCompare(b))
  const lineItems = sortedDateLabels.map(([date, hours]) => ({
    date,
    description,
    hours: round2(hours),
    rate,
    amount: round2(hours * rate),
  }))

  const periodDates = entries.flatMap((entry) => (entry.work_end_date ? [entry.work_date, entry.work_end_date] : [entry.work_date]))
  const subtotal = round2(lineItems.reduce((sum, item) => sum + item.amount, 0))
  const vatRate = options.vatRate ?? DEFAULT_VAT_RATE
  const vat = options.isKleinunternehmer === false ? round2(subtotal * vatRate) : 0
  const total = round2(subtotal + vat)
  const totalHours = round2(lineItems.reduce((sum, item) => sum + item.hours, 0))

  return {
    lineItems,
    periodSummary: formatPeriod(periodDates),
    totalHours,
    subtotal,
    vat,
    total,
  }
}
