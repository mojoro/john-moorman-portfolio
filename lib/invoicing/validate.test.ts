import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  requireDate,
  requireHours,
  requireInvoicePrefix,
  requirePositiveInt,
  requirePositiveIntArray,
  optionalDate,
  ValidationError,
} from "./validate"

describe("date validation", () => {
  it("accepts a real ISO date", () => {
    assert.equal(requireDate("2026-08-05", "workDate"), "2026-08-05")
  })

  it("rejects Postgres date keywords that a DATE column would otherwise accept", () => {
    for (const value of ["infinity", "-infinity", "today", "epoch", "now"]) {
      assert.throws(() => requireDate(value, "workDate"), ValidationError)
    }
  })

  it("rejects impossible calendar dates", () => {
    assert.throws(() => requireDate("2026-02-30", "workDate"), ValidationError)
    assert.throws(() => requireDate("2026-13-01", "workDate"), ValidationError)
  })

  it("treats blank and missing optional dates as null", () => {
    assert.equal(optionalDate("", "workEndDate"), null)
    assert.equal(optionalDate(undefined, "workEndDate"), null)
    assert.equal(optionalDate(null, "workEndDate"), null)
  })
})

describe("hours validation", () => {
  it("accepts decimals, comma decimals, and hh:mm:ss", () => {
    assert.equal(requireHours(1.5, "hours"), 1.5)
    assert.equal(requireHours("1,5", "hours"), 1.5)
    assert.equal(requireHours("01:30:00", "hours"), 1.5)
  })

  it("rejects zero, negatives, and junk", () => {
    for (const value of [0, -1, "", "abc"]) {
      assert.throws(() => requireHours(value, "hours"), ValidationError)
    }
  })
})

describe("entry id validation", () => {
  it("accepts numeric strings and numbers", () => {
    assert.deepEqual(requirePositiveIntArray(["1", 2, "3"], "entryIds"), [1, 2, 3])
  })

  it("rejects empty arrays, duplicates, and non-integers", () => {
    assert.throws(() => requirePositiveIntArray([], "entryIds"), ValidationError)
    assert.throws(() => requirePositiveIntArray([1, 1], "entryIds"), ValidationError)
    assert.throws(() => requirePositiveIntArray([1.5], "entryIds"), ValidationError)
    assert.throws(() => requirePositiveIntArray([0], "entryIds"), ValidationError)
    assert.throws(() => requirePositiveIntArray("1", "entryIds"), ValidationError)
  })

  it("rejects non-positive integers", () => {
    assert.throws(() => requirePositiveInt(-3, "id"), ValidationError)
    assert.throws(() => requirePositiveInt("abc", "id"), ValidationError)
  })
})

describe("invoice prefix validation", () => {
  it("uppercases a valid prefix", () => {
    assert.equal(requireInvoicePrefix("spacifik"), "SPACIFIK")
  })

  it("rejects characters that could escape a file path", () => {
    for (const value of ["../etc", "a/b", "a.b", "a b"]) {
      assert.throws(() => requireInvoicePrefix(value), ValidationError)
    }
  })
})
