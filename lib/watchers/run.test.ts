import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { normalizeAshbyJob } from "./ashby"
import { runWatcher } from "./run"
import type {
  NormalizedJob,
  Sighting,
  StoredSighting,
  WatcherConfig,
  WatcherRunResult,
  WatcherStore,
} from "./types"

const CONFIG: WatcherConfig = {
  id: "featherless",
  source: "ashby",
  board: "featherlessai",
  cities: ["berlin"],
  includeRemote: true,
  exclude: [],
}

/**
 * An in-memory WatcherStore that mirrors the real one's contract: the unique
 * key is (watcher, external_key), and re-seeing a job must never touch
 * notified_at in either direction.
 */
class MemoryStore implements WatcherStore {
  rows: StoredSighting[] = []
  runs: WatcherRunResult[] = []
  private nextId = 1

  async listKnownKeys(watcher: string): Promise<string[]> {
    return this.rows.filter((row) => row.watcher === watcher).map((row) => row.externalKey)
  }

  async hasSuccessfulRun(watcher: string): Promise<boolean> {
    return this.runs.some((run) => run.watcher === watcher && run.ok)
  }

  async upsertSightings(watcher: string, sightings: Sighting[], markNotified: boolean): Promise<void> {
    for (const sighting of sightings) {
      const existing = this.rows.find((row) => row.watcher === watcher && row.externalKey === sighting.externalKey)
      if (existing) {
        Object.assign(existing, sighting, { lastSeen: "now" })
        continue
      }
      this.rows.push({
        ...sighting,
        id: this.nextId++,
        watcher,
        firstSeen: "now",
        lastSeen: "now",
        notifiedAt: markNotified ? "now" : null,
      })
    }
  }

  async listUnnotified(watcher: string): Promise<StoredSighting[]> {
    return this.rows.filter((row) => row.watcher === watcher && row.notifiedAt === null)
  }

  async markNotified(ids: number[]): Promise<void> {
    for (const row of this.rows) {
      if (ids.includes(row.id)) row.notifiedAt = "now"
    }
  }

  async recordRun(result: WatcherRunResult): Promise<void> {
    this.runs.push({ ...result })
  }
}

function ashbyJob(id: string, title: string, location: string): NormalizedJob {
  return normalizeAshbyJob({
    jobUrl: `https://jobs.ashbyhq.com/featherlessai/${id}`,
    title,
    location,
    isListed: true,
  })
}

const REMOTE_A = ashbyJob("aaa", "ML Engineer", "Remote (world)")
const REMOTE_B = ashbyJob("bbb", "AI Researcher", "Remote (world)")
const ONSITE = ashbyJob("ccc", "Office Manager", "San Francisco Office")

function harness(jobs: NormalizedJob[], notify: (text: string) => Promise<void>) {
  const store = new MemoryStore()
  const sent: string[] = []
  const deps = {
    fetchJobs: async () => jobs,
    store,
    notify: async (text: string) => {
      sent.push(text)
      await notify(text)
    },
  }
  return { store, sent, deps }
}

const succeeds = async () => {}
const fails = async () => {
  throw new Error("Telegram 502")
}

describe("baseline run", () => {
  it("records everything as already notified and sends no per-job alert", async () => {
    const { store, sent, deps } = harness([REMOTE_A, REMOTE_B, ONSITE], succeeds)

    const result = await runWatcher(CONFIG, deps)

    assert.equal(result.ok, true)
    assert.equal(result.baseline, true)
    assert.equal(result.totalCount, 3)
    assert.equal(result.matchedCount, 2)
    assert.equal(result.newCount, 2)
    assert.equal(result.notifiedCount, 0)

    assert.equal(sent.length, 1)
    assert.match(sent[0], /baseline recorded: 2 matching roles/)
    assert.ok(
      store.rows.every((row) => row.notifiedAt !== null),
      "baseline rows must be stamped notified so they are never replayed"
    )
  })

  it("does not re-baseline after a successful run that matched nothing", async () => {
    const { store, deps } = harness([ONSITE], succeeds)

    const first = await runWatcher(CONFIG, deps)
    assert.equal(first.baseline, true)
    assert.equal(store.rows.length, 0)

    // A first run with zero matches leaves no sightings behind. Without the
    // prior-successful-run check this second run would baseline again and
    // silently swallow the alert for a genuinely new role.
    const second = await runWatcher(CONFIG, { ...deps, fetchJobs: async () => [ONSITE, REMOTE_A] })
    assert.equal(second.baseline, false)
    assert.equal(second.notifiedCount, 1)
  })
})

