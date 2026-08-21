import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { chunkMessage, escapeHtml, formatBaselineMessage, formatSightingsMessage } from "./telegram"
import type { StoredSighting } from "./types"

function sighting(overrides: Partial<StoredSighting> = {}): StoredSighting {
  return {
    id: 1,
    watcher: "featherless",
    externalKey: "https://jobs.ashbyhq.com/featherlessai/aaa",
    title: "ML Engineer",
    location: "Remote (world)",
    url: "https://jobs.ashbyhq.com/featherlessai/aaa",
    matchedReasons: ["remote:text"],
    payload: {},
    firstSeen: "now",
    lastSeen: "now",
    notifiedAt: null,
    ...overrides,
  }
}

describe("HTML escaping", () => {
  it("escapes the three characters Telegram's HTML mode cares about", () => {
    assert.equal(escapeHtml(`Dev & Ops <b>"x"</b>`), `Dev &amp; Ops &lt;b&gt;"x"&lt;/b&gt;`)
  })

  it("escapes a job title that would otherwise inject markup", () => {
    const message = formatSightingsMessage("featherless", [sighting({ title: "Engineer <script>" })])
    assert.ok(message.includes("Engineer &lt;script&gt;"))
    assert.ok(!message.includes("<script>"))
  })
})

describe("message formatting", () => {
  it("includes title, location, reasons, and the URL per role", () => {
    const message = formatSightingsMessage("featherless", [sighting()])
    assert.match(message, /1 new role/)
    assert.match(message, /ML Engineer/)
    assert.match(message, /Remote \(world\)/)
    assert.match(message, /matched: remote:text/)
    assert.match(message, /jobs\.ashbyhq\.com\/featherlessai\/aaa/)
  })

  it("pluralizes the heading", () => {
    const message = formatSightingsMessage("featherless", [sighting(), sighting({ id: 2, title: "AI Researcher" })])
    assert.match(message, /2 new roles/)
  })

  it("names the count in the baseline one-liner", () => {
    assert.match(formatBaselineMessage("featherless", 12), /baseline recorded: 12 matching roles/)
    assert.match(formatBaselineMessage("featherless", 1), /baseline recorded: 1 matching role/)
  })
})

describe("chunking for the 4096-character limit", () => {
  it("leaves a short message as a single chunk", () => {
    assert.deepEqual(chunkMessage("hello"), ["hello"])
  })

  it("drops an empty message rather than sending a blank one", () => {
    assert.deepEqual(chunkMessage(""), [])
  })

  it("splits on line boundaries and keeps every chunk under the limit", () => {
    const text = Array.from({ length: 400 }, (_, index) => `• Role number ${index} in a very long digest`).join("\n")
    const chunks = chunkMessage(text)

    assert.ok(chunks.length > 1)
    assert.ok(chunks.every((chunk) => chunk.length <= 4096))
    assert.equal(chunks.join("\n"), text, "chunking must not lose or reorder content")
  })

  it("hard-splits a single line that cannot fit", () => {
    const chunks = chunkMessage("x".repeat(9000))
    assert.equal(chunks.length, 3)
    assert.ok(chunks.every((chunk) => chunk.length <= 4096))
    assert.equal(chunks.join(""), "x".repeat(9000))
  })

  it("respects a custom limit", () => {
    assert.deepEqual(chunkMessage("aaa\nbbb\nccc", 7), ["aaa\nbbb", "ccc"])
  })
})
