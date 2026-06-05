import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { toDateOnlyString } from "./db"

describe("database date normalization", () => {
  it("preserves date-only values represented as local-midnight Date objects", () => {
    const previousTimezone = process.env.TZ
    process.env.TZ = "Europe/Berlin"
    try {
      assert.equal(toDateOnlyString(new Date(2026, 4, 13)), "2026-05-13")
    } finally {
      process.env.TZ = previousTimezone
    }
  })
})
