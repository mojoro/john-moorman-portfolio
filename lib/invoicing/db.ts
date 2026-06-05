import { neon, Pool } from "@neondatabase/serverless"
import type { Client, Invoice, SelectedTimesheetEntry, TimesheetEntry } from "./types"

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }
  return neon(process.env.DATABASE_URL)
}

let sharedPool: Pool | null = null

function getSharedPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }
  sharedPool ??= new Pool({ connectionString: process.env.DATABASE_URL })
  return sharedPool
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  throw new Error(`Expected numeric database value, received ${typeof value}`)
}

export function toDateOnlyString(value: unknown): string {
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, "0")
    const day = String(value.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }
  return String(value)
}

type ClientRow = Omit<Client, "hourly_rate_eur"> & { hourly_rate_eur: string | number }
type InvoiceRow = Omit<Invoice, "total_hours" | "subtotal_eur" | "vat_rate" | "vat_eur" | "total_eur"> & {
  total_hours: string | number
  subtotal_eur: string | number
  vat_rate: string | number
  vat_eur: string | number
  total_eur: string | number
}
type TimesheetEntryRow = Omit<TimesheetEntry, "hours"> & { hours: string | number }
type SelectedTimesheetEntryRow = Omit<SelectedTimesheetEntry, "hours" | "hourly_rate_eur"> & {
  hours: string | number
  hourly_rate_eur: string | number
}

function normalizeClient(row: ClientRow): Client {
  return {
    ...row,
    hourly_rate_eur: toNumber(row.hourly_rate_eur),
    created_at: String(row.created_at),
  }
}

function normalizeInvoice(row: InvoiceRow): Invoice {
  return {
    ...row,
    issued_date: toDateOnlyString(row.issued_date),
    total_hours: toNumber(row.total_hours),
    subtotal_eur: toNumber(row.subtotal_eur),
    vat_rate: toNumber(row.vat_rate),
    vat_eur: toNumber(row.vat_eur),
    total_eur: toNumber(row.total_eur),
    created_at: String(row.created_at),
  }
}

function normalizeTimesheetEntry(row: TimesheetEntryRow): TimesheetEntry {
  return {
    ...row,
    work_date: toDateOnlyString(row.work_date),
    work_end_date: row.work_end_date ? toDateOnlyString(row.work_end_date) : null,
    hours: toNumber(row.hours),
    created_at: String(row.created_at),
  }
}

function normalizeSelectedEntry(row: SelectedTimesheetEntryRow): SelectedTimesheetEntry {
  return {
    ...row,
    work_date: toDateOnlyString(row.work_date),
    work_end_date: row.work_end_date ? toDateOnlyString(row.work_end_date) : null,
    hours: toNumber(row.hours),
    hourly_rate_eur: toNumber(row.hourly_rate_eur),
  }
}

export async function getClients(): Promise<Client[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql`
    SELECT id, name, invoice_prefix, bill_to, ust_id, hourly_rate_eur, created_at
    FROM clients
    ORDER BY name ASC
  `
  return (rows as ClientRow[]).map(normalizeClient)
}

export async function upsertClient(input: {
  id?: number
  name: string
  invoicePrefix: string
  billTo: string
  ustId: string | null
  hourlyRateEur: number
}): Promise<Client> {
  const sql = getDb()
  const rows = input.id
    ? await sql`
        UPDATE clients
        SET name = ${input.name},
            invoice_prefix = ${input.invoicePrefix},
            bill_to = ${input.billTo},
            ust_id = ${input.ustId},
            hourly_rate_eur = ${input.hourlyRateEur}
        WHERE id = ${input.id}
        RETURNING id, name, invoice_prefix, bill_to, ust_id, hourly_rate_eur, created_at
      `
    : await sql`
        INSERT INTO clients (name, invoice_prefix, bill_to, ust_id, hourly_rate_eur)
        VALUES (${input.name}, ${input.invoicePrefix}, ${input.billTo}, ${input.ustId}, ${input.hourlyRateEur})
        RETURNING id, name, invoice_prefix, bill_to, ust_id, hourly_rate_eur, created_at
      `

  return normalizeClient(rows[0] as ClientRow)
}

export async function getTimesheetEntries(options: { clientId?: number; includeInvoiced?: boolean } = {}): Promise<TimesheetEntry[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql.query(
    `
      SELECT e.id, e.work_date, e.work_end_date, e.hours, e.task, e.client_id, c.name AS client_name,
             e.invoice_id, i.invoice_no, e.created_at
      FROM timesheet_entries e
      JOIN clients c ON c.id = e.client_id
      LEFT JOIN invoices i ON i.id = e.invoice_id
      WHERE ($1::int IS NULL OR e.client_id = $1::int)
        AND ($2::boolean OR e.invoice_id IS NULL)
      ORDER BY e.work_date DESC, e.id DESC
    `,
    [options.clientId ?? null, options.includeInvoiced ?? false]
  )
  return (rows as TimesheetEntryRow[]).map(normalizeTimesheetEntry)
}

