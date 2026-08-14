import { parseHoursAmount } from "./time"

/** Thrown for caller-supplied input problems. Routes map this to 400, not 500. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isRealCalendarDate(iso: string): boolean {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function requireString(value: unknown, field: string): string {
  const text = typeof value === "string" ? value.trim() : ""
  if (!text) throw new ValidationError(`${field} is required`)
  return text
}

/**
 * Postgres accepts 'infinity', 'today', and 'epoch' for a DATE column, so a
 * plain non-empty check is not enough to keep junk out of the timesheet.
 */
export function requireDate(value: unknown, field: string): string {
  const text = requireString(value, field)
  if (!ISO_DATE.test(text) || !isRealCalendarDate(text)) {
    throw new ValidationError(`${field} must be a real date in YYYY-MM-DD form`)
  }
  return text
}

export function optionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null
  if (typeof value === "string" && !value.trim()) return null
  return requireDate(value, field)
}

export function requirePositiveNumber(value: unknown, field: string): number {
  const parsed = typeof value === "number" ? value : Number(requireString(value, field))
  if (!Number.isFinite(parsed) || parsed <= 0) throw new ValidationError(`${field} must be a positive number`)
  return parsed
}

/** Accepts a decimal number, a decimal string ("1,5" or "1.5"), or "hh:mm:ss". */
export function requireHours(value: unknown, field: string): number {
  const parsed = typeof value === "number" ? value : parseHoursAmount(requireString(value, field))
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${field} must be a positive number of hours or an hh:mm:ss duration`)
  }
  return parsed
}

export function requirePositiveInt(value: unknown, field: string): number {
  const parsed = typeof value === "number" ? value : Number(requireString(value, field))
  if (!Number.isInteger(parsed) || parsed <= 0) throw new ValidationError(`${field} must be a positive integer`)
  return parsed
}

export function requirePositiveIntArray(value: unknown, field: string): number[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`${field} must be a non-empty array of positive integers`)
  }
  const ids = value.map((item) => requirePositiveInt(item, `${field}[]`))
  if (new Set(ids).size !== ids.length) throw new ValidationError(`${field} must not contain duplicates`)
  return ids
}

export function requireInvoicePrefix(value: unknown, field = "invoicePrefix"): string {
  const prefix = requireString(value, field).toUpperCase()
  if (!/^[A-Z0-9_-]+$/.test(prefix)) {
    throw new ValidationError(`${field} may only contain letters, numbers, underscores, and hyphens`)
  }
  return prefix
}

export function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null
  return value.trim() || null
}

/**
 * Absent stays undefined so callers can leave a flag unset rather than forcing
 * false. Strings are accepted because form fields arrive as "true"/"false".
 */
export function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value === "boolean") return value
  if (value === "true") return true
  if (value === "false") return false
  throw new ValidationError(`${field} must be a boolean`)
}
