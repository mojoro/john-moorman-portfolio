/**
 * Numbers are keyed on the start of the Leistungszeitraum rather than the issue
 * date, so work rendered in December stays in that tax year even when the
 * invoice goes out in January.
 */
export function buildInvoiceNumber(prefix: string, periodStart: string, sequence: number): string {
  const normalizedPrefix = prefix.trim().toUpperCase()
  if (!normalizedPrefix) throw new Error("Invoice prefix is required")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart)) throw new Error("Period start must be YYYY-MM-DD")
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error("Invoice sequence must be a positive integer")

  const compactPeriodStart = periodStart.slice(2).replace(/-/g, "")
  return `${normalizedPrefix}-${compactPeriodStart}-${sequence}`
}

export function todayIso(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
