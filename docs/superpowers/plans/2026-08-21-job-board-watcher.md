# Job-Board Watcher Plan

**Goal:** A daily Vercel cron that polls Featherless AI's Ashby job board, records new matching
openings in Neon, sends one Telegram alert, and surfaces run health in a read-only admin section.

**Scope guard:** Admin-only. No public routes, nav entries, sitemap entries, or site copy. `CLAUDE.md`
states John is not job hunting; nothing about this feature may become visible to a site visitor.

**Constraints:** No new dependencies. TypeScript strict, no `any`. Do not touch invoicing, chat, or
circuit code.

---

## Source of truth

`GET https://api.ashbyhq.com/posting-api/job-board/featherlessai?includeCompensation=true` (no auth).

Verified live on 2026-08-21: HTTP 200, `{ jobs: [...], apiVersion }`, 15 jobs. Shape notes that drive
the normalizer:

- `isRemote` is `boolean | null` — 8 of 15 jobs have `null` while their `location` reads "Remote (world)".
  A truthiness check alone would miss them, which is why the text blob matters.
- `workplaceType` is `"OnSite" | "Remote" | "Hybrid" | null`.
- `address` is `{ postalAddress: {...} } | null`; `postalAddress` fields are individually optional
  (one job has only `addressCountry`).
- `secondaryLocations[]` entries carry `location` plus a nullable `address`.
- **Berlin only ever appears as a secondary location** (on "Business Development Rep (AI Cloud)",
  whose primary `location` is "Europe"). Flattening secondary locations into the blob is what makes
  the city rule work at all.
- No `isListed: false` job and no Singapore role exist in the live board today, so those paths get
  synthetic fixtures in the tests.

## Matching rules

1. Skip `isListed === false`.
2. Build a lowercase **location blob** from `location`, `workplaceType`, every
   `secondaryLocations[].location`, every secondary `address.postalAddress.{addressLocality,
   addressRegion,addressCountry}`, and the top-level `address.postalAddress.*`.
3. Match if remote (`isRemote === true`, or `workplaceType === "Remote"`, or blob contains "remote")
   **or** the blob contains a configured city.
4. Record which rules fired: `remote:flag`, `remote:workplace`, `remote:text`, `city:berlin`.
5. An exclude pattern matching title-or-blob (case-insensitive substring) vetoes the whole match.
   Starts empty, wired end to end.
6. Stable identity = `jobUrl`, falling back to `title::location`.

---

## Components

### 1. `db/migrations/005_watchers.sql`

Plain SQL, numbered like 001–004. Applied manually; no runner.

- `watcher_runs` — id, watcher, ran_at, ok, new_count, matched_count, total_count, error.
- `watcher_sightings` — id, watcher, external_key, title, location, url, matched_reasons `text[]`,
  payload `jsonb`, first_seen, last_seen, notified_at, `UNIQUE (watcher, external_key)`.
- Partial index on `(watcher) WHERE notified_at IS NULL` — the pending-alert query is the hot path.

### 2. `lib/watchers/` — pure domain module, no Next.js imports

Mirrors `lib/invoicing/`: its own `db.ts` on the `neon()` tagged-template pattern from `lib/db.ts`.

| File | Responsibility |
| --- | --- |
| `types.ts` | `WatcherConfig`, `NormalizedJob`, `Sighting`, `StoredSighting`, `WatcherRunResult` |
| `config.ts` | `WATCHERS` array. One entry: featherless. **Config lives in code — no config UI, ever.** |
| `ashby.ts` | Fetch + normalize to `NormalizedJob`, including blob construction |
| `match.ts` | Pure matching + the known/fresh diff |
| `telegram.ts` | `sendMessage`, HTML escaping, 4096-char chunking |
| `db.ts` | `WatcherStore` implementation over Neon |
| `run.ts` | Orchestration, with injectable deps so tests need no network or DB |
| `validate.ts` | Ingest-payload validators + `ValidationError` |

**`run.ts` order of operations**

1. Fetch → match → `sightings`.
2. Read known external keys + whether any prior **successful** run exists.
3. `baseline = no known keys && no prior successful run`. Checking the run table too means a first run
   that legitimately matched zero jobs cannot silently re-baseline (and swallow) the next run's finds.
4. Upsert: insert new rows, bump `last_seen` on existing. `notified_at` is `NOW()` on a baseline
   insert and `NULL` otherwise. **`ON CONFLICT` never touches `notified_at`.**
5. Baseline → send the one-liner "baseline recorded: N matching roles", no per-job alerts.
6. Otherwise select every row with `notified_at IS NULL` (this naturally includes rows stranded by a
   previous failed send — that is the retry) and send ONE summary message.
7. **Only on send success**, set `notified_at`. A failed send records `ok: false` and leaves the rows
   pending so the next run retries.
8. Record a `watcher_runs` row on every path, including fetch failure.

Baseline caveat to document in code: baseline rows are marked notified at insert, so a failed baseline
one-liner records `ok: false` but does not replay the whole board next run.

### 3. `app/api/cron/watchers/route.ts`

GET, rejects unless `Authorization` equals `Bearer ${CRON_SECRET}` (timing-safe compare). Runs every
configured watcher, returns a JSON summary.

`vercel.json` (new file) gets `{"crons":[{"path":"/api/cron/watchers/","schedule":"0 8 * * *"}]}`.
**The trailing slash is load-bearing:** `next.config.ts` sets `trailingSlash: true`, and Vercel cron
does not follow the resulting 308 — without it the handler never runs. Schedule is UTC; Hobby-plan
crons fire within the hour, not on the minute.

### 4. `app/api/watchers/ingest/route.ts`

POST, bearer auth on `WATCHER_INGEST_TOKEN`, mirroring `lib/invoicing/api-auth.ts` (404 when the token
is unset or under 32 chars, its own rate-limit prefix, timing-safe compare). Accepts
`{ watcher, sightings: [...], run: {...} }` and writes the same tables — this is how the external
flight-scanner bot reports into the same dashboard.

Payloads are untrusted: cap the array length, cap every string, require `http(s)` URLs, cap the
serialized `payload` size, reject non-plain-object payloads.

### 5. `app/admin/(dashboard)/watchers/page.tsx`

Read-only server component in the existing dashboard visual language (`bg-bg-surface`, `font-mono`
headers, semantic tokens only). Per watcher: last run time, ok/error, counts, and a
**staleness warning when the newest successful run is older than 36h** — silent cron death being
visible is the entire point of the page. Below that, recent sightings newest-first with matched
reasons and a link out.

The overview unions watcher ids from `WATCHERS` with ids already in the DB, so an ingest-only watcher
still appears. Adds a "Watchers" link to `components/admin/admin-nav.tsx` and a "Run now" server
action that reuses the admin session and calls the core directly rather than the HTTP route.

---

## Verification

- [x] `curl` the Ashby endpoint and inspect the real payload before writing the normalizer.
- [ ] `pnpm test:watchers` — node test runner, mirroring `test:invoicing`. Covers: secondary-location
      match (Berlin), unlisted exclusion, exclude-pattern veto, baseline run, new-job run, and
      failed-notify-retries with a mocked Telegram.
- [ ] `pnpm lint` and `pnpm build` clean.
- [ ] Exercise the cron route locally with a throwaway `CRON_SECRET`.

## Hand-off

Env vars to set in Vercel: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CRON_SECRET`,
`WATCHER_INGEST_TOKEN`. Run `db/migrations/005_watchers.sql` against Neon. The first production run
records a baseline and sends no per-job alerts.
