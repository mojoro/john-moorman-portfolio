import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildInvoiceTotals, formatEur, formatPeriod, round2 } from "./grouping"
import { buildInvoiceNumber, todayIso } from "./invoice-number"
import type { SelectedTimesheetEntry } from "./types"

const baseEntry = {
  client_id: 1,
  client_name: "Spacifik UG (haftungsbeschränkt)",
  hourly_rate_eur: 40,
  invoice_prefix: "SPACIFIK",
  invoice_id: null,
} satisfies Omit<SelectedTimesheetEntry, "id" | "work_date" | "work_end_date" | "hours" | "task">

describe("invoicing grouping", () => {
  it("groups normal entries by day and renders explicit range entries as ranges", () => {
    const totals = buildInvoiceTotals([
      { ...baseEntry, id: 1, work_date: "2026-05-13", work_end_date: null, hours: 1.5, task: "Email" },
      { ...baseEntry, id: 2, work_date: "2026-05-13", work_end_date: null, hours: 2.25, task: "Scheduling" },
      { ...baseEntry, id: 3, work_date: "2026-05-21", work_end_date: "2026-05-31", hours: 41, task: "Admin" },
    ])

    assert.deepEqual(totals.lineItems, [
      {
        date: "2026-05-13",
        description: "Artistic Administration - Spacifik UG (haftungsbeschränkt)",
        hours: 3.75,
        rate: 40,
        amount: 150,
      },
      {
        date: "2026-05-21 - 2026-05-31",
        description: "Artistic Administration - Spacifik UG (haftungsbeschränkt)",
        hours: 41,
        rate: 40,
        amount: 1640,
      },
    ])
    assert.equal(totals.periodSummary, "2026-05-13, 2026-05-21, 2026-05-31")
    assert.equal(totals.totalHours, 44.75)
    assert.equal(totals.subtotal, 1790)
    assert.equal(totals.vat, 0)
    assert.equal(totals.total, 1790)
  })

  it("rejects multi-client and already-invoiced selections", () => {
    assert.throws(
      () =>
        buildInvoiceTotals([
          { ...baseEntry, id: 1, work_date: "2026-05-13", work_end_date: null, hours: 1, task: "A" },
          { ...baseEntry, id: 2, client_id: 2, work_date: "2026-05-13", work_end_date: null, hours: 1, task: "B" },
        ]),
      /multiple clients/
    )

    assert.throws(
      () =>
        buildInvoiceTotals([
          { ...baseEntry, id: 1, work_date: "2026-05-13", work_end_date: null, hours: 1, task: "A", invoice_id: 10 },
        ]),
      /already invoiced/
    )
  })

  it("formats periods and euros like the Apps Script port", () => {
    assert.equal(formatPeriod(["2026-05-13"]), "2026-05-13")
    assert.equal(formatPeriod(["2026-05-13", "2026-05-14", "2026-05-15", "2026-05-16"]), "2026-05-13, 2026-05-14, 2026-05-15, 2026-05-16")
    assert.equal(formatPeriod(["2026-05-13", "2026-05-14", "2026-05-15", "2026-05-16", "2026-05-17"]), "2026-05-13 … 2026-05-17 (5 days)")
    assert.equal(formatEur(190), "190,00 €")
    assert.equal(round2(1.005), 1.01)
  })
})

describe("invoice numbers", () => {
  it("formats the Apps Script invoice number shape", () => {
    assert.equal(buildInvoiceNumber("spacifik", "2026-05-25", 1), "SPACIFIK-2026-05-25-01")
    assert.equal(buildInvoiceNumber("SPACIFIK", "2026-05-25", 12), "SPACIFIK-2026-05-25-12")
  })

  it("formats local dates as YYYY-MM-DD", () => {
    assert.equal(todayIso(new Date(2026, 4, 25)), "2026-05-25")
  })
})
