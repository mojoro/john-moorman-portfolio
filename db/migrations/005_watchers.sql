-- Job-board watcher schema
-- Run against a Neon dev branch first, then promote once verified.

-- One row per watcher execution, successful or not. A watcher that stops
-- producing rows is the signal the admin page watches for: silent cron death
-- looks exactly like success unless the run itself is recorded.
CREATE TABLE IF NOT EXISTS watcher_runs (
  id             SERIAL PRIMARY KEY,
  watcher        TEXT NOT NULL,
  ran_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ok             BOOLEAN NOT NULL,
  new_count      INT NOT NULL DEFAULT 0,
  matched_count  INT NOT NULL DEFAULT 0,
  total_count    INT NOT NULL DEFAULT 0,
  error          TEXT
);

CREATE INDEX IF NOT EXISTS watcher_runs_watcher_ran_at_idx
  ON watcher_runs (watcher, ran_at DESC);

-- One row per distinct opening ever seen. notified_at is the alert ledger:
-- NULL means "owed an alert", and it is only ever stamped after a send
-- succeeds, so a failed Telegram call retries on the next run instead of
-- losing the notification.
CREATE TABLE IF NOT EXISTS watcher_sightings (
  id              SERIAL PRIMARY KEY,
  watcher         TEXT NOT NULL,
  external_key    TEXT NOT NULL,
  title           TEXT NOT NULL,
  location        TEXT NOT NULL DEFAULT '',
  url             TEXT NOT NULL DEFAULT '',
  matched_reasons TEXT[] NOT NULL DEFAULT '{}',
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  first_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_at     TIMESTAMPTZ,
  UNIQUE (watcher, external_key)
);

CREATE INDEX IF NOT EXISTS watcher_sightings_watcher_first_seen_idx
  ON watcher_sightings (watcher, first_seen DESC);

-- The pending-alert lookup runs on every execution and matches almost nothing
-- once the board is steady, so it earns a partial index.
CREATE INDEX IF NOT EXISTS watcher_sightings_pending_idx
  ON watcher_sightings (watcher) WHERE notified_at IS NULL;
