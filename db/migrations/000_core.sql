-- Core site schema: blog comments and chatbot conversations.
--
-- Numbered 000 because both tables predate the numbered migrations. They were
-- created by hand against production and existed nowhere in the repo, so a
-- fresh branch could not be built from this directory alone. Captured here
-- from the live schema; running it against production is a no-op.

CREATE TABLE IF NOT EXISTS comments (
  id          SERIAL PRIMARY KEY,
  post_slug   TEXT NOT NULL,
  author      TEXT NOT NULL DEFAULT 'Anonymous',
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments (post_slug);

-- One row per chat session, upserted after each exchange rather than appended
-- to, so `messages` always holds the full conversation. `id` is the client's
-- session UUID; `user_id` is the longer-lived localStorage id that correlates
-- several sessions from one visitor.
CREATE TABLE IF NOT EXISTS conversations (
  id             TEXT PRIMARY KEY,
  ip_hash        TEXT,
  messages       JSONB NOT NULL DEFAULT '[]'::JSONB,
  message_count  INT NOT NULL DEFAULT 0,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  city           TEXT,
  country        TEXT,
  user_id        TEXT
);

CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations (user_id);