describe("subsequent runs", () => {
  it("alerts once for a new role and stays quiet when nothing changes", async () => {
    const { store, sent, deps } = harness([REMOTE_A], succeeds)

    await runWatcher(CONFIG, deps)
    assert.equal(sent.length, 1)

    const withNewRole = { ...deps, fetchJobs: async () => [REMOTE_A, REMOTE_B] }
    const second = await runWatcher(CONFIG, withNewRole)

    assert.equal(second.baseline, false)
    assert.equal(second.newCount, 1)
    assert.equal(second.notifiedCount, 1)
    assert.equal(sent.length, 2)
    assert.match(sent[1], /1 new role/)
    assert.match(sent[1], /AI Researcher/)
    assert.ok(!sent[1].includes("ML Engineer"), "the baselined role must not be re-announced")

    const third = await runWatcher(CONFIG, withNewRole)
    assert.equal(third.ok, true)
    assert.equal(third.newCount, 0)
    assert.equal(third.notifiedCount, 0)
    assert.equal(sent.length, 2, "an unchanged board sends nothing")
    assert.ok(store.rows.every((row) => row.notifiedAt !== null))
  })

  it("sends one message covering several new roles", async () => {
    const { sent, deps } = harness([ONSITE], succeeds)
    await runWatcher(CONFIG, deps)

    await runWatcher(CONFIG, { ...deps, fetchJobs: async () => [ONSITE, REMOTE_A, REMOTE_B] })

    assert.equal(sent.length, 2)
    assert.match(sent[1], /2 new roles/)
    assert.match(sent[1], /ML Engineer/)
    assert.match(sent[1], /AI Researcher/)
  })
})

describe("failed notification", () => {
  it("leaves the sighting pending and retries it on the next run", async () => {
    const { store, sent, deps } = harness([REMOTE_A], succeeds)
    await runWatcher(CONFIG, deps)

    const failing = {
      ...deps,
      fetchJobs: async () => [REMOTE_A, REMOTE_B],
      notify: async (text: string) => {
        sent.push(text)
        await fails()
      },
    }
    const failed = await runWatcher(CONFIG, failing)

    assert.equal(failed.ok, false)
    assert.match(failed.error ?? "", /Telegram 502/)
    assert.equal(failed.notifiedCount, 0)
    const pending = await store.listUnnotified(CONFIG.id)
    assert.equal(pending.length, 1, "a failed send must not stamp notified_at")
    assert.equal(pending[0].title, "AI Researcher")

    // The retry comes from re-reading the pending rows, not from the diff, so
    // it fires even though this run finds nothing new.
    const retry = await runWatcher(CONFIG, { ...deps, fetchJobs: async () => [REMOTE_A, REMOTE_B] })

    assert.equal(retry.ok, true)
    assert.equal(retry.newCount, 0, "the role is no longer new")
    assert.equal(retry.notifiedCount, 1, "but it was still owed an alert")
    assert.match(sent[sent.length - 1], /AI Researcher/)
    assert.equal((await store.listUnnotified(CONFIG.id)).length, 0)
  })

  it("records the failed run so the admin page can show it", async () => {
    const { store, deps } = harness([REMOTE_A], succeeds)
    await runWatcher(CONFIG, deps)
    await runWatcher(CONFIG, {
      ...deps,
      fetchJobs: async () => [REMOTE_A, REMOTE_B],
      notify: fails,
    })

    assert.equal(store.runs.length, 2)
    assert.equal(store.runs[1].ok, false)
    assert.match(store.runs[1].error ?? "", /Telegram 502/)
  })
})

describe("failed fetch", () => {
  it("records a failed run instead of throwing", async () => {
    const store = new MemoryStore()
    const result = await runWatcher(CONFIG, {
      store,
      fetchJobs: async () => {
        throw new Error("Ashby board \"featherlessai\" returned HTTP 503")
      },
      notify: succeeds,
    })

    assert.equal(result.ok, false)
    assert.match(result.error ?? "", /HTTP 503/)
    assert.equal(store.rows.length, 0)
    assert.equal(store.runs.length, 1)
    assert.equal(store.runs[0].ok, false)
  })

  it("does not count a failed run as the baseline having happened", async () => {
    const store = new MemoryStore()
    const deps = { store, notify: succeeds, fetchJobs: async () => [REMOTE_A] }

    await runWatcher(CONFIG, {
      ...deps,
      fetchJobs: async () => {
        throw new Error("network down")
      },
    })
    const recovered = await runWatcher(CONFIG, deps)

    assert.equal(recovered.baseline, true, "the first successful run is still the baseline")
  })
})
