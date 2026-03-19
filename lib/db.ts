import { neon } from "@neondatabase/serverless"

// neon() returns a tagged-template SQL client that uses HTTP under the hood,
// making it compatible with Vercel's Edge runtime (no raw TCP sockets).
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }
  return neon(process.env.DATABASE_URL)
}

export interface Comment {
  id: number
  post_slug: string
  author: string
  body: string
  created_at: string
}

export async function getComments(postSlug: string): Promise<Comment[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql`
    SELECT id, post_slug, author, body, created_at
    FROM comments
    WHERE post_slug = ${postSlug}
    ORDER BY created_at ASC
  `
  return rows as Comment[]
}

export async function insertComment(
  postSlug: string,
  author: string,
  body: string
): Promise<Comment> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO comments (post_slug, author, body)
    VALUES (${postSlug}, ${author}, ${body})
    RETURNING id, post_slug, author, body, created_at
  `
  return rows[0] as Comment
}

export interface StoredMessage {
  role: "user" | "assistant"
  content: string
}

/**
 * Hash an IP address with SHA-256 so we can correlate sessions from the
 * same visitor without storing their raw IP. The first 16 hex chars are
 * enough for identification purposes.
 */
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16)
}

/**
 * Upsert a conversation record after each exchange. The session ID comes
 * from the client (a UUID generated when the chat panel mounts) so that
 * all messages in one session are grouped under the same row.
 *
 * ON CONFLICT updates the messages array and timestamp in place, so the
 * table always holds the latest full conversation per session.
 */
export async function upsertConversation(
  sessionId: string,
  ip: string,
  messages: StoredMessage[],
  geo?: { city?: string; country?: string }
): Promise<void> {
  const sql = getDb()
  const ipHash = await hashIp(ip)
  const messageCount = messages.length
  const city = geo?.city ?? null
  const country = geo?.country ?? null

  await sql`
    INSERT INTO conversations (id, ip_hash, messages, message_count, city, country)
    VALUES (
      ${sessionId},
      ${ipHash},
      ${JSON.stringify(messages)},
      ${messageCount},
      ${city},
      ${country}
    )
    ON CONFLICT (id) DO UPDATE SET
      messages      = EXCLUDED.messages,
      message_count = EXCLUDED.message_count,
      city          = COALESCE(EXCLUDED.city, conversations.city),
      country       = COALESCE(EXCLUDED.country, conversations.country),
      updated_at    = NOW()
  `
}

export interface ChatSession {
  id: string
  ip_hash: string
  messages: StoredMessage[]
  message_count: number
  updated_at: string
  city: string | null
  country: string | null
}

export async function getCommentCount(): Promise<number> {
  if (!process.env.DATABASE_URL) return 0
  const sql = getDb()
  const rows = await sql`SELECT COUNT(*)::int AS count FROM comments`
  return rows[0].count
}

export async function getChatCount(): Promise<number> {
  if (!process.env.DATABASE_URL) return 0
  const sql = getDb()
  const rows = await sql`SELECT COUNT(*)::int AS count FROM conversations`
  return rows[0].count
}

export async function getAllComments(): Promise<Comment[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql`SELECT id, post_slug, author, body, created_at FROM comments ORDER BY created_at DESC`
  return rows as Comment[]
}

export async function getRecentComments(limit: number): Promise<Comment[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql`SELECT id, post_slug, author, body, created_at FROM comments ORDER BY created_at DESC LIMIT ${limit}`
  return rows as Comment[]
}

export interface ChatPreviewRow {
  id: string
  message_count: number
  updated_at: string
  city: string | null
  country: string | null
  first_message: string | null
}

export async function getAllChats(): Promise<ChatPreviewRow[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql`
    SELECT id, message_count, updated_at, city, country,
      messages->0->>'content' AS first_message
    FROM conversations ORDER BY updated_at DESC
  `
  return rows as ChatPreviewRow[]
}

export async function getRecentChats(limit: number): Promise<ChatPreviewRow[]> {
  if (!process.env.DATABASE_URL) return []
  const sql = getDb()
  const rows = await sql`
    SELECT id, message_count, updated_at, city, country,
      messages->0->>'content' AS first_message
    FROM conversations ORDER BY updated_at DESC LIMIT ${limit}
  `
  return rows as ChatPreviewRow[]
}

export async function getChatSession(id: string): Promise<ChatSession | null> {
  if (!process.env.DATABASE_URL) return null
  const sql = getDb()
  const rows = await sql`SELECT id, ip_hash, messages, message_count, updated_at, city, country FROM conversations WHERE id = ${id}`
  if (rows.length === 0) return null
  return rows[0] as ChatSession
}

export async function deleteComment(id: number): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM comments WHERE id = ${id}`
}

export async function deleteChat(id: string): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM conversations WHERE id = ${id}`
}
