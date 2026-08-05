import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildInvoiceNumber } from "./invoice-number"

/**
 * Mirrors nextInvoiceSequence's gap-finding without a database, so the reuse
 * rule itself is pinned: the lowest free sequence wins, and a deleted invoice
 * leaves its number free.
 */
function lowestFreeSequence(prefix: string, periodStart: string, existing: string[], max = 999): number {
  const taken = new Set(existing)
  for (let sequence = 1; sequence <= max; sequence += 1) {
    if (!taken.has(buildInvoiceNumber(prefix, periodStart, sequence))) return sequence
  }
  throw new Error("exhausted")
}

describe("invoice number reuse", () => {
  const prefix = "SPK"
  const period = "2026-08-04"

  it("starts at 1 when nothing exists for the period", () => {
    assert.equal(lowestFreeSequence(prefix, period, []), 1)
  })

  it("reuses a number after its invoice is deleted", () => {
    const withInvoice = [buildInvoiceNumber(prefix, period, 1)]
    assert.equal(lowestFreeSequence(prefix, period, withInvoice), 2)
    // Deleting it frees the number again rather than burning it.
    assert.equal(lowestFreeSequence(prefix, period, []), 1)
  })

  it("fills a gap left in the middle before extending the range", () => {
    const existing = [1, 2, 4].map((n) => buildInvoiceNumber(prefix, period, n))
    assert.equal(lowestFreeSequence(prefix, period, existing), 3)
  })

  it("keeps periods and prefixes independent", () => {
    const otherPeriod = [buildInvoiceNumber(prefix, "2026-08-03", 1)]
    assert.equal(lowestFreeSequence(prefix, period, otherPeriod), 1)

    const otherPrefix = [buildInvoiceNumber("SHOWDECK", period, 1)]
    assert.equal(lowestFreeSequence(prefix, period, otherPrefix), 1)
  })

  it("ignores legacy PREFIX-YYYY-MM-DD-NN numbers", () => {
    // Six real invoices still use the old format; they must not be misread as
    // occupying a slot in the new PREFIX-YYMMDD-N range.
    const legacy = ["SPACIFIK-2026-06-02-08", "SHOWDECK-2026-08-01-01"]
    assert.equal(lowestFreeSequence("SPACIFIK", "2026-06-02", legacy), 1)
  })

  it("reports exhaustion instead of colliding", () => {
    const all = Array.from({ length: 5 }, (_, i) => buildInvoiceNumber(prefix, period, i + 1))
    assert.throws(() => lowestFreeSequence(prefix, period, all, 5), /exhausted/)
  })
})
