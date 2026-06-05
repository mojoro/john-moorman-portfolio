export function buildInvoiceNumber(prefix: string, issuedDate: string, sequence: number): string {
  const normalizedPrefix = prefix.trim().toUpperCase()
  if (!normalizedPrefix) throw new Error("Invoice prefix is required")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issuedDate)) throw new Error("Issued date must be YYYY-MM-DD")
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error("Invoice sequence must be a positive integer")

  return `${normalizedPrefix}-${issuedDate}-${String(sequence).padStart(2, "0")}`
}

export function todayIso(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