export async function addTimesheetEntry(input: {
  workDate: string
  workEndDate?: string | null
  hours: number
  task: string
  clientId: number
}): Promise<TimesheetEntry> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO timesheet_entries (work_date, work_end_date, hours, task, client_id)
    VALUES (${input.workDate}, ${input.workEndDate ?? null}, ${input.hours}, ${input.task}, ${input.clientId})
    RETURNING id, work_date, work_end_date, hours, task, client_id, invoice_id, created_at
  `
  const row = rows[0] as Omit<TimesheetEntryRow, "client_name" | "invoice_no"> & { invoice_id: number | null }
  return normalizeTimesheetEntry({ ...row, client_name: "", invoice_no: null })
}

export async function addTimesheetEntries(
  entries: Array<{ workDate: string; workEndDate?: string | null; hours: number; task: string }>,
  clientId: number
): Promise<number> {
  if (entries.length === 0) return 0

  const sql = getDb()
  const values: Array<[string, string | null, number, string, number]> = entries.map((entry) => [
    entry.workDate,
    entry.workEndDate ?? null,
    entry.hours,
    entry.task,
    clientId,
  ])
  const placeholders = values
    .map((_, index) => {
      const base = index * 5
      return `($${base + 1}::date, $${base + 2}::date, $${base + 3}::numeric, $${base + 4}, $${base + 5}::int)`
    })
    .join(", ")
  const params = values.flat()
  const rows = await sql.query(
    `
      INSERT INTO timesheet_entries (work_date, work_end_date, hours, task, client_id)
      VALUES ${placeholders}
      RETURNING id
    `,
    params
  )

  return rows.length
}

export async function getSelectedTimesheetEntries(entryIds: number[]): Promise<SelectedTimesheetEntry[]> {
  if (entryIds.length === 0) return []
  const sql = getDb()
  const rows = await sql.query(
    `
      SELECT e.id, e.work_date, e.work_end_date, e.hours, e.task, e.client_id, c.name AS client_name,
             c.hourly_rate_eur, c.invoice_prefix, e.invoice_id
      FROM timesheet_entries e
      JOIN clients c ON c.id = e.client_id
      WHERE e.id = ANY($1::int[])
      ORDER BY e.work_date ASC, e.id ASC
    `,
    [entryIds]
  )
  return (rows as SelectedTimesheetEntryRow[]).map(normalizeSelectedEntry)
}

export async function reserveInvoiceSequence(input: { issuedDate: string; invoicePrefix: string }): Promise<number> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO invoice_number_counters (invoice_date, invoice_prefix, last_number)
    VALUES (${input.issuedDate}, ${input.invoicePrefix}, 1)
    ON CONFLICT (invoice_date, invoice_prefix)
    DO UPDATE SET last_number = invoice_number_counters.last_number + 1,
                  updated_at = NOW()
    RETURNING last_number
  `
  return toNumber(rows[0].last_number)
}

export async function recordVoidedInvoiceNumber(input: {
  invoiceNo: string
  issuedDate: string
  invoicePrefix: string
  reason: string
}): Promise<void> {
  const sql = getDb()
  await sql`
    INSERT INTO voided_invoice_numbers (invoice_no, invoice_date, invoice_prefix, reason)
    VALUES (${input.invoiceNo}, ${input.issuedDate}, ${input.invoicePrefix}, ${input.reason})
    ON CONFLICT (invoice_no) DO NOTHING
  `
}

