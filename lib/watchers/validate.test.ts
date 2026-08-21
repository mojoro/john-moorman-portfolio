import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { ValidationError, parseIngestPayload } from "./validate"

const MINIMAL = {
  watcher: "flights",
  sightings: [{ externalKey: "LHR-SIN-2026-09-01", title: "LHR → SIN, €412" }],
}

describe("ingest payload validation", () => {
  it("accepts a minimal payload and defaults the run", () => {
    const parsed = parseIngestPayload(MINIMAL)
    assert.equal(parsed.watcher, "flights")
    assert.equal(parsed.sightings.length, 1)
    assert.equal(parsed.run.ok, true)
    assert.equal(parsed.run.matchedCount, 1)
    assert.equal(parsed.run.error, null)
  })

  it("carries an explicit run through", () => {
    const parsed = parseIngestPayload({
      ...MINIMAL,
      run: { ok: false, newCount: 1, matchedCount: 2, totalCount: 30, error: "scraper timed out" },
    })
    assert.equal(parsed.run.ok, false)
    assert.equal(parsed.run.totalCount, 30)
    assert.equal(parsed.run.error, "scraper timed out")
  })

  it("rejects a watcher id that is not a plain slug", () => {
    assert.throws(() => parseIngestPayload({ ...MINIMAL, watcher: "drop table" }), ValidationError)
    assert.throws(() => parseIngestPayload({ ...MINIMAL, watcher: "" }), ValidationError)
    assert.throws(() => parseIngestPayload({ ...MINIMAL, watcher: "x".repeat(65) }), ValidationError)
  })

  it("rejects a non-object body", () => {
    assert.throws(() => parseIngestPayload(null), ValidationError)
    assert.throws(() => parseIngestPayload([]), ValidationError)
    assert.throws(() => parseIngestPayload("watcher=flights"), ValidationError)
  })

  it("requires an external key and a title on every sighting", () => {
    assert.throws(() => parseIngestPayload({ ...MINIMAL, sightings: [{ title: "no key" }] }), ValidationError)
    assert.throws(() => parseIngestPayload({ ...MINIMAL, sightings: [{ externalKey: "k" }] }), ValidationError)
    assert.throws(() => parseIngestPayload({ ...MINIMAL, sightings: ["nope"] }), ValidationError)
  })

  it("rejects a URL scheme the admin page must never render as a link", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,<script>", "/relative"]) {
      assert.throws(
        () => parseIngestPayload({ ...MINIMAL, sightings: [{ ...MINIMAL.sightings[0], url }] }),
        ValidationError,
        `expected ${url} to be rejected`
      )
    }
    assert.doesNotThrow(() =>
      parseIngestPayload({ ...MINIMAL, sightings: [{ ...MINIMAL.sightings[0], url: "https://example.com/x" }] })
    )
  })

  it("rejects duplicate external keys, which would break the upsert", () => {
    assert.throws(
      () => parseIngestPayload({ ...MINIMAL, sightings: [MINIMAL.sightings[0], MINIMAL.sightings[0]] }),
      ValidationError
    )
  })

  it("bounds the array, the strings, and the payload", () => {
    const one = MINIMAL.sightings[0]
    assert.throws(
      () => parseIngestPayload({ ...MINIMAL, sightings: Array.from({ length: 501 }, (_, i) => ({ ...one, externalKey: `k${i}` })) }),
      ValidationError
    )
    assert.throws(() => parseIngestPayload({ ...MINIMAL, sightings: [{ ...one, title: "t".repeat(301) }] }), ValidationError)
    assert.throws(
      () => parseIngestPayload({ ...MINIMAL, sightings: [{ ...one, payload: { blob: "x".repeat(9000) } }] }),
      ValidationError
    )
    assert.throws(() => parseIngestPayload({ ...MINIMAL, sightings: [{ ...one, payload: ["not", "an", "object"] }] }), ValidationError)
    assert.throws(
      () => parseIngestPayload({ ...MINIMAL, sightings: [{ ...one, matchedReasons: Array(21).fill("r") }] }),
      ValidationError
    )
  })

  it("rejects nonsense counts", () => {
    assert.throws(() => parseIngestPayload({ ...MINIMAL, run: { newCount: -1 } }), ValidationError)
    assert.throws(() => parseIngestPayload({ ...MINIMAL, run: { totalCount: 1.5 } }), ValidationError)
    assert.throws(() => parseIngestPayload({ ...MINIMAL, run: { ok: "yes" } }), ValidationError)
  })

  it("treats missing sightings as an empty report", () => {
    const parsed = parseIngestPayload({ watcher: "flights" })
    assert.deepEqual(parsed.sightings, [])
    assert.equal(parsed.run.matchedCount, 0)
  })
})
