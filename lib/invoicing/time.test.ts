import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { parseHoursAmount } from "./time"

describe("timesheet hour parsing", () => {
  it("keeps decimal hour amounts", () => {
    assert.equal(parseHoursAmount("1.5"), 1.5)
    assert.equal(parseHoursAmount("1,25"), 1.25)
  })

  it("converts hh:mm:ss amounts to hours rounded to two decimals", () => {
    assert.equal(parseHoursAmount("01:30:00"), 1.5)
    assert.equal(parseHoursAmount("02:10:30"), 2.18)
    assert.equal(parseHoursAmount("0:00:01"), 0)
  })

  it("rejects malformed time amounts", () => {
    assert.equal(Number.isNaN(parseHoursAmount("01:75:00")), true)
    assert.equal(Number.isNaN(parseHoursAmount("1:30")), true)
  })
})
