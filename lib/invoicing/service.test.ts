import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { parseGenerateOptions } from "./service"
import { ValidationError } from "./validate"

describe("generate invoice options", () => {
  it("returns no options when the body carries neither field", () => {
    assert.deepEqual(parseGenerateOptions({}), {})
  })

  it("parses a forced sequence", () => {
    assert.deepEqual(parseGenerateOptions({ sequence: 3 }), { sequence: 3 })
    assert.deepEqual(parseGenerateOptions({ sequence: "3" }), { sequence: 3 })
  })

  it("parses taskPerRow from the API boolean and the form string", () => {
    assert.deepEqual(parseGenerateOptions({ taskPerRow: true }), { taskPerRow: true })
    assert.deepEqual(parseGenerateOptions({ taskPerRow: "true" }), { taskPerRow: true })
    assert.deepEqual(parseGenerateOptions({ taskPerRow: false }), { taskPerRow: false })
  })

  it("carries both fields together", () => {
    assert.deepEqual(parseGenerateOptions({ sequence: 2, taskPerRow: true }), { sequence: 2, taskPerRow: true })
  })

  it("rejects an out-of-range sequence and a non-boolean taskPerRow", () => {
    assert.throws(() => parseGenerateOptions({ sequence: 1000 }), ValidationError)
    assert.throws(() => parseGenerateOptions({ sequence: 0 }), ValidationError)
    assert.throws(() => parseGenerateOptions({ taskPerRow: "yes" }), ValidationError)
  })

  it("rejects a body that is not an object", () => {
    assert.throws(() => parseGenerateOptions(null), ValidationError)
    assert.throws(() => parseGenerateOptions([]), ValidationError)
  })
})
