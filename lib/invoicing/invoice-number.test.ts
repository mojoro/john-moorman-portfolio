import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildInvoiceNumber, todayIso } from "./invoice-number"

describe("invoice numbering", () => {
  it("builds a number from the period start, not the issue date", () => {
    assert.equal(buildInvoiceNumber("SPK", "2026-08-03", 1), "SPK-260803-1")
    assert.equal(buildInvoiceNumber("SPK", "2026-08-04", 1), "SPK-260804-1")
  })

  it("keeps work rendered in December under its own year", () => {
    // Invoiced on 1 January, but the service period governs the German tax year.
    assert.equal(buildInvoiceNumber("SPK", "2026-12-31", 1), "SPK-261231-1")
  })

  it("counts repeat invoices for one period start", () => {
    assert.equal(buildInvoiceNumber("SPK", "2026-08-03", 2), "SPK-260803-2")
    assert.equal(buildInvoiceNumber("SPK", "2026-08-03", 12), "SPK-260803-12")
  })

  it("normalizes the prefix", () => {
    assert.equal(buildInvoiceNumber("  spk  ", "2026-08-03", 1), "SPK-260803-1")
  })

  it("sorts lexicographically in chronological order", () => {
    const numbers = [
      buildInvoiceNumber("SPK", "2027-01-04", 1),
      buildInvoiceNumber("SPK", "2026-08-03", 1),
      buildInvoiceNumber("SPK", "2026-12-31", 1),
    ]
    assert.deepEqual([...numbers].sort(), ["SPK-260803-1", "SPK-261231-1", "SPK-270104-1"])
  })

  it("rejects a missing prefix", () => {
    assert.throws(() => buildInvoiceNumber("   ", "2026-08-03", 1), /prefix is required/)
  })

  it("rejects a period start that is not ISO", () => {
    assert.throws(() => buildInvoiceNumber("SPK", "03.08.2026", 1), /Period start/)
    assert.throws(() => buildInvoiceNumber("SPK", "260803", 1), /Period start/)
  })

  it("rejects a sequence below one or non-integer", () => {
    assert.throws(() => buildInvoiceNumber("SPK", "2026-08-03", 0), /positive integer/)
    assert.throws(() => buildInvoiceNumber("SPK", "2026-08-03", 1.5), /positive integer/)
  })

  it("formats local dates as YYYY-MM-DD", () => {
    assert.equal(todayIso(new Date(2026, 4, 25)), "2026-05-25")
  })
})
