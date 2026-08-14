import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildInvoiceTotals, formatEur, formatPeriod, round2 } from "./grouping"
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

  it("itemizes one row per entry carrying its own task when taskPerRow is set", () => {
    const totals = buildInvoiceTotals(
      [
        { ...baseEntry, id: 1, work_date: "2026-05-13", work_end_date: null, hours: 1.5, task: "Email" },
        { ...baseEntry, id: 2, work_date: "2026-05-13", work_end_date: null, hours: 2.25, task: "Scheduling" },
        { ...baseEntry, id: 3, work_date: "2026-05-21", work_end_date: "2026-05-31", hours: 41, task: "Admin" },
      ],
      { taskPerRow: true }
    )

    // Same-day entries stay separate here, unlike the default grouping above.
    assert.deepEqual(totals.lineItems, [
      { date: "2026-05-13", description: "Email", hours: 1.5, rate: 40, amount: 60 },
      { date: "2026-05-13", description: "Scheduling", hours: 2.25, rate: 40, amount: 90 },
      { date: "2026-05-21 - 2026-05-31", description: "Admin", hours: 41, rate: 40, amount: 1640 },
    ])
    assert.equal(totals.periodSummary, "2026-05-13, 2026-05-21, 2026-05-31")
    assert.equal(totals.totalHours, 44.75)
    assert.equal(totals.subtotal, 1790)
    assert.equal(totals.vat, 0)
    assert.equal(totals.total, 1790)
  })

  it("keeps totals identical whichever itemisation is used", () => {
    const entries = [
      { ...baseEntry, id: 1, work_date: "2026-05-13", work_end_date: null, hours: 1.5, task: "Email" },
      { ...baseEntry, id: 2, work_date: "2026-05-13", work_end_date: null, hours: 2.25, task: "Scheduling" },
      { ...baseEntry, id: 3, work_date: "2026-05-21", work_end_date: "2026-05-31", hours: 41, task: "Admin" },
    ]
    const grouped = buildInvoiceTotals(entries)
    const perTask = buildInvoiceTotals(entries, { taskPerRow: true })

    assert.equal(perTask.totalHours, grouped.totalHours)
    assert.equal(perTask.subtotal, grouped.subtotal)
    assert.equal(perTask.total, grouped.total)
    assert.equal(perTask.periodSummary, grouped.periodSummary)
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