export async function createInvoiceForEntries(input: {
  invoiceNo: string
  clientId: number
  issuedDate: string
  periodSummary: string
  totalHours: number
  subtotalEur: number
  vatRate: number
  vatEur: number
  totalEur: number
  isKleinunternehmer: boolean
  pdfUrl: string
  pdfBlobPath: string
  entryIds: number[]
  expectedClient: {
    name: string
    invoicePrefix: string
    billTo: string
    ustId: string | null
    hourlyRateEur: number
  }
}): Promise<Invoice> {
  const pool = getSharedPool()
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const selectedRows = await client.query(
      `
        SELECT id, client_id, invoice_id
        FROM timesheet_entries
        WHERE id = ANY($1::int[])
        ORDER BY id ASC
        FOR UPDATE
      `,
      [input.entryIds]
    )

    if (selectedRows.rows.length !== input.entryIds.length) {
      throw new Error("Some selected entries no longer exist. Refresh and try again.")
    }

    const invalidRows = selectedRows.rows.filter(
      (row: { client_id: number; invoice_id: number | null }) =>
        row.client_id !== input.clientId || row.invoice_id !== null
    )
    if (invalidRows.length > 0) {
      throw new Error("Selected entries changed before invoice creation. Refresh and try again.")
    }

    const clientRows = await client.query(
      `
        SELECT name, invoice_prefix, bill_to, ust_id, hourly_rate_eur
        FROM clients
        WHERE id = $1
        FOR UPDATE
      `,
      [input.clientId]
    )

    if (clientRows.rows.length !== 1) {
      throw new Error("Client changed before invoice creation. Refresh and try again.")
    }

    const currentClient = clientRows.rows[0] as {
      name: string
      invoice_prefix: string
      bill_to: string
      ust_id: string | null
      hourly_rate_eur: string | number
    }
    const clientMatchesSnapshot =
      currentClient.name === input.expectedClient.name &&
      currentClient.invoice_prefix === input.expectedClient.invoicePrefix &&
      currentClient.bill_to === input.expectedClient.billTo &&
      currentClient.ust_id === input.expectedClient.ustId &&
      toNumber(currentClient.hourly_rate_eur) === input.expectedClient.hourlyRateEur

    if (!clientMatchesSnapshot) {
      throw new Error("Client billing details changed before invoice creation. Refresh and try again.")
    }

    const invoiceRows = await client.query(
      `
        INSERT INTO invoices (
          invoice_no, client_id, issued_date, period_summary, total_hours,
          subtotal_eur, vat_rate, vat_eur, total_eur, is_kleinunternehmer,
          pdf_url, pdf_blob_path
        )
        VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `,
      [
        input.invoiceNo,
        input.clientId,
        input.issuedDate,
        input.periodSummary,
        input.totalHours,
        input.subtotalEur,
        input.vatRate,
        input.vatEur,
        input.totalEur,
        input.isKleinunternehmer,
        input.pdfUrl,
        input.pdfBlobPath,
      ]
    )

    const invoiceId = Number(invoiceRows.rows[0].id)
    const updatedRows = await client.query(
      `
        UPDATE timesheet_entries
        SET invoice_id = $1
        WHERE id = ANY($2::int[])
          AND invoice_id IS NULL
        RETURNING id
      `,
      [invoiceId, input.entryIds]
    )

    if (updatedRows.rows.length !== input.entryIds.length) {
      throw new Error("Selected entries changed before invoice creation. Refresh and try again.")
    }

    const result = await client.query(
      `
        SELECT i.id, i.invoice_no, i.client_id, c.name AS client_name, i.issued_date,
               i.period_summary, i.total_hours, i.subtotal_eur, i.vat_rate, i.vat_eur,
               i.total_eur, i.is_kleinunternehmer, i.pdf_url, i.pdf_blob_path, i.created_at
        FROM invoices i
        JOIN clients c ON c.id = i.client_id
        WHERE i.id = $1
      `,
      [invoiceId]
    )

    await client.query("COMMIT")
    return normalizeInvoice(result.rows[0] as InvoiceRow)
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export async function getInvoices(): Promise<Invoice[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql`
    SELECT i.id, i.invoice_no, i.client_id, c.name AS client_name, i.issued_date,
           i.period_summary, i.total_hours, i.subtotal_eur, i.vat_rate, i.vat_eur,
           i.total_eur, i.is_kleinunternehmer, i.pdf_url, i.pdf_blob_path, i.created_at
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    ORDER BY i.issued_date DESC, i.id DESC
  `
  return (rows as InvoiceRow[]).map(normalizeInvoice)
}

export async function getInvoice(invoiceId: number): Promise<Invoice | null> {
  if (!process.env.DATABASE_URL) return null
  const sql = getDb()
  const rows = await sql`
    SELECT i.id, i.invoice_no, i.client_id, c.name AS client_name, i.issued_date,
           i.period_summary, i.total_hours, i.subtotal_eur, i.vat_rate, i.vat_eur,
           i.total_eur, i.is_kleinunternehmer, i.pdf_url, i.pdf_blob_path, i.created_at
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    WHERE i.id = ${invoiceId}
  `
  if (rows.length === 0) return null
  return normalizeInvoice(rows[0] as InvoiceRow)
}

export async function deleteInvoiceRecord(invoiceId: number): Promise<Invoice> {
  const pool = getSharedPool()
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const invoiceRows = await client.query(
      `
        SELECT i.id, i.invoice_no, i.client_id, c.name AS client_name, i.issued_date,
               i.period_summary, i.total_hours, i.subtotal_eur, i.vat_rate, i.vat_eur,
               i.total_eur, i.is_kleinunternehmer, i.pdf_url, i.pdf_blob_path, i.created_at
        FROM invoices i
        JOIN clients c ON c.id = i.client_id
        WHERE i.id = $1
        FOR UPDATE OF i
      `,
      [invoiceId]
    )

    if (invoiceRows.rows.length === 0) {
      throw new Error("Invoice not found")
    }

    await client.query("UPDATE timesheet_entries SET invoice_id = NULL WHERE invoice_id = $1", [invoiceId])
    await client.query("DELETE FROM invoices WHERE id = $1", [invoiceId])
    await client.query("COMMIT")

    return normalizeInvoice(invoiceRows.rows[0] as InvoiceRow)
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
