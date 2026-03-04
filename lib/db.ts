import { neon } from "@neondatabase/serverless"

// neon() returns a tagged-template SQL client that uses HTTP under the hood,
// making it compatible with Vercel's Edge runtime (no raw TCP sockets).
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }
  return neon(process.env.DATABASE_URL)
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
  messages: StoredMessage[]
): Promise<void> {
  const sql = getDb()
  const ipHash = await hashIp(ip)
  const messageCount = messages.length

  await sql`
    INSERT INTO conversations (id, ip_hash, messages, message_count)
    VALUES (
      ${sessionId},
      ${ipHash},
      ${JSON.stringify(messages)},
      ${messageCount}
    )
    ON CONFLICT (id) DO UPDATE SET
      messages      = EXCLUDED.messages,
      message_count = EXCLUDED.message_count,
      updated_at    = NOW()
  `
}
