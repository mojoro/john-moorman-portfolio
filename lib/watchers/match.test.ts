import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { ashbyBoardFixture } from "./ashby-fixture"
import { normalizeAshbyBoard, normalizeAshbyJob } from "./ashby"
import { diffSightings, matchJob, matchJobs } from "./match"
import type { NormalizedJob, WatcherConfig } from "./types"

const CONFIG: WatcherConfig = {
  id: "featherless",
  source: "ashby",
  board: "featherlessai",
  cities: ["berlin", "singapore"],
  includeRemote: true,
  exclude: [],
}

const CITIES_ONLY: WatcherConfig = { ...CONFIG, includeRemote: false }

function job(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    externalKey: "https://jobs.ashbyhq.com/acme/abc",
    title: "Software Engineer",
    location: "Nowhere",
    url: "https://jobs.ashbyhq.com/acme/abc",
    isListed: true,
    isRemote: false,
    isRemoteWorkplace: false,
    locationBlob: "nowhere",
    payload: {},
    ...overrides,
  }
}

describe("normalizing the real Ashby payload", () => {
  const jobs = normalizeAshbyBoard(ashbyBoardFixture)

  it("normalizes every posting in the captured board", () => {
    assert.equal(jobs.length, 5)
    assert.ok(jobs.every((entry) => entry.externalKey.startsWith("https://jobs.ashbyhq.com/featherlessai/")))
  })

  it("treats a null isRemote with a 'Remote (world)' location as remote", () => {
    const remoteWorld = jobs.find((entry) => entry.title.includes("AI Architecture Research"))
    assert.ok(remoteWorld)
    // The live board really does send null for both structured remote fields here.
    assert.equal(remoteWorld.isRemote, false)
    assert.equal(remoteWorld.isRemoteWorkplace, false)
    assert.deepEqual(matchJob(remoteWorld, CONFIG)?.matchedReasons, ["remote:text"])
  })

  it("folds secondary locations and their postal addresses into the blob", () => {
    const europe = jobs.find((entry) => entry.title.startsWith("Business Development Rep"))
    assert.ok(europe)
    assert.equal(europe.location, "Europe")
    assert.ok(europe.locationBlob.includes("berlin"))
    assert.ok(europe.locationBlob.includes("germany"))
  })

  it("keeps the job URL as the external key so a retitle does not look new", () => {
    const [first] = jobs
    assert.equal(first.externalKey, first.url)
    assert.match(first.externalKey, /[0-9a-f]{8}-[0-9a-f]{4}-/)
  })
})

describe("matching", () => {
  it("matches a city that only appears in a secondary location", () => {
    // The whole reason the blob exists: Berlin is not in this job's primary
    // location field, only in its secondaryLocations array.
    const europe = normalizeAshbyBoard(ashbyBoardFixture).find((entry) =>
      entry.title.startsWith("Business Development Rep")
    )
    assert.ok(europe)

    const sighting = matchJob(europe, CITIES_ONLY)
    assert.ok(sighting, "expected the Berlin secondary location to match")
    assert.deepEqual(sighting.matchedReasons, ["city:berlin"])
  })

  it("skips unlisted postings even when they would otherwise match", () => {
    const hidden = job({ isListed: false, isRemote: true, locationBlob: "berlin" })
    assert.equal(matchJob(hidden, CONFIG), null)
  })

  it("records each remote signal separately", () => {
    assert.deepEqual(matchJob(job({ isRemote: true }), CONFIG)?.matchedReasons, ["remote:flag"])
    assert.deepEqual(matchJob(job({ isRemoteWorkplace: true }), CONFIG)?.matchedReasons, ["remote:workplace"])
    assert.deepEqual(matchJob(job({ locationBlob: "remote (world)" }), CONFIG)?.matchedReasons, ["remote:text"])
  })

  it("records every city that hits", () => {
    const both = job({ locationBlob: "berlin | singapore", isRemote: false })
    assert.deepEqual(matchJob(both, CITIES_ONLY)?.matchedReasons, ["city:berlin", "city:singapore"])
  })

  it("ignores remote entirely when includeRemote is off", () => {
    assert.equal(matchJob(job({ isRemote: true, locationBlob: "remote" }), CITIES_ONLY), null)
  })

  it("lets an exclude pattern veto a match found in the location blob", () => {
    const config = { ...CONFIG, exclude: ["us & canada"] }
    const usOnly = job({ isRemote: true, locationBlob: "remote (us & canada)" })
    assert.ok(matchJob(usOnly, CONFIG), "sanity: matches without the exclude")
    assert.equal(matchJob(usOnly, config), null)
  })

  it("lets an exclude pattern veto on the title, case-insensitively", () => {
    const config = { ...CONFIG, exclude: ["CHIEF OF STAFF"] }
    assert.equal(matchJob(job({ title: "Chief of Staff", isRemote: true }), config), null)
  })

  it("ignores blank exclude patterns rather than vetoing everything", () => {
    const config = { ...CONFIG, exclude: ["", "   "] }
    assert.ok(matchJob(job({ isRemote: true }), config))
  })

  it("drops duplicate external keys so the upsert cannot self-conflict", () => {
    const duplicate = normalizeAshbyJob({ jobUrl: "https://x/1", title: "A", location: "Remote", isListed: true })
    assert.equal(matchJobs([duplicate, duplicate], CONFIG).length, 1)
  })
})

describe("diffing against known keys", () => {
  const sightings = [
    { externalKey: "a", title: "A", location: "", url: "", matchedReasons: [], payload: {} },
    { externalKey: "b", title: "B", location: "", url: "", matchedReasons: [], payload: {} },
  ]

  it("treats everything as fresh when nothing is known", () => {
    const { fresh, known } = diffSightings([], sightings)
    assert.deepEqual(
      fresh.map((entry) => entry.externalKey),
      ["a", "b"]
    )
    assert.equal(known.length, 0)
  })

  it("separates the already-seen from the new", () => {
    const { fresh, known } = diffSightings(["a"], sightings)
    assert.deepEqual(
      fresh.map((entry) => entry.externalKey),
      ["b"]
    )
    assert.deepEqual(
      known.map((entry) => entry.externalKey),
      ["a"]
    )
  })
})
