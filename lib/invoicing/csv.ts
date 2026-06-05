import { parseHoursAmount } from "./time"

export interface ParsedTimesheetCsvEntry {
  workDate: string
  workEndDate?: string | null
  hours: number
  task: string
  clientName?: string
  invoiced?: boolean
}

export interface ParsedTimesheetCsv {
  entries: ParsedTimesheetCsvEntry[]
}

const DATE_HEADERS = new Set(["date", "datum", "workdate", "work_date", "work date", "start_date", "start date"])
const END_DATE_HEADERS = new Set(["enddate", "end_date", "end date", "work_end_date", "work end date", "bis"])
const HOURS_HEADERS = new Set(["hours", "duration", "time", "quantity", "qty", "zeitaufwand"])
const TASK_HEADERS = new Set(["task", "description", "desc", "notes", "note"])
const CLIENT_HEADERS = new Set(["client", "kunde", "customer"])
const INVOICED_HEADERS = new Set(["invoiced", "invoiced?", "invoice", "billed", "abgerechnet"])

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const next = csv[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(field.trim())
      field = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1
      row.push(field.trim())
      field = ""
      if (row.some((cell) => cell.length > 0)) rows.push(row)
      row = []
      continue
    }

    field += char
  }

  row.push(field.trim())
  if (row.some((cell) => cell.length > 0)) rows.push(row)

  if (inQuotes) throw new Error("CSV has an unterminated quoted field")
  return rows
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[-\s]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function findHeaderIndex(headers: string[], accepted: Set<string>, label: string): number {
  const index = headers.findIndex(
    (header) => accepted.has(header) || accepted.has(header.replace(/_/g, " ")) || [...accepted].some((acceptedHeader) => header.startsWith(acceptedHeader))
  )
  if (index === -1) throw new Error(`CSV is missing a ${label} column`)
  return index
}

function findOptionalHeaderIndex(headers: string[], accepted: Set<string>): number | null {
  const index = headers.findIndex(
    (header) => accepted.has(header) || accepted.has(header.replace(/_/g, " ")) || [...accepted].some((acceptedHeader) => header.startsWith(acceptedHeader))
  )
  return index === -1 ? null : index
}

function parseDate(value: string): string | null {
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const european = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed)
  if (european) {
    const [, day, month, year] = european
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  if (slash) {
    const [, first, second, year] = slash
    const firstNumber = Number(first)
    const secondNumber = Number(second)
    const isEuropeanDayFirst = firstNumber > 12 || secondNumber <= 12
    const day = isEuropeanDayFirst ? first : second
    const month = isEuropeanDayFirst ? second : first
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  return null
}

function parseDateRange(value: string): { workDate: string | null; workEndDate: string | null } {
  const parts = value.split(/\s+(?:-|–|—|to|bis)\s+/i)
  if (parts.length !== 2) return { workDate: parseDate(value), workEndDate: null }

  const workDate = parseDate(parts[0] ?? "")
  const workEndDate = parseDate(parts[1] ?? "")
  return { workDate, workEndDate }
}

function parseBoolean(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase()
  if (["true", "yes", "y", "1", "ja", "x"].includes(normalized)) return true
  if (["false", "no", "n", "0", "nein", ""].includes(normalized)) return false
  return undefined
}

export function parseTimesheetCsv(csv: string): ParsedTimesheetCsv {
  const rows = parseCsvRows(csv)
  if (rows.length < 2) throw new Error("CSV must include a header row and at least one entry row")

  const headers = rows[0].map(normalizeHeader)
  const dateIndex = findHeaderIndex(headers, DATE_HEADERS, "date")
  const endDateIndex = findOptionalHeaderIndex(headers, END_DATE_HEADERS)
  const hoursIndex = findHeaderIndex(headers, HOURS_HEADERS, "hours")
  const taskIndex = findHeaderIndex(headers, TASK_HEADERS, "task")
  const clientIndex = findOptionalHeaderIndex(headers, CLIENT_HEADERS)
  const invoicedIndex = findOptionalHeaderIndex(headers, INVOICED_HEADERS)
  const entries: ParsedTimesheetCsvEntry[] = []
  const errors: string[] = []

  rows.slice(1).forEach((row, offset) => {
    const rowNumber = offset + 2
    const rowErrors: string[] = []
    const parsedRange = parseDateRange(row[dateIndex] ?? "")
    const hasEndDateValue = endDateIndex !== null && Boolean((row[endDateIndex] ?? "").trim())
    const workDate = parsedRange.workDate
    const workEndDate = endDateIndex === null ? parsedRange.workEndDate : parseDate(row[endDateIndex] ?? "")
    const hours = parseHoursAmount(row[hoursIndex] ?? "")
    const task = (row[taskIndex] ?? "").trim()
    const clientName = clientIndex === null ? undefined : (row[clientIndex] ?? "").trim() || undefined
    const invoiced = invoicedIndex === null ? undefined : parseBoolean(row[invoicedIndex] ?? "")

    if (!workDate) rowErrors.push("date must be YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY")
    if (hasEndDateValue && !workEndDate) rowErrors.push("end date must be YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY")
    if (workDate && workEndDate && workEndDate < workDate) rowErrors.push("end date must be on or after date")
    if (!Number.isFinite(hours) || hours <= 0) rowErrors.push("hours must be greater than 0")
    if (!task) rowErrors.push("task is required")

    if (!workDate || (hasEndDateValue && !workEndDate) || (workEndDate && workEndDate < workDate) || !Number.isFinite(hours) || hours <= 0 || !task) {
      errors.push(`Row ${rowNumber}: ${rowErrors.join(", ")}`)
      return
    }

    const entry: ParsedTimesheetCsvEntry = { workDate, hours, task }
    if (workEndDate) entry.workEndDate = workEndDate
    if (clientName) entry.clientName = clientName
    if (invoiced !== undefined) entry.invoiced = invoiced
    entries.push(entry)
  })

  if (errors.length > 0) throw new Error(errors.join("; "))
  if (entries.length === 0) throw new Error("CSV did not contain any importable entries")
  return { entries }
}
