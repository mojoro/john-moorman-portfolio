export interface Client {
  id: number
  name: string
  invoice_prefix: string
  bill_to: string
  ust_id: string | null
  hourly_rate_eur: number
  created_at: string
}

export interface TimesheetEntry {
  id: number
  work_date: string
  work_end_date: string | null
  hours: number
  task: string
  client_id: number
  client_name: string
  invoice_id: number | null
  invoice_no: string | null
  created_at: string
}

export interface Invoice {
  id: number
  invoice_no: string
  client_id: number
  client_name: string
  issued_date: string
  period_summary: string
  total_hours: number
  subtotal_eur: number
  vat_rate: number
  vat_eur: number
  total_eur: number
  is_kleinunternehmer: boolean
  pdf_url: string
  pdf_blob_path: string
  created_at: string
}

export interface InvoiceLineItem {
  date: string
  description: string
  hours: number
  rate: number
  amount: number
}

export interface InvoiceTotals {
  lineItems: InvoiceLineItem[]
  periodSummary: string
  totalHours: number
  subtotal: number
  vat: number
  total: number
}

export interface SelectedTimesheetEntry {
  id: number
  work_date: string
  work_end_date: string | null
  hours: number
  task: string
  client_id: number
  client_name: string
  hourly_rate_eur: number
  invoice_prefix: string
  invoice_id: number | null
}
